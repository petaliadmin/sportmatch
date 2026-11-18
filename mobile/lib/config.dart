/// Configuration injectée au build : flutter run --dart-define=API_URL=... --dart-define=KEYCLOAK_URL=...
/// Valeurs par défaut : émulateur Android (10.0.2.2 = le poste hôte) avec l'environnement local démarré.
class AppConfig {
  static const apiUrl = String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:8080');
  static const keycloakUrl = String.fromEnvironment('KEYCLOAK_URL', defaultValue: 'http://10.0.2.2:8180');
  static const realm = 'sportmatch';
  static const clientId = 'sportmatch-mobile';
  static const redirectUrl = 'com.sportmatch.app:/oauthredirect';

  static String get issuer => '$keycloakUrl/realms/$realm';

  /// HTTP en clair autorisé uniquement pour un environnement local (jamais en staging/production).
  static bool get allowInsecure => apiUrl.startsWith('http://') || keycloakUrl.startsWith('http://');

  static String wsUrl(String path) => apiUrl.replaceFirst(RegExp('^http'), 'ws') + path;

  /// Centre de Dakar (Plateau), utilisé si la localisation est refusée.
  static const dakarLat = 14.6928;
  static const dakarLng = -17.4467;
}
