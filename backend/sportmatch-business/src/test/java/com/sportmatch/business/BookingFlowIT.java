package com.sportmatch.business;

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
import org.testcontainers.kafka.ConfluentKafkaContainer;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class BookingFlowIT {

    private static final String COURT = "c0a7c1e0-0001-4b00-9000-000000000001";

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Container
    static ConfluentKafkaContainer kafka = new ConfluentKafkaContainer("confluentinc/cp-kafka:7.7.1");

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
    void reserverPuisRefuserLeDoublonPuisAnnuler() {
        Map<String, Object> body = Map.of("courtId", COURT, "startsAt", "2030-06-15T18:00:00Z", "hours", 2);

        ResponseEntity<Map> booked = rest.postForEntity("/api/v1/business/bookings", new HttpEntity<>(body, headers("awa")), Map.class);
        assertThat(booked.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(booked.getBody().get("priceFcfa")).isEqualTo(60000);
        String bookingId = (String) booked.getBody().get("id");

        Map<String, Object> overlapping = Map.of("courtId", COURT, "startsAt", "2030-06-15T19:00:00Z", "hours", 1);
        ResponseEntity<Map> conflict = rest.postForEntity("/api/v1/business/bookings", new HttpEntity<>(overlapping, headers("moussa")), Map.class);
        assertThat(conflict.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        ResponseEntity<List> slots = rest.getForEntity("/api/v1/business/courts/" + COURT + "/availability?date=2030-06-15", List.class);
        assertThat(slots.getBody()).hasSize(16);

        ResponseEntity<Map> notOwner = rest.postForEntity("/api/v1/business/bookings/" + bookingId + "/cancel", new HttpEntity<>(headers("moussa")), Map.class);
        assertThat(notOwner.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        ResponseEntity<Map> cancelled = rest.postForEntity("/api/v1/business/bookings/" + bookingId + "/cancel", new HttpEntity<>(headers("awa")), Map.class);
        assertThat(cancelled.getBody().get("status")).isEqualTo("CANCELLED");

        await().atMost(Duration.ofSeconds(30)).untilAsserted(() -> assertThat(
                jdbc.sql("select count(*) from outbox_event where published_at is null").query(Long.class).single()).isZero());
        assertThat(jdbc.sql("select count(*) from outbox_event where aggregate_id = :id").param("id", bookingId).query(Long.class).single())
                .isEqualTo(2L);
    }

    private static HttpHeaders headers(String userId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-User-Id", userId);
        headers.set("X-User-Email", userId + "@demo.sportmatch.test");
        return headers;
    }
}
