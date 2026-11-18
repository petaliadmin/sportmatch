package com.sportmatch.notifications;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private static final String USER_HEADER = "X-User-Id";

    private final NotificationStore store;

    public NotificationController(NotificationStore store) {
        this.store = store;
    }

    @GetMapping
    public List<Notification> mine(@RequestHeader(USER_HEADER) String userId) {
        return store.forUser(userId);
    }

    /** Pastille de l'icône cloche (web et mobile). */
    @GetMapping("/unread-count")
    public Map<String, Long> unread(@RequestHeader(USER_HEADER) String userId) {
        return Map.of("unread", store.unreadCount(userId));
    }

    @PostMapping("/{id}/read")
    public Map<String, Long> read(@RequestHeader(USER_HEADER) String userId, @PathVariable("id") UUID id) {
        if (!store.markRead(userId, id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification introuvable");
        }
        return Map.of("unread", store.unreadCount(userId));
    }

    @PostMapping("/read-all")
    public Map<String, Long> readAll(@RequestHeader(USER_HEADER) String userId) {
        store.markAllRead(userId);
        return Map.of("unread", 0L);
    }
}
