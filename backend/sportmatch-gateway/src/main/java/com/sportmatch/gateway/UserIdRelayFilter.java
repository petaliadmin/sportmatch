package com.sportmatch.gateway;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Supprime tout en-tête X-User-Id envoyé par le client (anti-usurpation) puis le repose
 * à partir du "sub" du jeton validé. Les services en aval font confiance à cet en-tête.
 */
@Component
public class UserIdRelayFilter implements GlobalFilter, Ordered {

    public static final String USER_HEADER = "X-User-Id";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return exchange.getPrincipal()
                .filter(JwtAuthenticationToken.class::isInstance)
                .cast(JwtAuthenticationToken.class)
                .map(token -> withUser(exchange, token.getToken().getSubject()))
                .defaultIfEmpty(withUser(exchange, null))
                .flatMap(chain::filter);
    }

    private static ServerWebExchange withUser(ServerWebExchange exchange, String userId) {
        ServerHttpRequest request = exchange.getRequest().mutate()
                .headers(headers -> {
                    headers.remove(USER_HEADER);
                    if (userId != null) {
                        headers.set(USER_HEADER, userId);
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
