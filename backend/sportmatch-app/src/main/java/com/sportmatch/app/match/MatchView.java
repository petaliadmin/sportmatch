package com.sportmatch.app.match;

import java.time.OffsetDateTime;
import java.util.UUID;

public record MatchView(
        UUID id,
        UUID venueId,
        String venueName,
        String sport,
        OffsetDateTime startsAt,
        int durationMinutes,
        int maxPlayers,
        String level,
        String organizerId,
        String status,
        int participants) {
}
