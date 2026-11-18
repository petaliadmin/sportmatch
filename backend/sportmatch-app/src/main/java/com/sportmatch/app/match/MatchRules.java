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

    /** Quitter : un participant (pas l'organisateur, qui annule), avant le coup d'envoi. */
    public static void ensureCanLeave(String status, boolean participant, boolean organizer, boolean started) {
        if (organizer) {
            throw new MatchRuleViolation("L'organisateur ne quitte pas son match : il peut l'annuler");
        }
        if (!participant) {
            throw new MatchRuleViolation("Tu ne participes pas à ce match");
        }
        if (CANCELLED.equals(status) || started) {
            throw new MatchRuleViolation("Ce match a déjà commencé ou a été annulé");
        }
    }

    /** Feuille de présence : remplie par l'organisateur, une fois le match commencé. */
    public static void ensureCanMarkAttendance(String status, boolean organizer, boolean started) {
        if (!organizer) {
            throw MatchRuleViolation.forbidden("Seul l'organisateur remplit la feuille de présence");
        }
        if (CANCELLED.equals(status)) {
            throw new MatchRuleViolation("Ce match a été annulé");
        }
        if (!started) {
            throw new MatchRuleViolation("La présence se renseigne une fois le match commencé");
        }
    }

    /** Statut après un départ : un match complet redevient ouvert. */
    public static String statusAfterLeave(String status) {
        return FULL.equals(status) ? OPEN : status;
    }

    /** Fiabilité en % (présences / matchs renseignés), null tant qu'aucune présence n'est renseignée. */
    public static Integer reliabilityPercent(int rated, int noShows) {
        return rated == 0 ? null : (int) Math.round(100.0 * (rated - noShows) / rated);
    }

    public static String statusAfterJoin(int participantsAfterJoin, int maxPlayers) {
        return participantsAfterJoin >= maxPlayers ? FULL : OPEN;
    }
}
