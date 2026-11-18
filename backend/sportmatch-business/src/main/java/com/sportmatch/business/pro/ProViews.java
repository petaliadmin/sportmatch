package com.sportmatch.business.pro;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.UUID;

/** Représentations de l'espace prestataire. */
public final class ProViews {

    private ProViews() {
    }

    public record ProCourt(UUID id, UUID venueId, String venueName, String name, String sport,
                           int pricePerHourFcfa, int openHour, int closeHour, int upcomingBookings) {
    }

    public record ProBooking(UUID id, UUID courtId, String courtName, String venueName, String customerEmail,
                             OffsetDateTime startsAt, OffsetDateTime endsAt, int priceFcfa, String status) {
    }

    public record Dashboard(int courts, int bookingsNext7Days, long revenueNext7DaysFcfa, long revenueLast30DaysFcfa,
                            int occupancyTodayPercent, int blockedSlotsNext7Days) {
    }

    public record CreateCourt(@NotNull UUID venueId,
                              @NotBlank @Size(max = 120) String venueName,
                              @NotBlank @Size(max = 80) String name,
                              @NotBlank String sport,
                              @Min(0) @Max(1_000_000) int pricePerHourFcfa,
                              @Min(0) @Max(23) int openHour,
                              @Min(1) @Max(24) int closeHour) {
    }

    public record UpdateCourt(@Min(0) @Max(1_000_000) Integer pricePerHourFcfa,
                              @Min(0) @Max(23) Integer openHour,
                              @Min(1) @Max(24) Integer closeHour) {
    }

    public record BlockSlot(@NotNull OffsetDateTime startsAt, @Min(1) @Max(12) int hours) {
    }
}
