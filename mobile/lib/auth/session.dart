import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../config.dart';

/// Stockage du jeton de rafraîchissement (Keystore Android / Keychain iOS ; en mémoire pour les tests).
abstract class TokenStore {
  Future<String?> read();
  Future<void> write(String? value);
}

class SecureTokenStore implements TokenStore {
  static const _key = 'sportmatch.refresh_token';
  final _storage = const FlutterSecureStorage();

  @override
  Future<String?> read() => _storage.read(key: _key);

  @override
  Future<void> write(String? value) =>
      value == null ? _storage.delete(key: _key) : _storage.write(key: _key, value: value);
}

class MemoryTokenStore implements TokenStore {
  String? _value;

  @override
  Future<String?> read() async => _value;

  @override
  Future<void> write(String? value) async => _value = value;
}

class SessionUser {
  SessionUser({required this.id, required this.name, this.email});

  final String id;
  final String name;
  final String? email;

  /// Lit les claims d'un JWT (sans vérifier la signature : c'est le rôle de la gateway).
  factory SessionUser.fromJwt(String jwt) {
    final payload = jwt.split('.')[1];
    final claims = jsonDecode(utf8.decode(base64Url.decode(base64Url.normalize(payload)))) as Map<String, dynamic>;
    return SessionUser(
      id: claims['sub'] as String,
      name: (claims['name'] ?? claims['preferred_username'] ?? 'Joueur·se') as String,
      email: claims['email'] as String?,
    );
  }
}

/// Session OpenID Connect (Keycloak) avec PKCE : connexion dans le navigateur du système,
/// jeton d'accès en mémoire, jeton de rafraîchissement chiffré sur l'appareil.
class Session extends ChangeNotifier {
  Session({TokenStore? store, FlutterAppAuth? appAuth})
      : _store = store ?? SecureTokenStore(),
        _appAuth = appAuth ?? const FlutterAppAuth();

  final TokenStore _store;
  final FlutterAppAuth _appAuth;

  String? _accessToken;
  String? _idToken;
  DateTime? _expiresAt;
  SessionUser? user;
  bool busy = false;

  bool get signedIn => user != null;

  static const _scopes = ['openid', 'profile', 'email', 'offline_access'];

  /// Restaure la session au démarrage à partir du jeton de rafraîchissement.
  Future<void> restore() async {
    final refresh = await _store.read();
    if (refresh == null) return;
    try {
      await _refresh(refresh);
    } on Exception {
      await _store.write(null);
    }
  }

  Future<void> signIn() async {
    busy = true;
    notifyListeners();
    try {
      final r = await _appAuth.authorizeAndExchangeCode(AuthorizationTokenRequest(
        AppConfig.clientId,
        AppConfig.redirectUrl,
        issuer: AppConfig.issuer,
        scopes: _scopes,
        allowInsecureConnections: AppConfig.allowInsecure,
      ));
      _apply(r.accessToken, r.idToken, r.refreshToken, r.accessTokenExpirationDateTime);
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    final idToken = _idToken;
    _accessToken = null;
    _idToken = null;
    user = null;
    await _store.write(null);
    notifyListeners();
    if (idToken != null) {
      try {
        await _appAuth.endSession(EndSessionRequest(
          idTokenHint: idToken,
          postLogoutRedirectUrl: AppConfig.redirectUrl,
          issuer: AppConfig.issuer,
          allowInsecureConnections: AppConfig.allowInsecure,
        ));
      } on Exception {
        // la session locale est déjà fermée ; la session Keycloak expirera d'elle-même
      }
    }
  }

  /// Jeton d'accès valide (rafraîchi 30 s avant expiration), ou null si non connecté.
  Future<String?> token() async {
    if (_accessToken == null) return null;
    if (_expiresAt != null && DateTime.now().isAfter(_expiresAt!.subtract(const Duration(seconds: 30)))) {
      final refresh = await _store.read();
      if (refresh == null) return null;
      try {
        await _refresh(refresh);
      } on Exception {
        await signOut();
        return null;
      }
    }
    return _accessToken;
  }

  Future<void> _refresh(String refreshToken) async {
    final r = await _appAuth.token(TokenRequest(
      AppConfig.clientId,
      AppConfig.redirectUrl,
      issuer: AppConfig.issuer,
      refreshToken: refreshToken,
      scopes: _scopes,
      allowInsecureConnections: AppConfig.allowInsecure,
    ));
    _apply(r.accessToken, r.idToken ?? _idToken, r.refreshToken ?? refreshToken, r.accessTokenExpirationDateTime);
  }

  void _apply(String? access, String? id, String? refresh, DateTime? expiresAt) {
    if (access == null) throw Exception('Jeton absent');
    _accessToken = access;
    _idToken = id;
    _expiresAt = expiresAt;
    user = SessionUser.fromJwt(access);
    _store.write(refresh);
    notifyListeners();
  }

  /// Pour les tests : session déjà ouverte avec un jeton donné.
  @visibleForTesting
  void signInWithToken(String accessToken) {
    _accessToken = accessToken;
    user = SessionUser.fromJwt(accessToken);
    notifyListeners();
  }
}
