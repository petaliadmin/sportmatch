package com.sportmatch.chat;

import java.time.OffsetDateTime;
import java.util.UUID;

public record Conversation(UUID id, UUID matchId, int members, String lastMessage, OffsetDateTime lastMessageAt) {
}
