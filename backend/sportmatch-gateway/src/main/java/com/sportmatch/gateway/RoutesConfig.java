package com.sportmatch.gateway;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RoutesConfig {

    @Bean
    RouteLocator sportmatchRoutes(RouteLocatorBuilder builder, ServiceUris uris) {
        return builder.routes()
                .route("sportmatch-app", r -> r.path("/api/v1/venues/**", "/api/v1/matches/**").uri(uris.app()))
                .route("sportmatch-events", r -> r.path("/api/v1/events/**").uri(uris.events()))
                .route("sportmatch-business", r -> r.path("/api/v1/business/**").uri(uris.business()))
                .route("sportmatch-admin", r -> r.path("/api/v1/admin/**").uri(uris.admin()))
                .route("sportmatch-notifications", r -> r.path("/api/v1/notifications/**").uri(uris.notifications()))
                .route("sportmatch-chat", r -> r.path("/api/v1/chat/**").uri(uris.chat()))
                .build();
    }
}
