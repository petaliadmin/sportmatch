package com.sportmatch.chat;

import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;
import java.util.UUID;

/** N'accepte la connexion WebSocket que si l'utilisateur (posé par la gateway) est membre de la conversation. */
@Component
public class MembershipHandshakeInterceptor implements HandshakeInterceptor {

    private final ConversationStore store;

    public MembershipHandshakeInterceptor(ConversationStore store) {
        this.store = store;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        String userId = request.getHeaders().getFirst("X-User-Id");
        String raw = UriComponentsBuilder.fromUri(request.getURI()).build().getQueryParams().getFirst("conversationId");
        UUID conversationId;
        try {
            conversationId = raw == null ? null : UUID.fromString(raw);
        } catch (IllegalArgumentException e) {
            conversationId = null;
        }
        if (userId == null || conversationId == null || !store.isMember(conversationId, userId)) {
            response.setStatusCode(HttpStatus.FORBIDDEN);
            return false;
        }
        attributes.put(ChatWebSocketHandler.ATTR_USER, userId);
        attributes.put(ChatWebSocketHandler.ATTR_CONVERSATION, conversationId);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }
}
