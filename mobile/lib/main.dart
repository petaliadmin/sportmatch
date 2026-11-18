import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'api/api_client.dart';
import 'app.dart';
import 'auth/session.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('fr_FR');
  final session = Session();
  await session.restore();
  runApp(SportMatchApp(session: session, api: ApiClient(token: session.token)));
}
