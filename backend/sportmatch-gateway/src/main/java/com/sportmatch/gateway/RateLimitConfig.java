package com.sportmatch.gateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.cloud.gateway.support.ipresolver.XForwardedRemoteAddressResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;

/**
 * Limitation de débit (algorithme du seau à jetons, état partagé dans Redis entre les réplicas de la gateway).
 * Clé : identifiant Keycloak de l'utilisateur, sinon adresse IP du client (derrière l'ALB : dernier saut X-Forwarded-For).
 * En cas d'indisponibilité de Redis, les requêtes sont laissées passer (fail-open).
 */
@Configuration
@ConditionalOnProperty(name = "sportmatch.rate-limit.enabled", havingValue = "true", matchIfMissing = true)
public class RateLimitConfig {

    @Bean
    RedisRateLimiter redisRateLimiter(@Value("${sportmatch.rate-limit.replenish-per-second:50}") int replenish,
                                      @Value("${sportmatch.rate-limit.burst:100}") int burst) {
        return new RedisRateLimiter(replenish, burst, 1);
    }

    @Bean
    KeyResolver userOrIpKeyResolver() {
        XForwardedRemoteAddressResolver ipResolver = XForwardedRemoteAddressResolver.maxTrustedIndex(1);
        return exchange -> exchange.getPrincipal()
                .map(principal -> "u:" + principal.getName())
                .switchIfEmpty(Mono.fromSupplier(() -> {
                    InetSocketAddress address = ipResolver.resolve(exchange);
                    return "ip:" + (address == null || address.getAddress() == null ? "inconnue" : address.getAddress().getHostAddress());
                }));
    }
}
