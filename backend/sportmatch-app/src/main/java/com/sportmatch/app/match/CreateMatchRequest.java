package com.sportmatch.app.match;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CreateMatchRequest(
        @NotNull UUID venueId,
        @NotBlank String sport,
        @NotNull @Future OffsetDateTime startsAt,
        @Min(30) @Max(240) int durationMinutes,
        @Min(2) @Max(30) int maxPlayers,
        @NotBlank String level,
        /** Match récurrent : nombre de semaines supplémentaires (0 à 8), même jour, même heure. */
        @Min(0) @Max(8) Integer repeatWeeks) {

    public int occurrences() {
        return 1 + (repeatWeeks == null ? 0 : repeatWeeks);
    }
}
