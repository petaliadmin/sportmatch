import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:sportmatch_mobile/ui/format.dart';

void main() {
  setUpAll(() => initializeDateFormatting('fr_FR'));

  test('les montants FCFA ne se coupent jamais', () {
    expect(fcfa(30000), '30 000 FCFA');
    expect(fcfa(500), '500 FCFA');
  });

  test("les heures s'affichent à l'heure de Dakar (UTC)", () {
    expect(dakarTime(DateTime.utc(2030, 6, 15, 18)), '18h00');
    expect(isoDate(DateTime.utc(2030, 6, 15, 23, 30)), '2030-06-15');
  });

  test('noms des tours du tableau', () {
    expect(roundName(3, 3), 'Finale');
    expect(roundName(2, 3), 'Demi-finales');
    expect(roundName(1, 3), 'Quarts de finale');
    expect(roundName(1, 6), 'Tour 1');
  });

  test('libellés de sport et de niveau', () {
    expect(sportName('BASKETBALL'), 'Basket');
    expect(sportName('RUGBY'), 'RUGBY');
    expect(levelName('ADVANCED'), 'Confirmé');
  });
}
