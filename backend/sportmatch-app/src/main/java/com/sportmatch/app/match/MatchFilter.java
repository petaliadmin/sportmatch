package com.sportmatch.app.match;

import java.time.LocalDate;

/** Critères de recherche des matchs (tous facultatifs sauf le statut, OPEN par défaut). */
public record MatchFilter(String status, String sport, String level, LocalDate from, LocalDate to) {

    public String statusOrOpen() {
        return status == null || status.isBlank() ? MatchRules.OPEN : status.toUpperCase();
    }
}
