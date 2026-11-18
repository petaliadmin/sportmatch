package com.sportmatch.app.match;

/** Règles métier pures (sans I/O), testées unitairement. */
public final class MatchRules {

    public static final String OPEN = "OPEN";
    public static final String FULL = "FULL";
    public static final String CANCELLED = "CANCELLED";

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

    /** Annulation : par l'organisateur, ou par un administrateur (modération) ; jamais deux fois. */
    public static void ensureCanCancel(String status, boolean organizer, boolean admin) {
        if (!organizer && !admin) {
            throw MatchRuleViolation.forbidden("Seul l'organisateur (ou la modération) peut annuler ce match");
        }
        if (CANCELLED.equals(status)) {
            throw new MatchRuleViolation("Ce match est déjà annulé");
        }
    }

    public static String statusAfterJoin(int participantsAfterJoin, int maxPlayers) {
        return participantsAfterJoin >= maxPlayers ? FULL : OPEN;
    }
}
