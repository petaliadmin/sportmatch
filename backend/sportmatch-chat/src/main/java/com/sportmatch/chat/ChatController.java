package com.sportmatch.chat;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final ConversationStore store;
    private final ChatBroadcaster broadcaster;

    public ChatController(ConversationStore store, ChatBroadcaster broadcaster) {
        this.store = store;
        this.broadcaster = broadcaster;
    }

    @GetMapping("/conversations")
    public List<Conversation> mine(@RequestHeader("X-User-Id") String userId) {
        return store.mine(userId);
    }

    @GetMapping("/conversations/by-match/{matchId}")
    public Map<String, UUID> byMatch(@RequestHeader("X-User-Id") String userId, @PathVariable("matchId") UUID matchId) {
        UUID id = store.forMatch(matchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation pas encore créée"));
        if (!store.isMember(id, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tu ne participes pas à ce match");
        }
        return Map.of("conversationId", id);
    }

    @GetMapping("/conversations/{id}/messages")
    public List<ChatMessage> messages(@RequestHeader("X-User-Id") String userId, @PathVariable("id") UUID id) {
        return store.messages(id, userId);
    }

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<ChatMessage> post(@RequestHeader("X-User-Id") String userId, @PathVariable("id") UUID id,
                                            @Valid @RequestBody PostMessageRequest request) {
        ChatMessage message = store.post(id, userId, request.body());
        broadcaster.publish(message);
        return ResponseEntity.status(HttpStatus.CREATED).body(message);
    }
}
