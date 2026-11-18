package com.sportmatch.gateway;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
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
 * Si la limitation de débit est active, chaque route REST consomme un jeton (réponse 429 au-delà).
 */
@Configuration
public class RoutesConfig {

    private final RedisRateLimiter rateLimiter;
    private final KeyResolver keyResolver;

    public RoutesConfig(@Value("${sportmatch.rate-limit.enabled:true}") boolean rateLimitEnabled,
                        ObjectProvider<RedisRateLimiter> rateLimiter, ObjectProvider<KeyResolver> keyResolver) {
        // Spring Cloud Gateway auto-configure aussi un limiteur dès que Redis est présent : on ne l'applique que si activé.
        this.rateLimiter = rateLimitEnabled ? rateLimiter.getIfAvailable() : null;
        this.keyResolver = rateLimitEnabled ? keyResolver.getIfAvailable() : null;
    }

    @Bean
    RouteLocator sportmatchRoutes(RouteLocatorBuilder builder, ServiceUris uris) {
        return builder.routes()
                .route("sportmatch-chat-ws", r -> r.path("/api/v1/chat/ws").uri(uris.chat()))
                .route("sportmatch-app", r -> r.path("/api/v1/venues/**", "/api/v1/matches/**", "/api/v1/players/**", "/api/v1/me/**")
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

    private UriSpec resilient(GatewayFilterSpec filters, String service) {
        GatewayFilterSpec spec = filters;
        if (rateLimiter != null && keyResolver != null) {
            spec = spec.requestRateLimiter(rl -> rl.setRateLimiter(rateLimiter).setKeyResolver(keyResolver));
        }
        return spec
                .retry(retry -> retry.setRetries(2).setMethods(HttpMethod.GET))
                .circuitBreaker(cb -> cb.setName(service).setFallbackUri("forward:/fallback/" + service));
    }
}
