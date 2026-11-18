import 'package:flutter/material.dart';

import 'api/api_client.dart';
import 'auth/session.dart';
import 'screens/home_shell.dart';
import 'ui/theme.dart';

/// Donne accès à la session et au client API dans tout l'arbre de widgets.
class AppScope extends InheritedNotifier<Session> {
  const AppScope({super.key, required Session session, required this.api, required super.child})
      : super(notifier: session);

  final ApiClient api;

  Session get session => notifier!;

  static AppScope of(BuildContext context) => context.dependOnInheritedWidgetOfExactType<AppScope>()!;
}

class SportMatchApp extends StatelessWidget {
  const SportMatchApp({super.key, required this.session, required this.api});

  final Session session;
  final ApiClient api;

  @override
  Widget build(BuildContext context) => AppScope(
        session: session,
        api: api,
        child: MaterialApp(
          title: 'SportMatch',
          debugShowCheckedModeBanner: false,
          theme: sportMatchTheme(),
          home: const HomeShell(),
        ),
      );
}

/// Invite à se connecter (affichée dans les onglets qui demandent un compte).
class SignInPrompt extends StatelessWidget {
  const SignInPrompt({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final session = AppScope.of(context).session;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.lock_outline_rounded, size: 44, color: Brand.lime),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: session.busy ? null : () => session.signIn().catchError((Object e) {
              if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Connexion annulée : $e')));
            }),
            icon: const Icon(Icons.login_rounded),
            label: const Text('Se connecter'),
          ),
        ]),
      ),
    );
  }
}
