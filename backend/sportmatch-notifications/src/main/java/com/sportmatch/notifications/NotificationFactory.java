package com.sportmatch.notifications;

import com.fasterxml.jackson.databind.JsonNode;
import com.sportmatch.commons.events.EventEnvelope;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.Optional;

/** Traduit un événement métier en notification lisible (logique pure, testée unitairement). */
public final class NotificationFactory {

    private static final ZoneId DAKAR = ZoneId.of("Africa/Dakar");
    private static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("EEEE d MMMM 'à' HH'h'mm", Locale.FRENCH);

    private NotificationFactory() {
    }

    public static Optional<NewNotification> from(EventEnvelope event) {
        JsonNode p = event.payload();
        return switch (event.eventType()) {
            case "match.created" -> recipient(p, "organizerId").map(to -> new NewNotification(to,
                    "Ton match est publié",
                    "Les joueurs du coin peuvent maintenant le rejoindre."));
            case "match.player-joined" -> recipient(p, "organizerId").map(to -> new NewNotification(to,
                    "Un joueur a rejoint ton match",
                    "Un nouveau joueur a rejoint ton match (" + p.path("participants").asInt()
                            + "/" + p.path("maxPlayers").asInt() + ")."));
            case "booking.confirmed" -> recipient(p, "userId").map(to -> new NewNotification(to,
                    "Réservation confirmée",
                    place(p) + ", " + when(p.path("startsAt").asText()) + ". Réservation de démonstration : aucun paiement."));
            case "booking.cancelled" -> recipient(p, "userId").map(to -> new NewNotification(to,
                    "Réservation annulée",
                    place(p) + ", " + when(p.path("startsAt").asText()) + " : le créneau est libéré."));
            case "tournament.team-registered" -> recipient(p, "captainId").map(to -> new NewNotification(to,
                    "Équipe inscrite",
                    p.path("teamName").asText("Ton équipe") + " est inscrite au tournoi « " + p.path("tournamentName").asText("") + " »."));
            case "tournament.completed" -> recipient(p, "organizerId").map(to -> new NewNotification(to,
                    "Tournoi terminé",
                    p.path("championName").asText("") + " remporte « " + p.path("name").asText("") + " » !"));
            default -> Optional.empty();
        };
    }

    private static Optional<String> recipient(JsonNode payload, String field) {
        String value = payload.path(field).asText(null);
        return value == null || value.isBlank() ? Optional.empty() : Optional.of(value);
    }

    private static String place(JsonNode p) {
        return p.path("courtName").asText("Terrain") + " · " + p.path("venueName").asText("");
    }

    static String when(String isoDateTime) {
        try {
            return OffsetDateTime.parse(isoDateTime).atZoneSameInstant(DAKAR).format(WHEN);
        } catch (DateTimeParseException e) {
            return isoDateTime;
        }
    }
}
