package com.sportmatch.chat;

import com.sportmatch.commons.events.EventEnvelope;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ConversationStore {

    private final JdbcClient jdbc;

    public ConversationStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /** Consommateur idempotent des événements de match : crée la conversation et y inscrit les joueurs. */
    @Transactional
    public void onMatchEvent(EventEnvelope event) {
        int firstTime = jdbc.sql("insert into processed_event (event_id, event_type) values (:id, :type) on conflict (event_id) do nothing")
                .param("id", event.eventId()).param("type", event.eventType()).update();
        if (firstTime == 0) {
            return;
        }
        var members = MembershipEvents.membersFrom(event);
        if (members.isEmpty()) {
            return;
        }
        UUID matchId = UUID.fromString(event.payload().path("matchId").asText());
        jdbc.sql("insert into conversation (id, match_id) values (:id, :matchId) on conflict (match_id) do nothing")
                .param("id", UUID.randomUUID()).param("matchId", matchId).update();
        UUID conversationId = jdbc.sql("select id from conversation where match_id = :matchId")
                .param("matchId", matchId).query(UUID.class).single();
        for (String userId : members) {
            jdbc.sql("insert into conversation_member (conversation_id, user_id) values (:c, :u) on conflict do nothing")
                    .param("c", conversationId).param("u", userId).update();
        }
    }

    public boolean isMember(UUID conversationId, String userId) {
        return jdbc.sql("select exists(select 1 from conversation_member where conversation_id = :c and user_id = :u)")
                .param("c", conversationId).param("u", userId).query(Boolean.class).single();
    }

    public List<Conversation> mine(String userId) {
        return jdbc.sql("""
                        select c.id, c.match_id,
                               (select count(*) from conversation_member m2 where m2.conversation_id = c.id) as members,
                               lm.body as last_message, lm.sent_at as last_message_at
                        from conversation c
                        join conversation_member m on m.conversation_id = c.id and m.user_id = :u
                        left join lateral (select body, sent_at from message where conversation_id = c.id
                                           order by sent_at desc limit 1) lm on true
                        order by coalesce(lm.sent_at, c.created_at) desc
                        """)
                .param("u", userId).query(Conversation.class).list();
    }

    public Optional<UUID> forMatch(UUID matchId) {
        return jdbc.sql("select id from conversation where match_id = :m").param("m", matchId).query(UUID.class).optional();
    }

    public List<ChatMessage> messages(UUID conversationId, String userId) {
        requireMember(conversationId, userId);
        return jdbc.sql("""
                        select * from (
                          select id, conversation_id, sender_id, body, sent_at from message
                          where conversation_id = :c order by sent_at desc limit 100
                        ) recent order by sent_at
                        """)
                .param("c", conversationId).query(ChatMessage.class).list();
    }

    public ChatMessage post(UUID conversationId, String userId, String body) {
        requireMember(conversationId, userId);
        UUID id = UUID.randomUUID();
        jdbc.sql("insert into message (id, conversation_id, sender_id, body) values (:id, :c, :u, :b)")
                .param("id", id).param("c", conversationId).param("u", userId).param("b", body.strip()).update();
        return jdbc.sql("select id, conversation_id, sender_id, body, sent_at from message where id = :id")
                .param("id", id).query(ChatMessage.class).single();
    }

    private void requireMember(UUID conversationId, String userId) {
        if (!isMember(conversationId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tu ne participes pas à ce match");
        }
    }
}
