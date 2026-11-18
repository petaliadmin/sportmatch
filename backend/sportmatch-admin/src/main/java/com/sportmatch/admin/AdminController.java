package com.sportmatch.admin;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Back-office : vue d'ensemble de l'activité et journal des événements. Réservé au rôle "admin". */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    public record PlatformEvent(UUID eventId, String eventType, String source, String aggregateId,
                                OffsetDateTime occurredAt, String payload) {
    }

    public record DayCount(LocalDate day, long count) {
    }

    public record TypeCount(String eventType, long last24h, long last7d) {
    }

    public record Overview(long totalEvents, List<TypeCount> byType, List<DayCount> last7Days, Map<String, Long> kpis) {
    }

    private final JdbcClient jdbc;

    public AdminController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    static void requireAdmin(String roles) {
        if (roles == null || !Arrays.asList(roles.split(",")).contains("admin")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Back-office réservé aux administrateurs");
        }
    }

    @GetMapping("/overview")
    public Overview overview(@RequestHeader(name = "X-User-Roles", required = false) String roles) {
        requireAdmin(roles);
        long total = jdbc.sql("select count(*) from platform_event").query(Long.class).single();
        List<TypeCount> byType = jdbc.sql("""
                        select event_type,
                               count(*) filter (where occurred_at > now() - interval '24 hours') as last24h,
                               count(*) filter (where occurred_at > now() - interval '7 days') as last7d
                        from platform_event group by event_type order by last7d desc, event_type
                        """)
                .query(TypeCount.class).list();
        List<DayCount> days = jdbc.sql("""
                        select d::date as day, count(e.event_id) as count
                        from generate_series(current_date - 6, current_date, interval '1 day') d
                        left join platform_event e on e.occurred_at::date = d::date
                        group by d order by d
                        """)
                .query(DayCount.class).list();
        Map<String, Long> kpis = new LinkedHashMap<>();
        kpis.put("matchsCrees7j", count7d(byType, "match.created"));
        kpis.put("inscriptionsMatch7j", count7d(byType, "match.player-joined"));
        kpis.put("matchsAnnules7j", count7d(byType, "match.cancelled"));
        kpis.put("reservations7j", count7d(byType, "booking.confirmed"));
        kpis.put("annulationsReservation7j", count7d(byType, "booking.cancelled"));
        kpis.put("tournoisCrees7j", count7d(byType, "tournament.created"));
        kpis.put("equipesInscrites7j", count7d(byType, "tournament.team-registered"));
        return new Overview(total, byType, days, kpis);
    }

    @GetMapping("/events")
    public List<PlatformEvent> events(@RequestHeader(name = "X-User-Roles", required = false) String roles,
                                      @RequestParam(name = "type", required = false) String type,
                                      @RequestParam(name = "limit", defaultValue = "50") int limit) {
        requireAdmin(roles);
        int safeLimit = Math.max(1, Math.min(limit, 200));
        String sql = "select event_id, event_type, source, aggregate_id, occurred_at, payload from platform_event";
        if (type == null || type.isBlank()) {
            return jdbc.sql(sql + " order by occurred_at desc limit :limit").param("limit", safeLimit)
                    .query(PlatformEvent.class).list();
        }
        return jdbc.sql(sql + " where event_type = :type order by occurred_at desc limit :limit")
                .param("type", type).param("limit", safeLimit).query(PlatformEvent.class).list();
    }

    private static long count7d(List<TypeCount> byType, String type) {
        return byType.stream().filter(t -> t.eventType().equals(type)).mapToLong(TypeCount::last7d).sum();
    }
}
