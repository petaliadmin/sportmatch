package com.sportmatch.gateway;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Adresses internes des microservices (DNS Docker en local, Services Kubernetes ensuite). */
@ConfigurationProperties(prefix = "sportmatch.services")
public record ServiceUris(String app, String events, String business, String admin, String notifications, String chat) {
}
