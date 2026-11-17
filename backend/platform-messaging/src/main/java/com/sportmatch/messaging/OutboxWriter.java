package com.sportmatch.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportmatch.commons.events.EventEnvelope;
import org.springframework.jdbc.core.simple.JdbcClient;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;

/**
 * Pattern Transactional Outbox : l'événement est écrit dans la même transaction que la donnée métier,
 * puis publié sur Kafka par {@link OutboxPublisher}. Aucun événement n'est perdu si Kafka est indisponible.
 * La table outbox_event doit exister dans la base du service (voir le changelog Liquibase de sportmatch-app).
 */
public class OutboxWriter {

    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final String source;

    public OutboxWriter(JdbcClient jdbc, ObjectMapper mapper, String source) {
        this.jdbc = jdbc;
        this.mapper = mapper;
        this.source = source;
    }

    public void append(String topic, String aggregateType, String aggregateId, String eventType, Map<String, Object> payload) {
        UUID eventId = UUID.randomUUID();
        JsonNode body = mapper.valueToTree(payload);
        EventEnvelope envelope = new EventEnvelope(eventId, eventType, OffsetDateTime.now(ZoneOffset.UTC), source, aggregateId, body);
        String json;
        try {
            json = mapper.writeValueAsString(envelope);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Sérialisation de l'événement impossible", e);
        }
        jdbc.sql("""
                insert into outbox_event (id, topic, aggregate_type, aggregate_id, event_type, payload)
                values (:id, :topic, :aggregateType, :aggregateId, :eventType, :payload)
                """)
                .param("id", eventId)
                .param("topic", topic)
                .param("aggregateType", aggregateType)
                .param("aggregateId", aggregateId)
                .param("eventType", eventType)
                .param("payload", json)
                .update();
    }
}
