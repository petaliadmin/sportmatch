package com.sportmatch.admin;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportmatch.commons.events.EventEnvelope;
import com.sportmatch.commons.events.Topics;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/** Journal d'audit de la plateforme : chaque événement métier de chaque service, conservé une seule fois. */
@Component
public class PlatformEventListener {

    private final ObjectMapper mapper;
    private final JdbcClient jdbc;

    public PlatformEventListener(ObjectMapper mapper, JdbcClient jdbc) {
        this.mapper = mapper;
        this.jdbc = jdbc;
    }

    @KafkaListener(topics = {Topics.MATCH_V1, Topics.BOOKING_V1, Topics.TOURNAMENT_V1}, groupId = "sportmatch-admin")
    public void onEvent(String message) throws JsonProcessingException {
        EventEnvelope e = mapper.readValue(message, EventEnvelope.class);
        jdbc.sql("""
                        insert into platform_event (event_id, event_type, source, aggregate_id, occurred_at, payload)
                        values (:id, :type, :source, :aggregate, :at, :payload)
                        on conflict (event_id) do nothing
                        """)
                .param("id", e.eventId()).param("type", e.eventType()).param("source", e.source())
                .param("aggregate", e.aggregateId()).param("at", e.occurredAt()).param("payload", e.payload().toString())
                .update();
    }
}
