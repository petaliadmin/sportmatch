package com.sportmatch.app.player;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfile(
        @NotBlank @Size(max = 120) String displayName,
        @Size(max = 30) String favoriteSport,
        @Size(max = 30) String level,
        @Size(max = 80) String district,
        @Size(max = 280) String bio) {
}
