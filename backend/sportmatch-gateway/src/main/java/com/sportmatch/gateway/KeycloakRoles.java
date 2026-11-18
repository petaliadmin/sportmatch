package com.sportmatch.gateway;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/** Convertit les rôles de realm Keycloak (claim realm_access.roles) en autorités Spring Security ROLE_xxx. */
public final class KeycloakRoles {

    public static final String PLAYER = "player";
    public static final String ORGANIZER = "organizer";
    public static final String PROVIDER = "provider";
    public static final String ADMIN = "admin";

    private KeycloakRoles() {
    }

    public static List<String> of(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess == null) {
            return List.of();
        }
        Object roles = realmAccess.get("roles");
        if (roles instanceof Collection<?> collection) {
            return collection.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    public static Mono<AbstractAuthenticationToken> toAuthentication(Jwt jwt) {
        var authorities = of(jwt).stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)).toList();
        return Mono.just(new JwtAuthenticationToken(jwt, authorities, jwt.getSubject()));
    }
}
