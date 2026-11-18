package com.sportmatch.app.match;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MatchRulesTest {

    @Test
    void unJoueurPeutRejoindreUnMatchOuvertAvecDesPlacesLibres() {
        assertThatCode(() -> MatchRules.ensureCanJoin("OPEN", 3, 10, false)).doesNotThrowAnyException();
    }

    @Test
    void unJoueurNePeutPasRejoindreDeuxFois() {
        assertThatThrownBy(() -> MatchRules.ensureCanJoin("OPEN", 3, 10, true))
                .isInstanceOf(MatchRuleViolation.class)
                .hasMessageContaining("déjà");
    }

    @Test
    void unMatchCompletRefuseLesInscriptions() {
        assertThatThrownBy(() -> MatchRules.ensureCanJoin("OPEN", 10, 10, false))
                .isInstanceOf(MatchRuleViolation.class);
        assertThatThrownBy(() -> MatchRules.ensureCanJoin("FULL", 9, 10, false))
                .isInstanceOf(MatchRuleViolation.class);
    }

    @Test
    void leMatchPasseAuStatutCompletQuandLaDernierePlaceEstPrise() {
        assertThat(MatchRules.statusAfterJoin(9, 10)).isEqualTo(MatchRules.OPEN);
        assertThat(MatchRules.statusAfterJoin(10, 10)).isEqualTo(MatchRules.FULL);
    }

    @Test
    void seulsLOrganisateurEtLaModerationPeuventAnnuler() {
        assertThatCode(() -> MatchRules.ensureCanCancel("OPEN", true, false)).doesNotThrowAnyException();
        assertThatCode(() -> MatchRules.ensureCanCancel("FULL", false, true)).doesNotThrowAnyException();
        assertThatThrownBy(() -> MatchRules.ensureCanCancel("OPEN", false, false)).isInstanceOf(MatchRuleViolation.class);
        assertThatThrownBy(() -> MatchRules.ensureCanCancel("CANCELLED", true, false)).hasMessageContaining("déjà annulé");
    }

    @Test
    void quitterUnMatch() {
        assertThatCode(() -> MatchRules.ensureCanLeave("FULL", true, false, false)).doesNotThrowAnyException();
        assertThatThrownBy(() -> MatchRules.ensureCanLeave("OPEN", true, true, false)).hasMessageContaining("annuler");
        assertThatThrownBy(() -> MatchRules.ensureCanLeave("OPEN", false, false, false)).hasMessageContaining("ne participes pas");
        assertThatThrownBy(() -> MatchRules.ensureCanLeave("OPEN", true, false, true)).hasMessageContaining("commencé");
        org.assertj.core.api.Assertions.assertThat(MatchRules.statusAfterLeave("FULL")).isEqualTo("OPEN");
        org.assertj.core.api.Assertions.assertThat(MatchRules.statusAfterLeave("OPEN")).isEqualTo("OPEN");
    }

    @Test
    void feuilleDePresenceEtFiabilite() {
        assertThatCode(() -> MatchRules.ensureCanMarkAttendance("FULL", true, true)).doesNotThrowAnyException();
        assertThatThrownBy(() -> MatchRules.ensureCanMarkAttendance("FULL", false, true)).hasMessageContaining("organisateur");
        assertThatThrownBy(() -> MatchRules.ensureCanMarkAttendance("OPEN", true, false)).hasMessageContaining("commencé");
        org.assertj.core.api.Assertions.assertThat(MatchRules.reliabilityPercent(0, 0)).isNull();
        org.assertj.core.api.Assertions.assertThat(MatchRules.reliabilityPercent(4, 1)).isEqualTo(75);
        org.assertj.core.api.Assertions.assertThat(MatchRules.reliabilityPercent(3, 0)).isEqualTo(100);
    }
}
