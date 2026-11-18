package com.sportmatch.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.reactive.server.WebTestClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = "sportmatch.rate-limit.enabled=false")
class GatewaySecurityTest {

    @Autowired
    WebTestClient client;

    @Test
    void laSondeDeSanteEstPublique() {
        client.get().uri("/actuator/health/readiness").exchange().expectStatus().isOk();
    }

    @Test
    void creerUnMatchSansJetonEstRefuse() {
        client.post().uri("/api/v1/matches").exchange().expectStatus().isUnauthorized();
    }

    @Test
    void lesNotificationsExigentUnJeton() {
        client.get().uri("/api/v1/notifications").exchange().expectStatus().isUnauthorized();
    }

    @Test
    void unServiceInjoignableRenvoieUn503Propre() {
        // Aucun service n'écoute pendant ce test : le circuit breaker bascule sur le fallback.
        client.get().uri("/api/v1/venues").exchange()
                .expectStatus().isEqualTo(503)
                .expectBody().jsonPath("$.title").isEqualTo("Service indisponible");
    }
}
