import 'dart:async';

import 'package:flutter/material.dart';

import '../app.dart';

import 'chat_screen.dart';
import 'matches_screen.dart';
import 'profile_screen.dart';
import 'tournaments_screen.dart';
import 'venues_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _tab = 0;
  int _unread = 0;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _poll = Timer.periodic(const Duration(seconds: 30), (_) => _refreshUnread());
    WidgetsBinding.instance.addPostFrameCallback((_) => _refreshUnread());
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  /// Nombre de notifications non lues, affiché en pastille sur l'onglet Profil.
  Future<void> _refreshUnread() async {
    if (!mounted) return;
    final scope = AppScope.of(context);
    if (!scope.session.signedIn) {
      if (_unread != 0) setState(() => _unread = 0);
      return;
    }
    try {
      final n = await scope.api.unreadCount();
      if (mounted && n != _unread) setState(() => _unread = n);
    } catch (_) {
      // hors ligne ou réponse inattendue : on garde la dernière valeur
    }
  }

  @override
  Widget build(BuildContext context) => UnreadBadge(
      onRefresh: _refreshUnread,
      child: Scaffold(
        body: SafeArea(
          child: IndexedStack(index: _tab, children: const [
            VenuesScreen(),
            MatchesScreen(),
            TournamentsScreen(),
            ChatListScreen(),
            ProfileScreen(),
          ]),
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _tab,
          destinations: [
            const NavigationDestination(icon: Icon(Icons.place_outlined), selectedIcon: Icon(Icons.place), label: 'Terrains'),
            const NavigationDestination(icon: Icon(Icons.sports_soccer_outlined), selectedIcon: Icon(Icons.sports_soccer), label: 'Matchs'),
            const NavigationDestination(icon: Icon(Icons.emoji_events_outlined), selectedIcon: Icon(Icons.emoji_events), label: 'Tournois'),
            const NavigationDestination(icon: Icon(Icons.chat_bubble_outline), selectedIcon: Icon(Icons.chat_bubble), label: 'Chat'),
            NavigationDestination(
              icon: Badge(isLabelVisible: _unread > 0, label: Text('$_unread'), child: const Icon(Icons.person_outline)),
              selectedIcon: Badge(isLabelVisible: _unread > 0, label: Text('$_unread'), child: const Icon(Icons.person)),
              label: 'Profil',
              tooltip: _unread > 0 ? 'Profil, $_unread notification(s) non lue(s)' : 'Profil',
            ),
          ],
          onDestinationSelected: (i) {
            setState(() => _tab = i);
            _refreshUnread();
          },
        ),
      ));
}

/// Permet aux écrans de demander un rafraîchissement de la pastille (après lecture d'une notification).
class UnreadBadge extends InheritedWidget {
  const UnreadBadge({super.key, required this.onRefresh, required super.child});

  final Future<void> Function() onRefresh;

  static void refresh(BuildContext context) => context.getInheritedWidgetOfExactType<UnreadBadge>()?.onRefresh();

  @override
  bool updateShouldNotify(UnreadBadge oldWidget) => false;
}

/// En-tête commun des onglets.
class TabHeader extends StatelessWidget {
  const TabHeader(this.title, {super.key, this.subtitle, this.action});

  final String title;
  final String? subtitle;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
        child: Row(children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
              if (subtitle != null) Text(subtitle!, style: const TextStyle(color: Color(0xFF9AA8A2))),
            ]),
          ),
          if (action != null) action!,
        ]),
      );
}
