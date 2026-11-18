package com.sportmatch.events.tournament;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BracketTest {

    private static List<UUID> teams(int n) {
        return IntStream.range(0, n).mapToObj(i -> UUID.randomUUID()).toList();
    }

    @Test
    void nombreDeToursSelonLeNombreDEquipes() {
        assertThat(Bracket.rounds(2)).isEqualTo(1);
        assertThat(Bracket.rounds(3)).isEqualTo(2);
        assertThat(Bracket.rounds(8)).isEqualTo(3);
        assertThat(Bracket.rounds(9)).isEqualTo(4);
    }

    @Test
    void huitEquipesDonnentSeptMatchsDontQuatrePretsAJouer() {
        Bracket bracket = Bracket.plan(teams(8));
        assertThat(bracket.all()).hasSize(7);
        assertThat(bracket.all().stream().filter(s -> Bracket.READY.equals(s.status))).hasSize(4);
        assertThat(bracket.all().stream().filter(s -> s.bye)).isEmpty();
    }

    @Test
    void lesTetesDeSerieRecoiventLesExemptionsEtPassentAuTourSuivant() {
        List<UUID> t = teams(5);
        Bracket bracket = Bracket.plan(t);

        assertThat(bracket.all().stream().filter(s -> s.bye)).hasSize(3);
        Bracket.Slot r1p3 = bracket.slot(1, 3);
        assertThat(r1p3.home).isEqualTo(t.get(3));
        assertThat(r1p3.away).isEqualTo(t.get(4));
        assertThat(r1p3.status).isEqualTo(Bracket.READY);
        // t0 et t1 exemptés se retrouvent face à face au 2e tour
        assertThat(bracket.slot(2, 0).home).isEqualTo(t.get(0));
        assertThat(bracket.slot(2, 0).away).isEqualTo(t.get(1));
        assertThat(bracket.slot(2, 0).status).isEqualTo(Bracket.READY);
    }

    @Test
    void leVainqueurEstQualifieEtLaFinaleNeMeneNullePart() {
        List<UUID> t = teams(4);
        Bracket bracket = Bracket.plan(t);
        bracket.decide(bracket.slot(1, 0), t.get(0));
        Bracket.Slot finale = bracket.decide(bracket.slot(1, 1), t.get(2));

        assertThat(finale.home).isEqualTo(t.get(0));
        assertThat(finale.away).isEqualTo(t.get(2));
        assertThat(finale.status).isEqualTo(Bracket.READY);
        assertThat(bracket.decide(finale, t.get(2))).isNull();
    }

    @Test
    void ilFautAuMoinsDeuxEquipes() {
        assertThatThrownBy(() -> Bracket.plan(teams(1))).isInstanceOf(IllegalArgumentException.class);
    }
}
