package com.sportmatch.chat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket en réception seule : le client envoie ses messages en REST (POST),
 * et reçoit ici en temps réel ceux de la conversation, relayés depuis Redis.
 */
@Component
public class ChatWebSocketHandler extends TextWebSocketHandler implements MessageListener {

    static final String ATTR_CONVERSATION = "conversationId";
    static final String ATTR_USER = "userId";
    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketHandler.class);

    private final Map<UUID, Set<WebSocketSession>> sessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        UUID conversationId = (UUID) session.getAttributes().get(ATTR_CONVERSATION);
        WebSocketSession safe = new ConcurrentWebSocketSessionDecorator(session, 5_000, 512 * 1024);
        sessions.computeIfAbsent(conversationId, k -> ConcurrentHashMap.newKeySet()).add(safe);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        UUID conversationId = (UUID) session.getAttributes().get(ATTR_CONVERSATION);
        Set<WebSocketSession> set = sessions.get(conversationId);
        if (set != null) {
            set.removeIf(s -> s.getId().equals(session.getId()));
        }
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String channel = new String(message.getChannel(), StandardCharsets.UTF_8);
        String payload = new String(message.getBody(), StandardCharsets.UTF_8);
        ChatChannels.conversationOf(channel).map(sessions::get).ifPresent(targets -> targets.forEach(s -> {
            try {
                if (s.isOpen()) {
                    s.sendMessage(new TextMessage(payload));
                }
            } catch (IOException e) {
                log.debug("Envoi WebSocket impossible vers {} : {}", s.getId(), e.getMessage());
            }
        }));
    }

    public int connectedSessions() {
        return sessions.values().stream().mapToInt(Set::size).sum();
    }
}
