package com.sportmatch.app.match;

import com.sportmatch.messaging.OutboxWriter;
import com.sportmatch.commons.events.Topics;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class MatchService {

    private static final String MATCH_SELECT = """
            select m.id, m.venue_id, v.name as venue_name, m.sport, m.starts_at, m.duration_minutes,
                   m.max_players, m.level, m.organizer_id, m.status,
                   (select count(*) from match_participant p where p.match_id = m.id) as participants
            from sport_match m
            join venue v on v.id = m.venue_id
            """;

    private final JdbcClient jdbc;
    private final OutboxWriter outbox;

    public MatchService(JdbcClient jdbc, OutboxWriter outbox) {
        this.jdbc = jdbc;
        this.outbox = outbox;
    }

    public List<Venue> venues(String sport) {
        String sql = "select id, name, district, sport, price_per_hour_fcfa, rating from venue";
        if (sport == null || sport.isBlank()) {
            return jdbc.sql(sql + " order by name").query(Venue.class).list();
        }
        return jdbc.sql(sql + " where sport = :sport order by name")
                .param("sport", sport.toUpperCase())
                .query(Venue.class)
                .list();
    }

    public Venue venue(UUID id) {
        return jdbc.sql("select id, name, district, sport, price_per_hour_fcfa, rating from venue where id = :id")
                .param("id", id)
                .query(Venue.class)
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Terrain introuvable"));
    }

    public List<MatchView> matches(String status) {
        return jdbc.sql(MATCH_SELECT + " where m.status = :status order by m.starts_at")
                .param("status", status.toUpperCase())
                .query(MatchView.class)
                .list();
    }

    public MatchView match(UUID id) {
        return jdbc.sql(MATCH_SELECT + " where m.id = :id")
                .param("id", id)
                .query(MatchView.class)
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match introuvable"));
    }

    @Transactional
    public MatchView create(String organizerId, CreateMatchRequest request) {
        venue(request.venueId());
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                        insert into sport_match (id, venue_id, sport, starts_at, duration_minutes, max_players, level, organizer_id, status)
                        values (:id, :venueId, :sport, :startsAt, :duration, :maxPlayers, :level, :organizerId, 'OPEN')
                        """)
                .param("id", id)
                .param("venueId", request.venueId())
                .param("sport", request.sport().toUpperCase())
                .param("startsAt", request.startsAt())
                .param("duration", request.durationMinutes())
                .param("maxPlayers", request.maxPlayers())
                .param("level", request.level().toUpperCase())
                .param("organizerId", organizerId)
                .update();
        addParticipant(id, organizerId);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("matchId", id.toString());
        payload.put("organizerId", organizerId);
        payload.put("venueId", request.venueId().toString());
        payload.put("sport", request.sport().toUpperCase());
        payload.put("startsAt", request.startsAt().toString());
        payload.put("maxPlayers", request.maxPlayers());
        outbox.append(Topics.MATCH_V1, "match", id.toString(), "match.created", payload);
        return match(id);
    }

    @Transactional
    public MatchView join(String playerId, UUID matchId) {
        MatchLock lock = jdbc.sql("select status, max_players, organizer_id from sport_match where id = :id for update")
                .param("id", matchId)
                .query(MatchLock.class)
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match introuvable"));

        int participants = jdbc.sql("select count(*) from match_participant where match_id = :id")
                .param("id", matchId)
                .query(Long.class)
                .single()
                .intValue();
        boolean alreadyJoined = jdbc.sql("select exists(select 1 from match_participant where match_id = :id and player_id = :player)")
                .param("id", matchId)
                .param("player", playerId)
                .query(Boolean.class)
                .single();

        MatchRules.ensureCanJoin(lock.status(), participants, lock.maxPlayers(), alreadyJoined);
        addParticipant(matchId, playerId);

        int after = participants + 1;
        String newStatus = MatchRules.statusAfterJoin(after, lock.maxPlayers());
        if (!newStatus.equals(lock.status())) {
            jdbc.sql("update sport_match set status = :status where id = :id")
                    .param("status", newStatus)
                    .param("id", matchId)
                    .update();
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("matchId", matchId.toString());
        payload.put("playerId", playerId);
        payload.put("organizerId", lock.organizerId());
        payload.put("participants", after);
        payload.put("maxPlayers", lock.maxPlayers());
        payload.put("status", newStatus);
        outbox.append(Topics.MATCH_V1, "match", matchId.toString(), "match.player-joined", payload);
        return match(matchId);
    }

    private void addParticipant(UUID matchId, String playerId) {
        jdbc.sql("insert into match_participant (match_id, player_id) values (:matchId, :playerId)")
                .param("matchId", matchId)
                .param("playerId", playerId)
                .update();
    }

    public record MatchLock(String status, int maxPlayers, String organizerId) {
    }
}
