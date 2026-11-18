package com.sportmatch.gateway;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockJwt;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = "sportmatch.rate-limit.enabled=false")
class RoleAccessTest {

    @Autowired
    ApplicationContext context;

    WebTestClient client;

    @BeforeEach
    void bindToContext() {
        // mockJwt() exige un client lié au contexte (et non au port HTTP réel).
        client = WebTestClient.bindToApplicationContext(context).apply(springSecurity()).configureClient().build();
    }

    @Test
    void lesRolesDeRealmKeycloakSontLus() {
        Jwt jwt = Jwt.withTokenValue("t").header("alg", "none").subject("u1")
                .claim("realm_access", Map.of("roles", List.of("player", "provider")))
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(60)).build();

        assertThat(KeycloakRoles.of(jwt)).containsExactly("player", "provider");
        assertThat(KeycloakRoles.toAuthentication(jwt).block().getAuthorities())
                .extracting(Object::toString).containsExactly("ROLE_player", "ROLE_provider");
    }

    @Test
    void unJoueurNAccedePasAuBackOffice() {
        client.mutateWith(mockJwt().authorities(new SimpleGrantedAuthority("ROLE_player")))
                .get().uri("/api/v1/admin/overview").exchange().expectStatus().isForbidden();
    }

    @Test
    void unJoueurNAccedePasALEspacePrestataire() {
        client.mutateWith(mockJwt().authorities(new SimpleGrantedAuthority("ROLE_player")))
                .get().uri("/api/v1/business/pro/courts").exchange().expectStatus().isForbidden();
    }

    @Test
    void unPrestataireNAccedePasAuBackOffice() {
        // Le passage d'un admin jusqu'au service est vérifié de bout en bout par smoke-test.sh (étape 14).
        client.mutateWith(mockJwt().authorities(new SimpleGrantedAuthority("ROLE_provider")))
                .get().uri("/api/v1/admin/overview").exchange().expectStatus().isForbidden();
    }
}
