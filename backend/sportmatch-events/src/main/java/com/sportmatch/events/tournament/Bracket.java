package com.sportmatch.events.tournament;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Tableau à élimination directe, calculé en mémoire (logique pure, testée unitairement).
 * Taille = puissance de 2 supérieure ou égale au nombre d'équipes ; les têtes de série
 * (ordre d'inscription) reçoivent les exemptions ("byes") et passent directement au tour suivant.
 */
public final class Bracket {

    public static final String PENDING = "PENDING";
    public static final String READY = "READY";
    public static final String PLAYED = "PLAYED";

    /** Un match du tableau. round commence à 1 ; position commence à 0 dans chaque tour. */
    public static final class Slot {
        public final int round;
        public final int position;
        public UUID home;
        public UUID away;
        public UUID winner;
        public String status = PENDING;
        public boolean bye;

        Slot(int round, int position) {
            this.round = round;
            this.position = position;
        }
    }

    private final List<List<Slot>> rounds = new ArrayList<>();

    private Bracket() {
    }

    public static int rounds(int teams) {
        int size = 1;
        int r = 0;
        while (size < teams) {
            size *= 2;
            r++;
        }
        return Math.max(r, 1);
    }

    public static Bracket plan(List<UUID> teams) {
        if (teams.size() < 2) {
            throw new IllegalArgumentException("Il faut au moins 2 équipes");
        }
        int roundCount = rounds(teams.size());
        int size = 1 << roundCount;
        Bracket bracket = new Bracket();
        for (int r = 1; r <= roundCount; r++) {
            List<Slot> slots = new ArrayList<>();
            for (int p = 0; p < size >> r; p++) {
                slots.add(new Slot(r, p));
            }
            bracket.rounds.add(slots);
        }
        List<Slot> first = bracket.rounds.get(0);
        for (int p = 0; p < first.size(); p++) {
            Slot slot = first.get(p);
            int awayIndex = size - 1 - p;
            slot.home = p < teams.size() ? teams.get(p) : null;
            slot.away = awayIndex < teams.size() ? teams.get(awayIndex) : null;
            if (slot.home != null && slot.away != null) {
                slot.status = READY;
            } else if (slot.home != null) {
                slot.bye = true;
                bracket.decide(slot, slot.home);
            }
        }
        return bracket;
    }

    /** Enregistre le vainqueur d'un match et le qualifie pour le tour suivant. Renvoie le match suivant, ou null pour la finale. */
    public Slot decide(Slot slot, UUID winner) {
        slot.winner = winner;
        slot.status = PLAYED;
        if (slot.round == rounds.size()) {
            return null;
        }
        Slot next = rounds.get(slot.round).get(slot.position / 2);
        if (slot.position % 2 == 0) {
            next.home = winner;
        } else {
            next.away = winner;
        }
        if (next.home != null && next.away != null && PENDING.equals(next.status)) {
            next.status = READY;
        }
        return next;
    }

    public List<Slot> all() {
        return rounds.stream().flatMap(List::stream).toList();
    }

    public Slot slot(int round, int position) {
        return rounds.get(round - 1).get(position);
    }

    public int roundCount() {
        return rounds.size();
    }
}
