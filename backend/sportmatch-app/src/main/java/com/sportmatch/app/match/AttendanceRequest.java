package com.sportmatch.app.match;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AttendanceRequest(@NotBlank String playerId, @NotNull Boolean present) {
}
