package com.sportmatch.events;

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
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.kafka.ConfluentKafkaContainer;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class TournamentFlowIT {

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

    @Test
    @SuppressWarnings({"rawtypes", "unchecked"})
    void tournoiDeTroisEquipesJusquAuChampion() {
        ResponseEntity<Map> created = rest.postForEntity("/api/v1/events/tournaments",
                json(Map.of("name", "Coupe de Dakar", "sport", "FOOTBALL", "startsOn", "2030-07-01", "maxTeams", 4), "fatou"), Map.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String id = (String) ((Map) created.getBody().get("tournament")).get("id");

        for (String[] team : new String[][]{{"Lions de Ngor", "awa"}, {"Requins de Yoff", "moussa"}, {"Étoiles de Fann", "ibou"}}) {
            assertThat(rest.postForEntity("/api/v1/events/tournaments/" + id + "/teams", json(Map.of("name", team[0]), team[1]), Map.class)
                    .getStatusCode()).isEqualTo(HttpStatus.OK);
        }
        assertThat(rest.postForEntity("/api/v1/events/tournaments/" + id + "/teams", json(Map.of("name", "Autre"), "awa"), Map.class)
                .getStatusCode()).as("un capitaine = une équipe").isEqualTo(HttpStatus.CONFLICT);
        assertThat(rest.postForEntity("/api/v1/events/tournaments/" + id + "/start", json(Map.of(), "awa"), Map.class)
                .getStatusCode()).as("réservé à l'organisatrice").isEqualTo(HttpStatus.FORBIDDEN);

        Map started = rest.postForEntity("/api/v1/events/tournaments/" + id + "/start", json(Map.of(), "fatou"), Map.class).getBody();
        List<Map> bracket = (List<Map>) started.get("bracket");
        assertThat(bracket).hasSize(3);

        Map semi = bracket.stream().filter(m -> "READY".equals(m.get("status")) && (Integer) m.get("round") == 1).findFirst().orElseThrow();
        Map afterSemi = rest.postForEntity("/api/v1/events/tournaments/" + id + "/matches/" + semi.get("id") + "/result",
                json(Map.of("homeScore", 2, "awayScore", 1), "fatou"), Map.class).getBody();

        Map finale = ((List<Map>) afterSemi.get("bracket")).stream().filter(m -> (Integer) m.get("round") == 2).findFirst().orElseThrow();
        assertThat(finale.get("status")).isEqualTo("READY");
        assertThat(rest.postForEntity("/api/v1/events/tournaments/" + id + "/matches/" + finale.get("id") + "/result",
                json(Map.of("homeScore", 1, "awayScore", 1), "fatou"), Map.class).getStatusCode()).as("pas de nul").isEqualTo(HttpStatus.CONFLICT);

        Map done = rest.postForEntity("/api/v1/events/tournaments/" + id + "/matches/" + finale.get("id") + "/result",
                json(Map.of("homeScore", 0, "awayScore", 3), "fatou"), Map.class).getBody();
        Map tournament = (Map) done.get("tournament");
        assertThat(tournament.get("status")).isEqualTo("COMPLETED");
        assertThat(tournament.get("championName")).isNotNull();
    }

    private static HttpEntity<Map<String, Object>> json(Map<String, Object> body, String userId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-User-Id", userId);
        return new HttpEntity<>(body, headers);
    }
}
