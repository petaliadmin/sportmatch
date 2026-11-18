import 'package:flutter/material.dart';

import '../api/models.dart';
import '../app.dart';
import '../ui/format.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';
import 'chat_screen.dart';
import 'home_shell.dart';

class MatchesScreen extends StatefulWidget {
  const MatchesScreen({super.key});

  @override
  State<MatchesScreen> createState() => _MatchesScreenState();
}

class _MatchesScreenState extends State<MatchesScreen> {
  int _version = 0;

  Future<void> _create() async {
    final scope = AppScope.of(context);
    if (!scope.session.signedIn) await scope.session.signIn();
    if (!mounted || !scope.session.signedIn) return;
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => AppScope(session: scope.session, api: scope.api, child: const _CreateMatchSheet()),
    );
    if (created == true) setState(() => _version++);
  }

  @override
  Widget build(BuildContext context) {
    final scope = AppScope.of(context);
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      TabHeader('Matchs',
          subtitle: 'Rejoins une équipe près de chez toi',
          action: FilledButton.icon(onPressed: _create, icon: const Icon(Icons.add), label: const Text('Créer'))),
      Expanded(
        child: Loader<List<SportMatchGame>>(
          key: ValueKey(_version),
          load: () => scope.api.matches(),
          empty: const EmptyState(icon: Icons.sports_soccer, title: 'Aucun match ouvert', message: 'Lance le premier !'),
          builder: (context, matches, reload) => ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: matches.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, i) => MatchCard(match: matches[i], onChanged: reload),
          ),
        ),
      ),
    ]);
  }
}

class MatchCard extends StatelessWidget {
  const MatchCard({super.key, required this.match, required this.onChanged});

  final SportMatchGame match;
  final Future<void> Function() onChanged;

  @override
  Widget build(BuildContext context) {
    final scope = AppScope.of(context);
    final mine = scope.session.user?.id == match.organizerId;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text('${sportName(match.sport)} · ${match.venueName}', style: const TextStyle(fontWeight: FontWeight.w700))),
            mine ? const Pill('Organisé par toi') : Pill(match.isOpen ? 'Ouvert' : 'Complet', color: match.isOpen ? Brand.lime : Brand.muted),
          ]),
          const SizedBox(height: 4),
          Text('${dakarDateTime(match.startsAt)} · ${match.durationMinutes} min · ${levelName(match.level)}', style: const TextStyle(color: Brand.muted)),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: LinearProgressIndicator(value: match.participants / match.maxPlayers, borderRadius: BorderRadius.circular(4))),
            const SizedBox(width: 12),
            Text('${match.participants}/${match.maxPlayers}'),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            if (match.isOpen && !mine)
              FilledButton(
                onPressed: () async {
                  if (!scope.session.signedIn) await scope.session.signIn();
                  if (!context.mounted || !scope.session.signedIn) return;
                  final joined = await runAction(context, () => scope.api.joinMatch(match.id), success: "Tu es dans l'équipe !");
                  if (joined != null) await onChanged();
                },
                child: const Text('Rejoindre'),
              ),
            if (scope.session.signedIn) ...[
              const SizedBox(width: 8),
              OutlinedButton.icon(
                onPressed: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => ConversationPage.forMatch(match.id))),
                icon: const Icon(Icons.chat_bubble_outline, size: 18),
                label: const Text('Chat'),
              ),
            ],
          ]),
        ]),
      ),
    );
  }
}

class _CreateMatchSheet extends StatefulWidget {
  const _CreateMatchSheet();

  @override
  State<_CreateMatchSheet> createState() => _CreateMatchSheetState();
}

class _CreateMatchSheetState extends State<_CreateMatchSheet> {
  Venue? _venue;
  DateTime _date = DateTime.now().toUtc().add(const Duration(days: 1));
  int _hour = 19;
  int _duration = 90;
  int _players = 10;
  String _level = 'INTERMEDIATE';
  bool _busy = false;
  Future<List<Venue>>? _venues;

  Future<void> _submit() async {
    final venue = _venue;
    if (venue == null) return;
    setState(() => _busy = true);
    final api = AppScope.of(context).api;
    final startsAt = DateTime.utc(_date.year, _date.month, _date.day, _hour);
    final created = await runAction(context, () => api.createMatch(
          venueId: venue.id, sport: venue.sport, startsAt: startsAt, durationMinutes: _duration, maxPlayers: _players, level: _level),
        success: 'Match publié, les joueurs du coin sont prévenus');
    if (!mounted) return;
    setState(() => _busy = false);
    if (created != null) Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final api = AppScope.of(context).api;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + MediaQuery.of(context).viewInsets.bottom),
      child: FutureBuilder<List<Venue>>(
        future: _venues ??= api.venues(),
        builder: (context, snap) {
          if (!snap.hasData) return const SizedBox(height: 200, child: Center(child: CircularProgressIndicator()));
          final venues = snap.data!;
          _venue ??= venues.isEmpty ? null : venues.first;
          return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Text('Créer un match', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            DropdownButtonFormField<Venue>(
              initialValue: _venue,
              decoration: const InputDecoration(labelText: 'Terrain'),
              items: [for (final v in venues) DropdownMenuItem(value: v, child: Text('${v.name} · ${sportName(v.sport)}'))],
              onChanged: (v) => setState(() => _venue = v),
            ),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.calendar_today, size: 18),
                  label: Text(dakarDay(_date)),
                  onPressed: () async {
                    final now = DateTime.now();
                    final picked = await showDatePicker(context: context, firstDate: now, lastDate: now.add(const Duration(days: 120)), initialDate: _date);
                    if (picked != null) setState(() => _date = picked);
                  },
                ),
              ),
              const SizedBox(width: 12),
              DropdownButton<int>(
                value: _hour,
                items: [for (var h = 7; h <= 22; h++) DropdownMenuItem(value: h, child: Text('${h}h00'))],
                onChanged: (h) => setState(() => _hour = h ?? _hour),
              ),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: DropdownButtonFormField<int>(
                  initialValue: _duration,
                  decoration: const InputDecoration(labelText: 'Durée'),
                  items: const [DropdownMenuItem(value: 60, child: Text('60 min')), DropdownMenuItem(value: 90, child: Text('90 min')), DropdownMenuItem(value: 120, child: Text('120 min'))],
                  onChanged: (d) => setState(() => _duration = d ?? _duration),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<int>(
                  initialValue: _players,
                  decoration: const InputDecoration(labelText: 'Joueurs'),
                  items: [for (final n in const [4, 6, 8, 10, 12, 14, 22]) DropdownMenuItem(value: n, child: Text('$n'))],
                  onChanged: (n) => setState(() => _players = n ?? _players),
                ),
              ),
            ]),
            const SizedBox(height: 12),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'BEGINNER', label: Text('Débutant')),
                ButtonSegment(value: 'INTERMEDIATE', label: Text('Interm.')),
                ButtonSegment(value: 'ADVANCED', label: Text('Confirmé')),
              ],
              selected: {_level},
              onSelectionChanged: (s) => setState(() => _level = s.first),
            ),
            const SizedBox(height: 20),
            FilledButton(onPressed: _busy || _venue == null ? null : _submit, child: Text(_busy ? 'Publication…' : 'Publier le match')),
          ]);
        },
      ),
    );
  }
}
