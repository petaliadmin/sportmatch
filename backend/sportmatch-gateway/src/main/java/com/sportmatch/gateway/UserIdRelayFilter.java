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
 * Supprime tout en-tête X-User-Id / X-User-Email envoyé par le client (anti-usurpation) puis les repose
 * à partir des claims "sub" et "email" du jeton validé. Les services en aval font confiance à cet en-tête.
 */
@Component
public class UserIdRelayFilter implements GlobalFilter, Ordered {

    public static final String USER_HEADER = "X-User-Id";
    public static final String EMAIL_HEADER = "X-User-Email";
    /** Nom affichable, encodé en URL (UTF-8) pour rester un en-tête HTTP ASCII valide. */
    public static final String NAME_HEADER = "X-User-Name";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return exchange.getPrincipal()
                .filter(JwtAuthenticationToken.class::isInstance)
                .cast(JwtAuthenticationToken.class)
                .map(token -> withUser(exchange, token.getToken().getSubject(), token.getToken().getClaimAsString("email"),
                        displayName(token)))
                .defaultIfEmpty(withUser(exchange, null, null, null))
                .flatMap(chain::filter);
    }

    private static String displayName(JwtAuthenticationToken token) {
        String name = token.getToken().getClaimAsString("name");
        if (name == null || name.isBlank()) {
            name = token.getToken().getClaimAsString("preferred_username");
        }
        return name == null ? null : URLEncoder.encode(name, StandardCharsets.UTF_8);
    }

    private static ServerWebExchange withUser(ServerWebExchange exchange, String userId, String email, String name) {
        ServerHttpRequest request = exchange.getRequest().mutate()
                .headers(headers -> {
                    headers.remove(USER_HEADER);
                    headers.remove(EMAIL_HEADER);
                    headers.remove(NAME_HEADER);
                    if (name != null) {
                        headers.set(NAME_HEADER, name);
                    }
                    if (userId != null) {
                        headers.set(USER_HEADER, userId);
                    }
                    if (email != null) {
                        headers.set(EMAIL_HEADER, email);
                    }
                })
                .build();
        return exchange.mutate().request(request).build();
    }

    @Override
    public int getOrder() {
        return 0;
    }
}
