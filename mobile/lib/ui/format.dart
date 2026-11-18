import 'package:intl/intl.dart';

/// Dakar est à UTC toute l'année (pas d'heure d'été) : on affiche donc l'heure UTC.
final _day = DateFormat('EEE d MMM', 'fr_FR');
final _dayTime = DateFormat("EEE d MMM 'à' HH'h'mm", 'fr_FR');
final _time = DateFormat("HH'h'mm", 'fr_FR');
final _fcfa = NumberFormat.decimalPattern('fr_FR');

String dakarDay(DateTime d) => _day.format(d.toUtc());
String dakarDateTime(DateTime d) => _dayTime.format(d.toUtc());
String dakarTime(DateTime d) => _time.format(d.toUtc());

/// 30000 → « 30 000 FCFA » (espaces insécables, jamais de coupure au milieu du montant).
String fcfa(int amount) => '${_fcfa.format(amount).replaceAll(RegExp(r'\s'), ' ')} FCFA';

String isoDate(DateTime d) => d.toUtc().toIso8601String().substring(0, 10);

const _sports = {'FOOTBALL': 'Football', 'BASKETBALL': 'Basket', 'TENNIS': 'Tennis', 'PADEL': 'Padel'};
String sportName(String code) => _sports[code] ?? code;

String levelName(String code) => switch (code) {
      'BEGINNER' => 'Débutant',
      'INTERMEDIATE' => 'Intermédiaire',
      'ADVANCED' => 'Confirmé',
      _ => code,
    };

/// Nom du tour dans un tableau à élimination directe.
String roundName(int round, int totalRounds) {
  final fromEnd = totalRounds - round;
  return switch (fromEnd) {
    0 => 'Finale',
    1 => 'Demi-finales',
    2 => 'Quarts de finale',
    3 => 'Huitièmes de finale',
    _ => 'Tour $round',
  };
}
