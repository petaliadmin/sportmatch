import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../api/models.dart';
import '../app.dart';
import '../config.dart';
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
  bool _mine = false;
  String? _sport;
  String? _level;
  DateTimeRange? _range;
  Set<String> _joined = {};

  void _refresh() => setState(() => _version++);

  Future<void> _create() async {
    final scope = AppScope.of(context);
    if (!scope.session.signedIn) await scope.session.signIn();
    if (!mounted || !scope.session.signedIn) return;
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => AppScope(session: scope.session, api: scope.api, child: const _CreateMatchSheet()),
    );
    if (created == true) _refresh();
  }

  Future<List<SportMatchGame>> _load() async {
    final scope = AppScope.of(context);
    final mine = scope.session.signedIn ? await scope.api.myMatches() : <SportMatchGame>[];
    _joined = {for (final m in mine) m.id};
    if (_mine) return mine;
    return scope.api.matches(sport: _sport, level: _level, from: _range?.start, to: _range?.end);
  }

  Future<void> _pickRange() async {
    final now = DateTime.now();
    final picked = await showDateRangePicker(
        context: context, firstDate: now, lastDate: now.add(const Duration(days: 180)), initialDateRange: _range);
    setState(() {
      _range = picked;
      _version++;
    });
  }

  @override
  Widget build(BuildContext context) {
    final scope = AppScope.of(context);
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      TabHeader('Matchs',
          subtitle: 'Rejoins une équipe près de chez toi',
          action: FilledButton.icon(onPressed: _create, icon: const Icon(Icons.add), label: const Text('Créer'))),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: SegmentedButton<bool>(
          segments: const [
            ButtonSegment(value: false, label: Text('À rejoindre')),
            ButtonSegment(value: true, label: Text('Mes matchs')),
          ],
          selected: {_mine},
          onSelectionChanged: (s) async {
            if (s.first && !scope.session.signedIn) await scope.session.signIn();
            if (!mounted || (s.first && !scope.session.signedIn)) return;
            setState(() {
              _mine = s.first;
              _version++;
            });
          },
        ),
      ),
      if (!_mine)
        SizedBox(
          height: 52,
          child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.fromLTRB(16, 8, 16, 4), children: [
            for (final s in const ['FOOTBALL', 'BASKETBALL', 'TENNIS', 'PADEL'])
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  label: Text(sportName(s)),
                  selected: _sport == s,
                  onSelected: (on) => setState(() {
                    _sport = on ? s : null;
                    _version++;
                  }),
                ),
              ),
            for (final l in const ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  label: Text(levelName(l)),
                  selected: _level == l,
                  onSelected: (on) => setState(() {
                    _level = on ? l : null;
                    _version++;
                  }),
                ),
              ),
            ActionChip(
              avatar: const Icon(Icons.date_range, size: 18),
              label: Text(_range == null ? 'Dates' : '${dakarDay(_range!.start)} → ${dakarDay(_range!.end)}'),
              onPressed: _pickRange,
            ),
          ]),
        ),
      Expanded(
        child: Loader<List<SportMatchGame>>(
          key: ValueKey('$_version-$_mine-${scope.session.signedIn}'),
          load: _load,
          empty: EmptyState(
              icon: Icons.sports_soccer,
              title: _mine ? 'Tu n\'as pas encore de match' : 'Aucun match pour ces critères',
              message: _mine ? 'Rejoins-en un ou crée le tien.' : 'Élargis les filtres ou lance le premier !'),
          builder: (context, matches, reload) => ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: matches.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, i) => MatchCard(match: matches[i], joined: _joined.contains(matches[i].id), onChanged: () async => _refresh()),
          ),
        ),
      ),
    ]);
  }
}

/// Partage : copie le lien direct du match (à coller dans un groupe WhatsApp).
Future<void> shareMatch(BuildContext context, SportMatchGame m) async {
  final text = '${sportName(m.sport)} à ${m.venueName}, ${dakarDateTime(m.startsAt)} : rejoins-nous sur SportMatch ${AppConfig.matchLink(m.id)}';
  await Clipboard.setData(ClipboardData(text: text));
  if (context.mounted) showMessage(context, 'Lien copié : colle-le dans ton groupe WhatsApp');
}

class MatchCard extends StatelessWidget {
  const MatchCard({super.key, required this.match, required this.onChanged, this.joined = false});

  final SportMatchGame match;
  final bool joined;
  final Future<void> Function() onChanged;

  @override
  Widget build(BuildContext context) {
    final scope = AppScope.of(context);
    final user = scope.session.user;
    final mine = user?.id == match.organizerId;
    final Widget status = match.isCancelled
        ? const Pill('Annulé', color: Brand.danger)
        : mine
            ? const Pill('Organisé par toi')
            : joined
                ? const Pill('Inscrit', color: Brand.sky)
                : Pill(match.isOpen ? 'Ouvert' : 'Complet', color: match.isOpen ? Brand.lime : Brand.muted);
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(
            builder: (_) => AppScope(session: scope.session, api: scope.api, child: MatchDetailPage(matchId: match.id, joined: joined)))).then((_) => onChanged()),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text('${sportName(match.sport)} · ${match.venueName}', style: const TextStyle(fontWeight: FontWeight.w700))),
              status,
            ]),
            const SizedBox(height: 4),
            Text('${dakarDateTime(match.startsAt)} · ${match.durationMinutes} min · ${levelName(match.level)}', style: const TextStyle(color: Brand.muted)),
            if (match.seriesId != null || (!mine && match.organizerName != null))
              Text([if (!mine && match.organizerName != null) 'Par ${match.organizerName}', if (match.seriesId != null) 'Chaque semaine'].join(' · '),
                  style: const TextStyle(color: Brand.muted, fontSize: 12)),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: LinearProgressIndicator(value: match.participants / match.maxPlayers, borderRadius: BorderRadius.circular(4))),
              const SizedBox(width: 12),
              Text('${match.participants}/${match.maxPlayers}'),
            ]),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 4, crossAxisAlignment: WrapCrossAlignment.center, children: [
              if (!match.isCancelled && match.isUpcoming && match.isOpen && !mine && !joined)
                FilledButton(
                  onPressed: () async {
                    if (!scope.session.signedIn) await scope.session.signIn();
                    if (!context.mounted || !scope.session.signedIn) return;
                    final r = await runAction(context, () => scope.api.joinMatch(match.id), success: "Tu es dans l'équipe !");
                    if (r != null) await onChanged();
                  },
                  child: const Text('Rejoindre'),
                ),
              if (scope.session.signedIn && (mine || joined) && !match.isCancelled)
                OutlinedButton.icon(
                  onPressed: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => ConversationPage.forMatch(match.id))),
                  icon: const Icon(Icons.chat_bubble_outline, size: 18),
                  label: const Text('Chat'),
                ),
              if (!match.isCancelled)
                IconButton(tooltip: 'Partager le match', onPressed: () => shareMatch(context, match), icon: const Icon(Icons.share_outlined)),
            ]),
          ]),
        ),
      ),
    );
  }
}

/// Détail d'un match : joueurs, actions (quitter, annuler), feuille de présence pour l'organisateur.
class MatchDetailPage extends StatefulWidget {
  const MatchDetailPage({super.key, required this.matchId, this.joined = false});

  final String matchId;
  final bool joined;

  @override
  State<MatchDetailPage> createState() => _MatchDetailPageState();
}

class _MatchDetailPageState extends State<MatchDetailPage> {
  int _version = 0;
  late bool _joined = widget.joined;

  Future<(SportMatchGame, List<Participant>)> _load() async {
    final api = AppScope.of(context).api;
    final results = await Future.wait([api.match(widget.matchId), api.participants(widget.matchId)]);
    return (results[0] as SportMatchGame, results[1] as List<Participant>);
  }

  Future<void> _act(Future<Object?> Function() action, String success, {bool? joined}) async {
    final r = await runAction(context, action, success: success);
    if (r != null && mounted) {
      setState(() {
        if (joined != null) _joined = joined;
        _version++;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final scope = AppScope.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Match')),
      body: Loader<(SportMatchGame, List<Participant>)>(
        key: ValueKey(_version),
        load: _load,
        builder: (context, data, reload) {
          final (m, people) = data;
          final user = scope.session.user;
          final mine = user?.id == m.organizerId;
          final started = !m.isUpcoming;
          final inMatch = _joined || people.any((p) => p.playerId == user?.id);
          return ListView(padding: const EdgeInsets.all(16), children: [
            Text('${sportName(m.sport)} · ${m.venueName}', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
            Text('${dakarDateTime(m.startsAt)} · ${m.durationMinutes} min · ${levelName(m.level)}', style: const TextStyle(color: Brand.muted)),
            if (m.isCancelled) const Padding(padding: EdgeInsets.only(top: 8), child: Pill('Match annulé', color: Brand.danger)),
            const SizedBox(height: 16),
            Wrap(spacing: 8, runSpacing: 8, children: [
              if (!m.isCancelled && !started && m.isOpen && !mine && !inMatch)
                FilledButton(
                    onPressed: () async {
                      if (!scope.session.signedIn) await scope.session.signIn();
                      if (!context.mounted || !scope.session.signedIn) return;
                      await _act(() => scope.api.joinMatch(m.id), "Tu es dans l'équipe !", joined: true);
                    },
                    child: const Text('Rejoindre')),
              if (!m.isCancelled && !started && inMatch && !mine)
                OutlinedButton(onPressed: () => _act(() => scope.api.leaveMatch(m.id), "Tu t'es retiré, l'organisateur est prévenu", joined: false),
                    child: const Text('Quitter le match')),
              if (!m.isCancelled && (mine || (user?.isAdmin ?? false)))
                OutlinedButton(
                    style: OutlinedButton.styleFrom(foregroundColor: Brand.danger),
                    onPressed: () => _act(() => scope.api.cancelMatch(m.id), 'Match annulé, les participants sont prévenus'),
                    child: Text(mine ? 'Annuler le match' : 'Annuler (modération)')),
              if (!m.isCancelled) OutlinedButton.icon(onPressed: () => shareMatch(context, m), icon: const Icon(Icons.share_outlined, size: 18), label: const Text('Partager')),
            ]),
            const SizedBox(height: 20),
            Text('Joueurs (${people.length}/${m.maxPlayers})', style: const TextStyle(fontWeight: FontWeight.w700)),
            if (mine && started && !m.isCancelled)
              const Text('Note la présence de chacun : elle alimente la fiabilité des joueurs.', style: TextStyle(color: Brand.muted, fontSize: 12)),
            const SizedBox(height: 8),
            for (final p in people)
              Card(
                child: ListTile(
                  leading: CircleAvatar(child: Text(p.displayName.isEmpty ? '?' : p.displayName[0].toUpperCase())),
                  title: Text(p.displayName + (p.playerId == m.organizerId ? ' · organisateur' : '')),
                  onTap: scope.session.signedIn ? () => showPlayerSheet(context, p.playerId) : null,
                  trailing: mine && started && !m.isCancelled
                      ? Row(mainAxisSize: MainAxisSize.min, children: [
                          IconButton(
                              tooltip: '${p.displayName} présent',
                              color: p.attended == true ? Brand.lime : Brand.muted,
                              onPressed: () => _act(() => scope.api.markAttendance(m.id, p.playerId, true), 'Présence notée'),
                              icon: const Icon(Icons.check_circle_outline)),
                          IconButton(
                              tooltip: '${p.displayName} absent',
                              color: p.attended == false ? Brand.danger : Brand.muted,
                              onPressed: () => _act(() => scope.api.markAttendance(m.id, p.playerId, false), 'Absence notée'),
                              icon: const Icon(Icons.cancel_outlined)),
                        ])
                      : p.attended == null
                          ? null
                          : Pill(p.attended! ? 'Présent' : 'Absent', color: p.attended! ? Brand.lime : Brand.danger),
                ),
              ),
          ]);
        },
      ),
    );
  }
}

/// Fiche joueur : préférences et fiabilité.
Future<void> showPlayerSheet(BuildContext context, String playerId) {
  final scope = AppScope.of(context);
  return showModalBottomSheet<void>(
    context: context,
    builder: (_) => Padding(
      padding: const EdgeInsets.all(20),
      child: FutureBuilder<PlayerProfile>(
        future: scope.api.player(playerId),
        builder: (context, snap) {
          if (snap.hasError) return Text('${snap.error}');
          if (!snap.hasData) return const SizedBox(height: 120, child: Center(child: CircularProgressIndicator()));
          final p = snap.data!;
          final details = [if (p.favoriteSport != null) sportName(p.favoriteSport!), if (p.level != null) levelName(p.level!), if (p.district != null) p.district!];
          return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(p.displayName, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
            Text(details.isEmpty ? 'Profil non renseigné' : details.join(' · '), style: const TextStyle(color: Brand.muted)),
            if (p.bio != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(p.bio!)),
            const SizedBox(height: 12),
            Wrap(spacing: 8, children: [
              Pill('${p.stats.matchesJoined} matchs', color: Brand.sky),
              Pill('${p.stats.matchesOrganized} organisés', color: Brand.sky),
              Pill('Fiabilité : ${p.stats.reliabilityLabel}'),
            ]),
          ]);
        },
      ),
    ),
  );
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
  int _repeat = 0;
  String _level = 'INTERMEDIATE';
  bool _busy = false;
  Future<List<Venue>>? _venues;

  Future<void> _submit() async {
    final venue = _venue;
    if (venue == null) return;
    setState(() => _busy = true);
    final api = AppScope.of(context).api;
    final startsAt = DateTime.utc(_date.year, _date.month, _date.day, _hour);
    final created = await runAction(
        context,
        () => api.createMatch(
            venueId: venue.id, sport: venue.sport, startsAt: startsAt, durationMinutes: _duration,
            maxPlayers: _players, level: _level, repeatWeeks: _repeat),
        success: _repeat > 0 ? 'Série de ${_repeat + 1} matchs publiée' : 'Match publié, les joueurs du coin sont prévenus');
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
          return SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
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
              const SizedBox(height: 12),
              DropdownButtonFormField<int>(
                initialValue: _repeat,
                decoration: const InputDecoration(labelText: 'Répétition'),
                items: const [
                  DropdownMenuItem(value: 0, child: Text('Match unique')),
                  DropdownMenuItem(value: 1, child: Text('Chaque semaine, 2 semaines')),
                  DropdownMenuItem(value: 3, child: Text('Chaque semaine, 4 semaines')),
                  DropdownMenuItem(value: 7, child: Text('Chaque semaine, 8 semaines')),
                ],
                onChanged: (r) => setState(() => _repeat = r ?? 0),
              ),
              const SizedBox(height: 20),
              FilledButton(onPressed: _busy || _venue == null ? null : _submit, child: Text(_busy ? 'Publication…' : 'Publier le match')),
            ]),
          );
        },
      ),
    );
  }
}
