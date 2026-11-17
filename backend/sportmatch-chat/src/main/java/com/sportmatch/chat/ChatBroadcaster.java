package com.sportmatch.chat;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * Publie chaque nouveau message sur Redis : toutes les instances du service le reçoivent
 * et le poussent à leurs clients WebSocket connectés (passage à l'échelle horizontal).
 */
@Component
public class ChatBroadcaster {

    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;

    public ChatBroadcaster(StringRedisTemplate redis, ObjectMapper mapper) {
        this.redis = redis;
        this.mapper = mapper;
    }

    public void publish(ChatMessage message) {
        try {
            redis.convertAndSend(ChatChannels.channelFor(message.conversationId()), mapper.writeValueAsString(message));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }
}
