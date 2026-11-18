import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../api/models.dart';
import '../app.dart';
import '../config.dart';
import '../ui/format.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';
import 'home_shell.dart';

/// Terrains à proximité (PostGIS) avec filtre de sport et de rayon.
class VenuesScreen extends StatefulWidget {
  const VenuesScreen({super.key});

  @override
  State<VenuesScreen> createState() => _VenuesScreenState();
}

class _VenuesScreenState extends State<VenuesScreen> {
  double _lat = AppConfig.dakarLat;
  double _lng = AppConfig.dakarLng;
  bool _located = false;
  double _radius = 10;
  String? _sport;
  int _version = 0;

  Future<void> _locate() async {
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) return;
      final p = await Geolocator.getCurrentPosition();
      setState(() {
        _lat = p.latitude;
        _lng = p.longitude;
        _located = true;
        _version++;
      });
    } on Exception catch (e) {
      if (mounted) showMessage(context, 'Localisation impossible : $e', error: true);
    }
  }

  void _set(VoidCallback change) => setState(() {
        change();
        _version++;
      });

  @override
  Widget build(BuildContext context) {
    final api = AppScope.of(context).api;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      TabHeader('Terrains',
          subtitle: _located ? 'Autour de toi' : 'Autour de Dakar Plateau',
          action: IconButton(tooltip: 'Me localiser', onPressed: _locate, icon: const Icon(Icons.my_location))),
      SizedBox(
        height: 44,
        child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 16), children: [
          for (final s in const [null, 'FOOTBALL', 'BASKETBALL', 'TENNIS', 'PADEL'])
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(label: Text(s == null ? 'Tous' : sportName(s)), selected: _sport == s, onSelected: (_) => _set(() => _sport = s)),
            ),
          const SizedBox(width: 8),
          for (final r in const [2.0, 5.0, 10.0, 25.0])
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(label: Text('${r.toInt()} km'), selected: _radius == r, onSelected: (_) => _set(() => _radius = r)),
            ),
        ]),
      ),
      Expanded(
        child: Loader<List<Venue>>(
          key: ValueKey(_version),
          load: () => api.nearby(_lat, _lng, radiusKm: _radius, sport: _sport),
          empty: const EmptyState(icon: Icons.search_off, title: 'Aucun terrain dans ce rayon', message: 'Élargis la zone de recherche.'),
          builder: (context, venues, _) => ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: venues.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, i) => _VenueCard(venue: venues[i]),
          ),
        ),
      ),
    ]);
  }
}

class _VenueCard extends StatelessWidget {
  const _VenueCard({required this.venue});

  final Venue venue;

  @override
  Widget build(BuildContext context) => Card(
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => VenueBookingPage(venue: venue))),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(venue.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                  const SizedBox(height: 2),
                  Text('${venue.district} · ${sportName(venue.sport)}', style: const TextStyle(color: Brand.muted)),
                  const SizedBox(height: 8),
                  Text('${fcfa(venue.pricePerHourFcfa)} / heure', style: const TextStyle(fontWeight: FontWeight.w600)),
                ]),
              ),
              if (venue.distanceKm != null) Pill('${venue.distanceKm!.toStringAsFixed(1).replaceAll('.', ',')} km'),
            ]),
          ),
        ),
      );
}

/// Choix d'un terrain, d'un jour et d'un créneau, puis réservation de démonstration (sans paiement).
class VenueBookingPage extends StatefulWidget {
  const VenueBookingPage({super.key, required this.venue});

  final Venue venue;

  @override
  State<VenueBookingPage> createState() => _VenueBookingPageState();
}

class _VenueBookingPageState extends State<VenueBookingPage> {
  Court? _court;
  DateTime _day = DateTime.now().toUtc().add(const Duration(days: 1));
  int _hours = 1;
  int _version = 0;

  Future<void> _book(DateTime startsAt) async {
    final scope = AppScope.of(context);
    if (!scope.session.signedIn) {
      await scope.session.signIn();
      if (!scope.session.signedIn) return;
    }
    if (!mounted || _court == null) return;
    final ok = await runAction(context, () => scope.api.book(_court!.id, startsAt, _hours),
        success: 'Créneau réservé (démonstration, aucun paiement)');
    if (ok != null) setState(() => _version++);
  }

  @override
  Widget build(BuildContext context) {
    final api = AppScope.of(context).api;
    final days = List.generate(10, (i) => DateTime.now().toUtc().add(Duration(days: i)));
    return Scaffold(
      appBar: AppBar(title: Text(widget.venue.name)),
      body: Loader<List<Court>>(
        load: () => api.courts(widget.venue.id),
        empty: const EmptyState(icon: Icons.event_busy, title: 'Pas de réservation en ligne', message: 'Ce complexe ne propose pas encore de créneaux.'),
        builder: (context, courts, _) {
          final court = _court ?? courts.first;
          _court = court;
          return ListView(padding: const EdgeInsets.all(16), children: [
            Text('${widget.venue.district} · ${fcfa(court.pricePerHourFcfa)} / h', style: const TextStyle(color: Brand.muted)),
            const SizedBox(height: 12),
            Wrap(spacing: 8, runSpacing: 8, children: [
              for (final c in courts)
                ChoiceChip(label: Text(c.name), selected: c.id == court.id, onSelected: (_) => setState(() {
                      _court = c;
                      _version++;
                    })),
            ]),
            const SizedBox(height: 16),
            SizedBox(
              height: 40,
              child: ListView(scrollDirection: Axis.horizontal, children: [
                for (final d in days)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(label: Text(dakarDay(d)), selected: isoDate(d) == isoDate(_day), onSelected: (_) => setState(() {
                          _day = d;
                          _version++;
                        })),
                  ),
              ]),
            ),
            const SizedBox(height: 12),
            SegmentedButton<int>(
              segments: const [ButtonSegment(value: 1, label: Text('1 h')), ButtonSegment(value: 2, label: Text('2 h')), ButtonSegment(value: 3, label: Text('3 h'))],
              selected: {_hours},
              onSelectionChanged: (s) => setState(() => _hours = s.first),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 320,
              child: Loader<List<Slot>>(
                key: ValueKey('${court.id}-$_version'),
                load: () => api.availability(court.id, isoDate(_day)),
                builder: (context, slots, _) => GridView.count(
                  crossAxisCount: 4,
                  childAspectRatio: 2.2,
                  mainAxisSpacing: 8,
                  crossAxisSpacing: 8,
                  children: [
                    for (final s in slots)
                      OutlinedButton(onPressed: s.available ? () => _book(s.startsAt) : null, child: Text(dakarTime(s.startsAt))),
                  ],
                ),
              ),
            ),
            const Text('Réservation de démonstration : aucun paiement. Heures de Dakar.', style: TextStyle(color: Brand.muted, fontSize: 12)),
          ]);
        },
      ),
    );
  }
}
