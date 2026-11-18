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

  Future<void> _edit(PlayerProfile current) async {
    final scope = AppScope.of(context);
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => AppScope(session: scope.session, api: scope.api, child: _EditProfileSheet(current: current)),
    );
    if (saved == true) setState(() => _version++);
  }

  @override
  Widget build(BuildContext context) {
    final scope = AppScope.of(context);
    final user = scope.session.user;
    if (user == null) return const SignInPrompt(message: 'Connecte-toi pour retrouver tes réservations et tes notifications.');
    return ListView(padding: const EdgeInsets.only(bottom: 24), children: [
      TabHeader(user.name,
          subtitle: user.email,
          action: IconButton(tooltip: 'Se déconnecter', onPressed: scope.session.signOut, icon: const Icon(Icons.logout))),
      Loader<PlayerProfile>(
        key: ValueKey('p$_version'),
        embedded: true,
        load: scope.api.myProfile,
        builder: (context, p, _) => Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(child: Text(p.displayName, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18))),
                  TextButton.icon(onPressed: () => _edit(p), icon: const Icon(Icons.edit_outlined, size: 18), label: const Text('Modifier')),
                ]),
                Text(_details(p) ?? 'Complète ton profil pour trouver des joueurs de ton niveau', style: const TextStyle(color: Brand.muted)),
                const SizedBox(height: 12),
                Row(children: [
                  _Stat(label: 'Matchs', value: '${p.stats.matchesJoined}'),
                  _Stat(label: 'Organisés', value: '${p.stats.matchesOrganized}'),
                  _Stat(label: 'Fiabilité', value: p.stats.reliabilityPercent == null ? 'Nouveau' : '${p.stats.reliabilityPercent} %'),
                ]),
              ]),
            ),
          ),
        ),
      ),
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
      Row(children: [
        const Expanded(child: _Section('Notifications')),
        Padding(
          padding: const EdgeInsets.only(right: 12, top: 12),
          child: TextButton(
              onPressed: () async {
                final r = await runAction(context, () async {
                  await scope.api.markAllRead();
                  return true;
                });
                if (r != null) {
                  setState(() => _version++);
                  UnreadBadge.refresh(context);
                }
              },
              child: const Text('Tout marquer lu')),
        ),
      ]),
      Loader<List<NotificationItem>>(
        key: ValueKey('n$_version'),
        embedded: true,
        load: scope.api.notifications,
        empty: const EmptyState(icon: Icons.notifications_none, title: 'Rien de neuf', message: 'Matchs, réservations et tournois s\'affichent ici.'),
        builder: (context, items, reload) => Column(children: [
          for (final n in items.take(30))
            ListTile(
              leading: Icon(n.unread ? Icons.notifications_active : Icons.notifications_none, color: n.unread ? Brand.lime : Brand.muted),
              title: Text(n.title, style: TextStyle(fontWeight: n.unread ? FontWeight.w800 : FontWeight.w500)),
              subtitle: Text('${n.body}\n${dakarDateTime(n.createdAt)}'),
              isThreeLine: true,
              onTap: n.unread
                  ? () async {
                      try {
                        await scope.api.markRead(n.id);
                      } on Exception {
                        // hors ligne : la notification reste non lue
                      }
                      await reload();
                      if (context.mounted) UnreadBadge.refresh(context);
                    }
                  : null,
            ),
        ]),
      ),
    ]);
  }
}

String? _details(PlayerProfile p) {
  final parts = [if (p.favoriteSport != null) sportName(p.favoriteSport!), if (p.level != null) levelName(p.level!), if (p.district != null) p.district!];
  return parts.isEmpty ? null : parts.join(' · ');
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(value, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20)),
          Text(label, style: const TextStyle(color: Brand.muted, fontSize: 12)),
        ]),
      );
}

class _EditProfileSheet extends StatefulWidget {
  const _EditProfileSheet({required this.current});

  final PlayerProfile current;

  @override
  State<_EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends State<_EditProfileSheet> {
  late final _name = TextEditingController(text: widget.current.displayName);
  late final _district = TextEditingController(text: widget.current.district ?? '');
  late final _bio = TextEditingController(text: widget.current.bio ?? '');
  late String? _sport = widget.current.favoriteSport;
  late String? _level = widget.current.level;
  bool _busy = false;

  @override
  void dispose() {
    _name.dispose();
    _district.dispose();
    _bio.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_name.text.trim().isEmpty) return;
    setState(() => _busy = true);
    final api = AppScope.of(context).api;
    final r = await runAction(
        context,
        () => api.updateProfile(
            displayName: _name.text.trim(), favoriteSport: _sport, level: _level, district: _district.text.trim(), bio: _bio.text.trim()),
        success: 'Profil enregistré');
    if (!mounted) return;
    setState(() => _busy = false);
    if (r != null) Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + MediaQuery.of(context).viewInsets.bottom),
        child: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Text('Mon profil', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            TextField(controller: _name, maxLength: 120, decoration: const InputDecoration(labelText: 'Nom affiché')),
            DropdownButtonFormField<String?>(
              initialValue: _sport,
              decoration: const InputDecoration(labelText: 'Sport préféré'),
              items: [
                const DropdownMenuItem<String?>(value: null, child: Text('—')),
                for (final s in const ['FOOTBALL', 'BASKETBALL', 'TENNIS', 'PADEL']) DropdownMenuItem<String?>(value: s, child: Text(sportName(s))),
              ],
              onChanged: (v) => setState(() => _sport = v),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String?>(
              initialValue: _level,
              decoration: const InputDecoration(labelText: 'Niveau'),
              items: [
                const DropdownMenuItem<String?>(value: null, child: Text('—')),
                for (final l in const ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']) DropdownMenuItem<String?>(value: l, child: Text(levelName(l))),
              ],
              onChanged: (v) => setState(() => _level = v),
            ),
            const SizedBox(height: 12),
            TextField(controller: _district, maxLength: 80, decoration: const InputDecoration(labelText: 'Quartier', hintText: 'Mermoz, Ngor, Plateau…')),
            TextField(controller: _bio, maxLength: 280, maxLines: 2, decoration: const InputDecoration(labelText: 'Présentation')),
            const SizedBox(height: 12),
            FilledButton(onPressed: _busy ? null : _save, child: Text(_busy ? 'Enregistrement…' : 'Enregistrer')),
          ]),
        ),
      );
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
