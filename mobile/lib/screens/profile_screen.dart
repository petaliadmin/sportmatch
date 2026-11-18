import 'package:flutter/material.dart';

import '../api/models.dart';
import '../app.dart';
import '../ui/format.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';
import 'home_shell.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  int _version = 0;

  @override
  Widget build(BuildContext context) {
    final scope = AppScope.of(context);
    final user = scope.session.user;
    if (user == null) return const SignInPrompt(message: 'Connecte-toi pour retrouver tes réservations et tes notifications.');
    return ListView(padding: const EdgeInsets.only(bottom: 24), children: [
      TabHeader(user.name,
          subtitle: user.email,
          action: IconButton(tooltip: 'Se déconnecter', onPressed: scope.session.signOut, icon: const Icon(Icons.logout))),
      const _Section('Mes réservations'),
      Loader<List<Booking>>(
        key: ValueKey('b$_version'),
        embedded: true,
        load: scope.api.myBookings,
        empty: const EmptyState(icon: Icons.event_available, title: 'Aucune réservation', message: 'Réserve un créneau depuis l\'onglet Terrains.'),
        builder: (context, bookings, reload) => Column(children: [
          for (final b in bookings)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Card(
                child: ListTile(
                  title: Text('${b.courtName} · ${b.venueName}'),
                  subtitle: Text('${dakarDateTime(b.startsAt)} → ${dakarTime(b.endsAt)} · ${fcfa(b.priceFcfa)} (démo)'),
                  trailing: b.cancellable
                      ? TextButton(
                          onPressed: () async {
                            final r = await runAction(context, () => scope.api.cancelBooking(b.id), success: 'Réservation annulée');
                            if (r != null) setState(() => _version++);
                          },
                          child: const Text('Annuler'))
                      : Pill(b.status == 'CONFIRMED' ? 'Passée' : 'Annulée', color: Brand.muted),
                ),
              ),
            ),
        ]),
      ),
      const _Section('Notifications'),
      Loader<List<NotificationItem>>(
        key: ValueKey('n$_version'),
        embedded: true,
        load: scope.api.notifications,
        empty: const EmptyState(icon: Icons.notifications_none, title: 'Rien de neuf', message: 'Matchs, réservations et tournois s\'affichent ici.'),
        builder: (context, items, _) => Column(children: [
          for (final n in items.take(20))
            ListTile(
              leading: const Icon(Icons.notifications_active_outlined, color: Brand.lime),
              title: Text(n.title, style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text('${n.body}\n${dakarDateTime(n.createdAt)}'),
              isThreeLine: true,
            ),
        ]),
      ),
    ]);
  }
}

class _Section extends StatelessWidget {
  const _Section(this.title);

  final String title;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
        child: Text(title.toUpperCase(), style: const TextStyle(color: Brand.muted, fontWeight: FontWeight.w700, letterSpacing: 1)),
      );
}
