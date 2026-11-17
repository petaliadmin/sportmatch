package com.sportmatch.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Relaie les événements de la table outbox_event vers Kafka.
 * FOR UPDATE SKIP LOCKED permet de lancer plusieurs réplicas du service sans double publication concurrente.
 * Livraison "at least once" : les consommateurs dédupliquent sur eventId.
 */
public class OutboxPublisher {

    private static final Logger log = LoggerFactory.getLogger(OutboxPublisher.class);

    private final JdbcClient jdbc;
    private final KafkaTemplate<String, String> kafka;

    public OutboxPublisher(JdbcClient jdbc, KafkaTemplate<String, String> kafka) {
        this.jdbc = jdbc;
        this.kafka = kafka;
    }

    @Scheduled(fixedDelayString = "${sportmatch.outbox.poll-interval-ms:1000}")
    @Transactional
    public void publishPending() {
        List<PendingEvent> batch = jdbc.sql("""
                        select id, topic, aggregate_id, payload
                        from outbox_event
                        where published_at is null
                        order by created_at
                        limit 100
                        for update skip locked
                        """)
                .query(PendingEvent.class)
                .list();

        for (PendingEvent event : batch) {
            try {
                kafka.send(event.topic(), event.aggregateId(), event.payload()).get(10, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            } catch (ExecutionException | TimeoutException e) {
                log.warn("Kafka indisponible, l'événement {} sera republié au prochain cycle : {}", event.id(), e.getMessage());
                return;
            }
            jdbc.sql("update outbox_event set published_at = now() where id = :id")
                    .param("id", event.id())
                    .update();
        }
    }

    public record PendingEvent(UUID id, String topic, String aggregateId, String payload) {
    }
}
