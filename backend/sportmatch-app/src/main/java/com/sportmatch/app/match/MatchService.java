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

    private static final String VENUE_COLUMNS = """
            id, name, district, sport, price_per_hour_fcfa, rating,
            ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude""";

    public List<Venue> venues(String sport) {
        String sql = "select " + VENUE_COLUMNS + ", null::float8 as distance_km from venue";
        if (sport == null || sport.isBlank()) {
            return jdbc.sql(sql + " order by name").query(Venue.class).list();
        }
        return jdbc.sql(sql + " where sport = :sport order by name")
                .param("sport", sport.toUpperCase())
                .query(Venue.class)
                .list();
    }

    public Venue venue(UUID id) {
        return jdbc.sql("select " + VENUE_COLUMNS + ", null::float8 as distance_km from venue where id = :id")
                .param("id", id)
                .query(Venue.class)
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Terrain introuvable"));
    }

    /** Terrains dans un rayon donné, du plus proche au plus éloigné (index GiST PostGIS). */
    public List<Venue> nearby(double latitude, double longitude, double radiusKm, String sport) {
        String sql = "select " + VENUE_COLUMNS + """
                , round((ST_Distance(location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) / 1000)::numeric, 2)::float8 as distance_km
                from venue
                where location is not null
                  and ST_DWithin(location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)
                  and (cast(:sport as varchar) is null or sport = cast(:sport as varchar))
                order by distance_km
                """;
        return jdbc.sql(sql)
                .param("lat", latitude).param("lng", longitude).param("radius", radiusKm * 1000)
                .param("sport", sport == null || sport.isBlank() ? null : sport.toUpperCase())
                .query(Venue.class).list();
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

    @Transactional
    public MatchView cancel(String userId, boolean admin, UUID matchId) {
        MatchLock lock = jdbc.sql("select status, max_players, organizer_id from sport_match where id = :id for update")
                .param("id", matchId)
                .query(MatchLock.class)
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match introuvable"));
        boolean organizer = lock.organizerId().equals(userId);
        MatchRules.ensureCanCancel(lock.status(), organizer, admin);
        jdbc.sql("update sport_match set status = 'CANCELLED' where id = :id").param("id", matchId).update();

        List<String> participants = jdbc.sql("select player_id from match_participant where match_id = :id order by joined_at")
                .param("id", matchId).query(String.class).list();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("matchId", matchId.toString());
        payload.put("organizerId", lock.organizerId());
        payload.put("cancelledBy", userId);
        payload.put("byModeration", !organizer);
        payload.put("participantIds", participants);
        outbox.append(Topics.MATCH_V1, "match", matchId.toString(), "match.cancelled", payload);
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
