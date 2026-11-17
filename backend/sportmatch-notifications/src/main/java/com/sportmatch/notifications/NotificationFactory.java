package com.sportmatch.notifications;

import com.fasterxml.jackson.databind.JsonNode;
import com.sportmatch.commons.events.EventEnvelope;

import java.util.Optional;

/** Traduit un événement métier en notification lisible (logique pure, testée unitairement). */
public final class NotificationFactory {

    private NotificationFactory() {
    }

    public static Optional<NewNotification> from(EventEnvelope event) {
        JsonNode payload = event.payload();
        String organizerId = payload.path("organizerId").asText(null);
        if (organizerId == null || organizerId.isBlank()) {
            return Optional.empty();
        }
        return switch (event.eventType()) {
            case "match.created" -> Optional.of(new NewNotification(organizerId,
                    "Ton match est publié",
                    "Les joueurs du coin peuvent maintenant le rejoindre."));
            case "match.player-joined" -> Optional.of(new NewNotification(organizerId,
                    "Un joueur a rejoint ton match",
                    "Un nouveau joueur a rejoint ton match (" + payload.path("participants").asInt()
                            + "/" + payload.path("maxPlayers").asInt() + ")."));
            default -> Optional.empty();
        };
    }
}
