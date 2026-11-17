package com.sportmatch.gateway;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.GatewayFilterSpec;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.cloud.gateway.route.builder.UriSpec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

/**
 * Routage vers les microservices. Chaque route REST est protégée par un circuit breaker Resilience4j
 * (réponse 503 propre si le service est indisponible) et rejoue 2 fois les GET en échec réseau.
 * Le WebSocket du chat passe par une route dédiée, sans circuit breaker (connexion longue durée).
 */
@Configuration
public class RoutesConfig {

    @Bean
    RouteLocator sportmatchRoutes(RouteLocatorBuilder builder, ServiceUris uris) {
        return builder.routes()
                .route("sportmatch-chat-ws", r -> r.path("/api/v1/chat/ws").uri(uris.chat()))
                .route("sportmatch-app", r -> r.path("/api/v1/venues/**", "/api/v1/matches/**")
                        .filters(f -> resilient(f, "app")).uri(uris.app()))
                .route("sportmatch-events", r -> r.path("/api/v1/events/**")
                        .filters(f -> resilient(f, "events")).uri(uris.events()))
                .route("sportmatch-business", r -> r.path("/api/v1/business/**")
                        .filters(f -> resilient(f, "business")).uri(uris.business()))
                .route("sportmatch-admin", r -> r.path("/api/v1/admin/**")
                        .filters(f -> resilient(f, "admin")).uri(uris.admin()))
                .route("sportmatch-notifications", r -> r.path("/api/v1/notifications/**")
                        .filters(f -> resilient(f, "notifications")).uri(uris.notifications()))
                .route("sportmatch-chat", r -> r.path("/api/v1/chat/**")
                        .filters(f -> resilient(f, "chat")).uri(uris.chat()))
                .build();
    }

    private static UriSpec resilient(GatewayFilterSpec filters, String service) {
        return filters
                .retry(retry -> retry.setRetries(2).setMethods(HttpMethod.GET))
                .circuitBreaker(cb -> cb.setName(service).setFallbackUri("forward:/fallback/" + service));
    }
}
