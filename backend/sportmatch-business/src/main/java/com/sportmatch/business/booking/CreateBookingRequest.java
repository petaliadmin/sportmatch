package com.sportmatch.business.booking;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CreateBookingRequest(
        @NotNull UUID courtId,
        @NotNull OffsetDateTime startsAt,
        @Min(1) @Max(3) int hours) {
}
