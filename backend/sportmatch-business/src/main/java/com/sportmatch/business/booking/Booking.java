package com.sportmatch.business.booking;

import java.time.OffsetDateTime;
import java.util.UUID;

public record Booking(UUID id, UUID courtId, String courtName, String venueName, String userId,
                      OffsetDateTime startsAt, OffsetDateTime endsAt, int priceFcfa, String status,
                      OffsetDateTime createdAt) {
}
