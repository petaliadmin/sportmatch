import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:sportmatch_mobile/api/api_client.dart';

void main() {
  test('terrains à proximité : requête, jeton et désérialisation', () async {
    late http.Request seen;
    final api = ApiClient(
      baseUrl: 'http://api.test',
      token: () async => 'jeton-test',
      httpClient: MockClient((req) async {
        seen = req;
        return http.Response.bytes(utf8.encode(jsonEncode([
          {'id': 'v1', 'name': 'Padel House Ngor', 'district': 'Ngor', 'sport': 'PADEL', 'pricePerHourFcfa': 20000, 'rating': 4.9, 'distanceKm': 0.62},
        ])), 200);
      }),
    );

    final venues = await api.nearby(14.75, -17.51, radiusKm: 2, sport: 'PADEL');

    expect(seen.url.path, '/api/v1/venues/nearby');
    expect(seen.url.queryParameters['sport'], 'PADEL');
    expect(seen.headers['Authorization'], 'Bearer jeton-test');
    expect(venues.single.name, 'Padel House Ngor');
    expect(venues.single.distanceKm, closeTo(0.62, 1e-9));
  });

  test("le détail d'une erreur RFC 9457 est remonté tel quel", () async {
    final api = ApiClient(
      baseUrl: 'http://api.test',
      httpClient: MockClient((_) async => http.Response.bytes(
          utf8.encode(jsonEncode({'status': 409, 'detail': "Ce créneau vient d'être réservé, choisis-en un autre"})), 409,
          headers: {'content-type': 'application/problem+json'})),
    );

    expect(
      () => api.book('c1', DateTime.utc(2030, 6, 15, 18), 1),
      throwsA(isA<ApiException>().having((e) => e.status, 'status', 409).having((e) => e.message, 'message', contains('vient'))),
    );
  });

  test('401 : invitation à se connecter, sans jeton envoyé', () async {
    final api = ApiClient(
      baseUrl: 'http://api.test',
      httpClient: MockClient((req) async {
        expect(req.headers.containsKey('Authorization'), isFalse);
        return http.Response('', 401);
      }),
    );
    expect(() => api.myBookings(), throwsA(isA<ApiException>().having((e) => e.message, 'message', contains('Connecte-toi'))));
  });

  test('serveur injoignable : message lisible', () async {
    final api = ApiClient(baseUrl: 'http://api.test', httpClient: MockClient((_) async => throw http.ClientException('refused')));
    expect(() => api.matches(), throwsA(isA<ApiException>().having((e) => e.status, 'status', 0)));
  });
}
