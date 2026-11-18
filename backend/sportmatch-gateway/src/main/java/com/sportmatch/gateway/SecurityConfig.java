package com.sportmatch.gateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.server.resource.web.server.authentication.ServerBearerTokenAuthenticationConverter;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Lecture publique du catalogue (terrains, matchs, tournois) ; toute écriture et toute donnée personnelle
 * exigent un jeton JWT Keycloak valide ; l'espace prestataire et le back-office exigent en plus le rôle adéquat.
 */
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        // Les navigateurs ne peuvent pas poser d'en-tête Authorization sur un WebSocket :
        // le jeton est alors accepté en paramètre ?access_token= (requêtes GET uniquement).
        ServerBearerTokenAuthenticationConverter bearer = new ServerBearerTokenAuthenticationConverter();
        bearer.setAllowUriQueryParameter(true);
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(Customizer.withDefaults())
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers("/actuator/health/**", "/actuator/info", "/actuator/prometheus").permitAll()
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers("/fallback/**").permitAll()
                        .pathMatchers("/api/v1/matches/mine").authenticated()
                        .pathMatchers(HttpMethod.GET, "/api/v1/venues/**", "/api/v1/matches/**", "/api/v1/business/courts/**",
                                "/api/v1/events/tournaments/**").permitAll()
                        // Espaces réservés : contrôle par rôle Keycloak dès la gateway (les services revérifient).
                        .pathMatchers("/api/v1/admin/**").hasRole(KeycloakRoles.ADMIN)
                        .pathMatchers("/api/v1/business/pro/**").hasRole(KeycloakRoles.PROVIDER)
                        .anyExchange().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.bearerTokenConverter(bearer)
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(KeycloakRoles::toAuthentication)))
                .build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${sportmatch.cors.allowed-origins:http://localhost:3000}") List<String> allowedOrigins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
