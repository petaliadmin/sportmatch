package com.sportmatch.app.match;

import java.math.BigDecimal;
import java.util.UUID;

/** Terrain du catalogue. distanceKm n'est renseignée que pour une recherche à proximité. */
public record Venue(
        UUID id,
        String name,
        String district,
        String sport,
        int pricePerHourFcfa,
        BigDecimal rating,
        Double latitude,
        Double longitude,
        Double distanceKm) {
}
