package com.sportmatch.gateway;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Supprime tout en-tête d'identité X-User-* envoyé par le client (anti-usurpation) puis les repose
 * à partir des claims du jeton validé : sub, email, name, realm_access.roles, preferred_username. Les services en aval font confiance à cet en-tête.
 */
@Component
public class UserIdRelayFilter implements GlobalFilter, Ordered {

    public static final String USER_HEADER = "X-User-Id";
    public static final String EMAIL_HEADER = "X-User-Email";
    /** Nom affichable, encodé en URL (UTF-8) pour rester un en-tête HTTP ASCII valide. */
    public static final String NAME_HEADER = "X-User-Name";
    /** Rôles de realm séparés par des virgules (ex. "player,provider"). */
    public static final String ROLES_HEADER = "X-User-Roles";
    /** Identifiant de connexion Keycloak (preferred_username), stable et lisible. */
    public static final String LOGIN_HEADER = "X-User-Login";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return exchange.getPrincipal()
                .filter(JwtAuthenticationToken.class::isInstance)
                .cast(JwtAuthenticationToken.class)
                .map(token -> withUser(exchange, new Identity(token.getToken().getSubject(),
                        token.getToken().getClaimAsString("email"), displayName(token),
                        String.join(",", KeycloakRoles.of(token.getToken())),
                        token.getToken().getClaimAsString("preferred_username"))))
                .defaultIfEmpty(withUser(exchange, Identity.ANONYMOUS))
                .flatMap(chain::filter);
    }

    private static String displayName(JwtAuthenticationToken token) {
        String name = token.getToken().getClaimAsString("name");
        if (name == null || name.isBlank()) {
            name = token.getToken().getClaimAsString("preferred_username");
        }
        return name == null ? null : URLEncoder.encode(name, StandardCharsets.UTF_8);
    }

    private record Identity(String userId, String email, String name, String roles, String login) {
        static final Identity ANONYMOUS = new Identity(null, null, null, null, null);
    }

    private static ServerWebExchange withUser(ServerWebExchange exchange, Identity id) {
        ServerHttpRequest request = exchange.getRequest().mutate()
                .headers(headers -> {
                    for (String h : new String[]{USER_HEADER, EMAIL_HEADER, NAME_HEADER, ROLES_HEADER, LOGIN_HEADER}) {
                        headers.remove(h);
                    }
                    setIfPresent(headers, USER_HEADER, id.userId());
                    setIfPresent(headers, EMAIL_HEADER, id.email());
                    setIfPresent(headers, NAME_HEADER, id.name());
                    setIfPresent(headers, ROLES_HEADER, id.roles());
                    setIfPresent(headers, LOGIN_HEADER, id.login());
                })
                .build();
        return exchange.mutate().request(request).build();
    }

    private static void setIfPresent(org.springframework.http.HttpHeaders headers, String name, String value) {
        if (value != null && !value.isBlank()) {
            headers.set(name, value);
        }
    }

    @Override
    public int getOrder() {
        return 0;
    }
}
