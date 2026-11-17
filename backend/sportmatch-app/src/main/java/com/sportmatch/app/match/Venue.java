package com.sportmatch.app.match;

import java.math.BigDecimal;
import java.util.UUID;

public record Venue(
        UUID id,
        String name,
        String district,
        String sport,
        int pricePerHourFcfa,
        BigDecimal rating) {
}
