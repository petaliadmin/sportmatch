package com.sportmatch.notifications;

import java.time.OffsetDateTime;
import java.util.UUID;

public record Notification(UUID id, String userId, String title, String body, OffsetDateTime createdAt, OffsetDateTime readAt) {
}
