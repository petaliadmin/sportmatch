package com.sportmatch.app.match;

/** Règles métier pures (sans I/O), testées unitairement. */
public final class MatchRules {

    public static final String OPEN = "OPEN";
    public static final String FULL = "FULL";

    private MatchRules() {
    }

    public static void ensureCanJoin(String status, int participants, int maxPlayers, boolean alreadyJoined) {
        if (alreadyJoined) {
            throw new MatchRuleViolation("Tu participes déjà à ce match");
        }
        if (!OPEN.equals(status) || participants >= maxPlayers) {
            throw new MatchRuleViolation("Ce match est complet ou n'est plus ouvert");
        }
    }

    public static String statusAfterJoin(int participantsAfterJoin, int maxPlayers) {
        return participantsAfterJoin >= maxPlayers ? FULL : OPEN;
    }
}
