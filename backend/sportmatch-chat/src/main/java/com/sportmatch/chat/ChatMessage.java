package com.sportmatch.chat;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ChatMessage(UUID id, UUID conversationId, String senderId, String body, OffsetDateTime sentAt) {
}
