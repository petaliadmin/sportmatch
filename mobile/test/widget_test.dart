import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:sportmatch_mobile/api/api_client.dart';
import 'package:sportmatch_mobile/app.dart';
import 'package:sportmatch_mobile/auth/session.dart';

String fakeJwt(Map<String, Object> claims) =>
    'e30.${base64Url.encode(utf8.encode(jsonEncode(claims))).replaceAll('=', '')}.signature';

http.Response json(Object body) => http.Response.bytes(utf8.encode(jsonEncode(body)), 200);

ApiClient fakeApi() => ApiClient(
      baseUrl: 'http://api.test',
      httpClient: MockClient((req) async {
        switch (req.url.path) {
          case '/api/v1/venues/nearby':
            return json([
              {'id': 'v1', 'name': 'Arena Almadies Five', 'district': 'Almadies', 'sport': 'FOOTBALL', 'pricePerHourFcfa': 30000, 'distanceKm': 9.4},
            ]);
          case '/api/v1/matches':
            return json([
              {
                'id': 'm1', 'venueId': 'v1', 'venueName': 'Arena Almadies Five', 'sport': 'FOOTBALL',
                'startsAt': '2030-06-15T18:00:00Z', 'durationMinutes': 90, 'maxPlayers': 10, 'level': 'INTERMEDIATE',
                'organizerId': 'awa', 'status': 'OPEN', 'participants': 4,
              },
            ]);
          default:
            return json([]);
        }
      }),
    );

void main() {
  setUpAll(() => initializeDateFormatting('fr_FR'));

  testWidgets('les terrains à proximité s\'affichent sans connexion', (tester) async {
    await tester.pumpWidget(SportMatchApp(session: Session(store: MemoryTokenStore()), api: fakeApi()));
    await tester.pumpAndSettle();

    expect(find.text('Arena Almadies Five'), findsOneWidget);
    expect(find.text('30 000 FCFA / heure'), findsOneWidget);
    expect(find.text('9,4 km'), findsOneWidget);
  });

  testWidgets('onglet Matchs : progression et organisateur reconnu', (tester) async {
    final session = Session(store: MemoryTokenStore())..signInWithToken(fakeJwt({'sub': 'awa', 'name': 'Awa Ndiaye'}));
    await tester.pumpWidget(SportMatchApp(session: session, api: fakeApi()));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Matchs'));
    await tester.pumpAndSettle();

    expect(find.text('4/10'), findsOneWidget);
    expect(find.text('Organisé par toi'), findsOneWidget);
    expect(find.text('Rejoindre'), findsNothing);
  });

  testWidgets('le chat demande une connexion', (tester) async {
    await tester.pumpWidget(SportMatchApp(session: Session(store: MemoryTokenStore()), api: fakeApi()));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Chat'));
    await tester.pumpAndSettle();

    expect(find.text('Se connecter'), findsOneWidget);
  });

  test('identité lue dans le jeton', () {
    final user = SessionUser.fromJwt(fakeJwt({'sub': 'u-1', 'name': 'Moussa Diop', 'email': 'moussa@demo.sportmatch.test'}));
    expect(user.id, 'u-1');
    expect(user.name, 'Moussa Diop');
    expect(user.email, 'moussa@demo.sportmatch.test');
  });
}
