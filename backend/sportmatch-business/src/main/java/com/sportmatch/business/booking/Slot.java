package com.sportmatch.business.booking;

import java.time.OffsetDateTime;

public record Slot(OffsetDateTime startsAt, OffsetDateTime endsAt, boolean available) {
}
