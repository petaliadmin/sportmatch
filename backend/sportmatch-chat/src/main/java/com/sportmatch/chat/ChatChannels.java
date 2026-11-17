package com.sportmatch.chat;

import java.util.Optional;
import java.util.UUID;

/** Convention de nommage des canaux Redis pub/sub : un canal par conversation. */
public final class ChatChannels {

    public static final String PREFIX = "chat:conv:";
    public static final String PATTERN = PREFIX + "*";

    private ChatChannels() {
    }

    public static String channelFor(UUID conversationId) {
        return PREFIX + conversationId;
    }

    public static Optional<UUID> conversationOf(String channel) {
        if (channel == null || !channel.startsWith(PREFIX)) {
            return Optional.empty();
        }
        try {
            return Optional.of(UUID.fromString(channel.substring(PREFIX.length())));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
