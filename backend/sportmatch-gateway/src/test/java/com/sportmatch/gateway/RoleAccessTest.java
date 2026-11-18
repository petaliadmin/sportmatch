package com.sportmatch.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockJwt;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = "sportmatch.rate-limit.enabled=false")
class RoleAccessTest {

    @Autowired
    WebTestClient client;

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
    void unAdministrateurPasseLaGateway() {
        // Le service admin n'écoute pas pendant le test : la gateway laisse passer puis renvoie le fallback 503.
        client.mutateWith(mockJwt().authorities(new SimpleGrantedAuthority("ROLE_admin")))
                .get().uri("/api/v1/admin/overview").exchange().expectStatus().isEqualTo(503);
    }
}
