package com.sportmatch.commons.events;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Enveloppe commune à tous les événements publiés sur Kafka (voir contracts/asyncapi).
 *
 * @param eventId     identifiant unique, sert à l'idempotence des consommateurs
 * @param eventType   type métier, ex. "match.created"
 * @param occurredAt  horodatage UTC de l'événement
 * @param source      service émetteur, ex. "sportmatch-app"
 * @param aggregateId identifiant de l'agrégat, aussi utilisé comme clé Kafka (ordre garanti par agrégat)
 * @param payload     données propres au type d'événement
 */
public record EventEnvelope(
        UUID eventId,
        String eventType,
        OffsetDateTime occurredAt,
        String source,
        String aggregateId,
        JsonNode payload) {
}
