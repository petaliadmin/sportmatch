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

    public NotificationStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
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
        NotificationFactory.from(event).ifPresent(n -> jdbc.sql("""
                        insert into notification (id, user_id, title, body, source_event_id)
                        values (:id, :userId, :title, :body, :eventId)
                        """)
                .param("id", UUID.randomUUID())
                .param("userId", n.userId())
                .param("title", n.title())
                .param("body", n.body())
                .param("eventId", event.eventId())
                .update());
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
}
