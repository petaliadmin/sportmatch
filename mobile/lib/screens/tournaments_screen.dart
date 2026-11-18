import 'package:flutter/material.dart';

import '../api/models.dart';
import '../app.dart';
import '../ui/format.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';
import 'home_shell.dart';

const _statusLabels = {'REGISTRATION': 'Inscriptions ouvertes', 'IN_PROGRESS': 'En cours', 'COMPLETED': 'Terminé'};

class TournamentsScreen extends StatelessWidget {
  const TournamentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final api = AppScope.of(context).api;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      const TabHeader('Tournois', subtitle: 'Élimination directe, du quartier à la finale'),
      Expanded(
        child: Loader<List<TournamentSummary>>(
          load: api.tournaments,
          empty: const EmptyState(icon: Icons.emoji_events, title: 'Aucun tournoi', message: 'Les organisateurs les créent depuis le web.'),
          builder: (context, list, _) => ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, i) {
              final t = list[i];
              return Card(
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  title: Text(t.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: Text('${sportName(t.sport)} · ${dakarDay(t.startsOn)} · ${t.teams}/${t.maxTeams} équipes'
                      '${t.championName != null ? '\n🏆 ${t.championName}' : ''}'),
                  trailing: Pill(_statusLabels[t.status] ?? t.status, color: t.status == 'COMPLETED' ? Brand.gold : Brand.lime),
                  onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => TournamentPage(id: t.id))),
                ),
              );
            },
          ),
        ),
      ),
    ]);
  }
}

class TournamentPage extends StatefulWidget {
  const TournamentPage({super.key, required this.id});

  final String id;

  @override
  State<TournamentPage> createState() => _TournamentPageState();
}

class _TournamentPageState extends State<TournamentPage> {
  int _version = 0;
  final _teamName = TextEditingController();

  @override
  void dispose() {
    _teamName.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    final scope = AppScope.of(context);
    if (!scope.session.signedIn) await scope.session.signIn();
    if (!mounted || !scope.session.signedIn) return;
    final r = await runAction(context, () => scope.api.registerTeam(widget.id, _teamName.text.trim()), success: 'Équipe inscrite');
    if (r != null) {
      _teamName.clear();
      setState(() => _version++);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scope = AppScope.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Tournoi')),
      body: Loader<TournamentDetail>(
        key: ValueKey(_version),
        load: () => scope.api.tournament(widget.id),
        builder: (context, d, _) {
          final t = d.tournament;
          final rounds = d.bracket.map((m) => m.round).toSet().toList()..sort();
          final myTeam = d.teams.any((team) => team.captainId == scope.session.user?.id);
          return ListView(padding: const EdgeInsets.all(16), children: [
            Text(t.name, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
            Text('${sportName(t.sport)} · ${dakarDay(t.startsOn)} · ${d.teams.length}/${t.maxTeams} équipes', style: const TextStyle(color: Brand.muted)),
            if (t.championName != null) ...[
              const SizedBox(height: 16),
              Card(child: ListTile(leading: const Icon(Icons.emoji_events, color: Brand.gold), title: Text('${t.championName} remporte le tournoi !'))),
            ],
            if (t.status == 'REGISTRATION') ...[
              const SizedBox(height: 16),
              Wrap(spacing: 8, runSpacing: 8, children: [for (final team in d.teams) Chip(label: Text(team.name))]),
              if (!myTeam && d.teams.length < t.maxTeams) ...[
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(child: TextField(controller: _teamName, maxLength: 60, decoration: const InputDecoration(hintText: 'Nom de ton équipe', counterText: ''))),
                  const SizedBox(width: 8),
                  FilledButton(onPressed: _register, child: const Text('Inscrire')),
                ]),
              ],
            ],
            for (final r in rounds) ...[
              const SizedBox(height: 20),
              Text(roundName(r, rounds.length).toUpperCase(), style: const TextStyle(color: Brand.muted, fontWeight: FontWeight.w700, letterSpacing: 1)),
              const SizedBox(height: 8),
              for (final m in d.bracket.where((m) => m.round == r)) ...[
                _BracketTile(match: m),
                const SizedBox(height: 8),
              ],
            ],
          ]);
        },
      ),
    );
  }
}

class _BracketTile extends StatelessWidget {
  const _BracketTile({required this.match});

  final BracketMatch match;

  Widget _line(String? name, int? score, bool winner) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(children: [
          Expanded(
            child: Text(name ?? 'À déterminer',
                style: TextStyle(fontWeight: winner ? FontWeight.w800 : FontWeight.w400, color: name == null ? Brand.muted : null)),
          ),
          Text(score?.toString() ?? ''),
        ]),
      );

  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(children: [
            _line(match.homeTeam, match.homeScore, match.winnerTeamId != null && match.winnerTeamId == match.homeTeamId),
            _line(match.bye ? 'Exempté' : match.awayTeam, match.awayScore, match.winnerTeamId != null && match.winnerTeamId == match.awayTeamId),
          ]),
        ),
      );
}
