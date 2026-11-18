package com.sportmatch.notifications;

import com.sportmatch.commons.events.EventEnvelope;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationStore {

    private final JdbcClient jdbc;
    private final EmailSender email;

    public NotificationStore(JdbcClient jdbc, EmailSender email) {
        this.jdbc = jdbc;
        this.email = email;
    }

    /** Consommateur idempotent : un même eventId reçu deux fois ne crée qu'une notification. */
    @Transactional
    public void handle(EventEnvelope event) {
        int firstTime = jdbc.sql("""
                        insert into processed_event (event_id, event_type) values (:eventId, :eventType)
                        on conflict (event_id) do nothing
                        """)
                .param("eventId", event.eventId())
                .param("eventType", event.eventType())
                .update();
        if (firstTime == 0) {
            return;
        }
        NotificationFactory.all(event).forEach(n -> {
            jdbc.sql("""
                        insert into notification (id, user_id, title, body, source_event_id)
                        values (:id, :userId, :title, :body, :eventId)
                        """)
                .param("id", UUID.randomUUID())
                .param("userId", n.userId())
                .param("title", n.title())
                .param("body", n.body())
                .param("eventId", event.eventId())
                .update();
            email.send(event.payload().path("userEmail").asText(null), n);
        });
    }

    public List<Notification> forUser(String userId) {
        return jdbc.sql("""
                        select id, user_id, title, body, created_at, read_at
                        from notification where user_id = :userId
                        order by created_at desc limit 50
                        """)
                .param("userId", userId)
                .query(Notification.class)
                .list();
    }

    public long unreadCount(String userId) {
        return jdbc.sql("select count(*) from notification where user_id = :userId and read_at is null")
                .param("userId", userId).query(Long.class).single();
    }

    /** Marque une notification lue ; renvoie false si elle n'appartient pas à l'utilisateur. */
    public boolean markRead(String userId, UUID id) {
        return jdbc.sql("update notification set read_at = coalesce(read_at, now()) where id = :id and user_id = :userId")
                .param("id", id).param("userId", userId).update() > 0;
    }

    public int markAllRead(String userId) {
        return jdbc.sql("update notification set read_at = now() where user_id = :userId and read_at is null")
                .param("userId", userId).update();
    }
}
