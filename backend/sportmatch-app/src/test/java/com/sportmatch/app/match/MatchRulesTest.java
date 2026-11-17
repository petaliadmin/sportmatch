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
}
