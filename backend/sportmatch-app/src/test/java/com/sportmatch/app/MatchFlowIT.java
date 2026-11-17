package com.sportmatch.app;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.kafka.KafkaContainer;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

/** Test d'intégration : vraie base PostgreSQL + vrai Kafka (Testcontainers), migrations Liquibase comprises. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class MatchFlowIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Container
    static KafkaContainer kafka = new KafkaContainer("apache/kafka:3.9.0");

    @DynamicPropertySource
    static void kafkaProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }

    @Autowired
    TestRestTemplate rest;

    @Autowired
    JdbcClient jdbc;

    @Test
    @SuppressWarnings("rawtypes")
    void creerEtRejoindreUnMatchPublieLesEvenements() {
        UUID venueId = jdbc.sql("select id from venue order by name limit 1").query(UUID.class).single();

        Map<String, Object> body = Map.of(
                "venueId", venueId,
                "sport", "FOOTBALL",
                "startsAt", "2030-06-15T18:00:00Z",
                "durationMinutes", 90,
                "maxPlayers", 2,
                "level", "INTERMEDIATE");

        ResponseEntity<Map> created = rest.postForEntity("/api/v1/matches", new HttpEntity<>(body, headers("player-a")), Map.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String matchId = (String) created.getBody().get("id");
        assertThat(created.getBody().get("participants")).isEqualTo(1);

        ResponseEntity<Map> joined = rest.postForEntity("/api/v1/matches/" + matchId + "/join", new HttpEntity<>(headers("player-b")), Map.class);
        assertThat(joined.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(joined.getBody().get("status")).isEqualTo("FULL");

        ResponseEntity<Map> refused = rest.postForEntity("/api/v1/matches/" + matchId + "/join", new HttpEntity<>(headers("player-c")), Map.class);
        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        ResponseEntity<Map> withoutUser = rest.postForEntity("/api/v1/matches", new HttpEntity<>(body, jsonHeaders()), Map.class);
        assertThat(withoutUser.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        await().atMost(Duration.ofSeconds(30)).untilAsserted(() -> assertThat(
                jdbc.sql("select count(*) from outbox_event where published_at is null").query(Long.class).single()).isZero());
        assertThat(jdbc.sql("select count(*) from outbox_event where aggregate_id = :id").param("id", matchId).query(Long.class).single())
                .isEqualTo(2L);
    }

    private static HttpHeaders headers(String userId) {
        HttpHeaders headers = jsonHeaders();
        headers.set("X-User-Id", userId);
        return headers;
    }

    private static HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
