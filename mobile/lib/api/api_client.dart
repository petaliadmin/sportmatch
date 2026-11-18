import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config.dart';
import 'models.dart';

/// Erreur renvoyée par l'API (corps RFC 9457 : le champ `detail` est lisible par l'utilisateur).
class ApiException implements Exception {
  ApiException(this.status, this.message);

  final int status;
  final String message;

  @override
  String toString() => message;
}

typedef TokenProvider = Future<String?> Function();

/// Client de la gateway SportMatch. Le jeton est demandé à chaque appel (rafraîchi si besoin par la session).
class ApiClient {
  ApiClient({http.Client? httpClient, TokenProvider? token, String? baseUrl})
      : _http = httpClient ?? http.Client(),
        _token = token ?? (() async => null),
        _base = baseUrl ?? AppConfig.apiUrl;

  final http.Client _http;
  final TokenProvider _token;
  final String _base;

  Future<dynamic> _send(String method, String path, [Object? body]) async {
    final headers = <String, String>{'Accept': 'application/json'};
    final token = await _token();
    if (token != null) headers['Authorization'] = 'Bearer $token';
    if (body != null) headers['Content-Type'] = 'application/json';
    final request = http.Request(method, Uri.parse('$_base$path'))..headers.addAll(headers);
    if (body != null) request.body = jsonEncode(body);

    http.Response response;
    try {
      response = await http.Response.fromStream(await _http.send(request).timeout(const Duration(seconds: 15)));
    } on Exception {
      throw ApiException(0, 'Serveur injoignable. Vérifie ta connexion.');
    }
    final text = utf8.decode(response.bodyBytes);
    if (response.statusCode >= 400) {
      var message = response.statusCode == 401 ? 'Connecte-toi pour continuer.' : 'Erreur ${response.statusCode}';
      try {
        final problem = jsonDecode(text) as Map<String, dynamic>;
        message = (problem['detail'] ?? problem['title'] ?? message) as String;
      } on FormatException {
        // corps non JSON : on garde le message générique
      }
      throw ApiException(response.statusCode, message);
    }
    return text.isEmpty ? null : jsonDecode(text);
  }

  Future<List<T>> _list<T>(String path, T Function(Map<String, dynamic>) parse) async =>
      ((await _send('GET', path)) as List).map((e) => parse(e as Map<String, dynamic>)).toList();

  // ---- Terrains et réservations
  Future<List<Venue>> nearby(double lat, double lng, {double radiusKm = 10, String? sport}) =>
      _list('/api/v1/venues/nearby?lat=$lat&lng=$lng&radiusKm=$radiusKm${sport == null ? '' : '&sport=$sport'}', Venue.fromJson);
  Future<List<Venue>> venues() => _list('/api/v1/venues', Venue.fromJson);
  Future<List<Court>> courts(String venueId) => _list('/api/v1/business/courts?venueId=$venueId', Court.fromJson);
  Future<List<Slot>> availability(String courtId, String isoDate) =>
      _list('/api/v1/business/courts/$courtId/availability?date=$isoDate', Slot.fromJson);
  Future<Booking> book(String courtId, DateTime startsAt, int hours) async => Booking.fromJson(await _send(
      'POST', '/api/v1/business/bookings', {'courtId': courtId, 'startsAt': startsAt.toUtc().toIso8601String(), 'hours': hours}));
  Future<List<Booking>> myBookings() => _list('/api/v1/business/bookings/mine', Booking.fromJson);
  Future<Booking> cancelBooking(String id) async =>
      Booking.fromJson(await _send('POST', '/api/v1/business/bookings/$id/cancel', {}));

  // ---- Matchs
  Future<List<SportMatchGame>> matches({String status = 'OPEN', String? sport, String? level, DateTime? from, DateTime? to}) {
    final query = <String, String>{
      'status': status,
      if (sport != null) 'sport': sport,
      if (level != null) 'level': level,
      if (from != null) 'from': _day(from),
      if (to != null) 'to': _day(to),
    };
    return _list('/api/v1/matches?${Uri(queryParameters: query).query}', SportMatchGame.fromJson);
  }

  static String _day(DateTime d) => d.toUtc().toIso8601String().substring(0, 10);

  Future<SportMatchGame> match(String id) async => SportMatchGame.fromJson(await _send('GET', '/api/v1/matches/$id'));
  Future<List<SportMatchGame>> myMatches() => _list('/api/v1/matches/mine', SportMatchGame.fromJson);
  Future<List<Participant>> participants(String matchId) =>
      _list('/api/v1/matches/$matchId/participants', Participant.fromJson);
  Future<SportMatchGame> leaveMatch(String id) async =>
      SportMatchGame.fromJson(await _send('POST', '/api/v1/matches/$id/leave', {}));
  Future<SportMatchGame> cancelMatch(String id) async =>
      SportMatchGame.fromJson(await _send('POST', '/api/v1/matches/$id/cancel', {}));
  Future<List<Participant>> markAttendance(String matchId, String playerId, bool present) async =>
      ((await _send('POST', '/api/v1/matches/$matchId/attendance', {'playerId': playerId, 'present': present})) as List)
          .map((e) => Participant.fromJson(e as Map<String, dynamic>))
          .toList();
  Future<SportMatchGame> createMatch({required String venueId, required String sport, required DateTime startsAt,
          required int durationMinutes, required int maxPlayers, required String level, int repeatWeeks = 0}) async =>
      SportMatchGame.fromJson(await _send('POST', '/api/v1/matches', {
        'venueId': venueId,
        'sport': sport,
        'startsAt': startsAt.toUtc().toIso8601String(),
        'durationMinutes': durationMinutes,
        'maxPlayers': maxPlayers,
        'level': level,
        'repeatWeeks': repeatWeeks,
      }));
  Future<SportMatchGame> joinMatch(String id) async =>
      SportMatchGame.fromJson(await _send('POST', '/api/v1/matches/$id/join', {}));

  // ---- Tournois
  Future<List<TournamentSummary>> tournaments() => _list('/api/v1/events/tournaments', TournamentSummary.fromJson);
  Future<TournamentDetail> tournament(String id) async =>
      TournamentDetail.fromJson(await _send('GET', '/api/v1/events/tournaments/$id'));
  Future<TournamentDetail> registerTeam(String id, String name) async =>
      TournamentDetail.fromJson(await _send('POST', '/api/v1/events/tournaments/$id/teams', {'name': name}));

  // ---- Chat et notifications
  Future<List<Conversation>> conversations() => _list('/api/v1/chat/conversations', Conversation.fromJson);
  Future<String> conversationForMatch(String matchId) async =>
      ((await _send('GET', '/api/v1/chat/conversations/by-match/$matchId')) as Map<String, dynamic>)['conversationId'] as String;
  Future<List<ChatMessage>> messages(String conversationId) =>
      _list('/api/v1/chat/conversations/$conversationId/messages', ChatMessage.fromJson);
  Future<ChatMessage> send(String conversationId, String body) async => ChatMessage.fromJson(
      await _send('POST', '/api/v1/chat/conversations/$conversationId/messages', {'body': body}));
  Future<List<NotificationItem>> notifications() => _list('/api/v1/notifications', NotificationItem.fromJson);
  Future<int> unreadCount() async =>
      (((await _send('GET', '/api/v1/notifications/unread-count')) as Map<String, dynamic>)['unread'] as num).toInt();
  Future<void> markRead(String id) => _send('POST', '/api/v1/notifications/$id/read', {});
  Future<void> markAllRead() => _send('POST', '/api/v1/notifications/read-all', {});

  // ---- Profil joueur
  Future<PlayerProfile> myProfile() async => PlayerProfile.fromJson(await _send('GET', '/api/v1/me/profile'));
  Future<PlayerProfile> updateProfile({required String displayName, String? favoriteSport, String? level, String? district, String? bio}) async =>
      PlayerProfile.fromJson(await _send('PUT', '/api/v1/me/profile', {
        'displayName': displayName,
        'favoriteSport': favoriteSport,
        'level': level,
        'district': district,
        'bio': bio,
      }));
  Future<PlayerProfile> player(String id) async =>
      PlayerProfile.fromJson(await _send('GET', '/api/v1/players/${Uri.encodeComponent(id)}'));
}
