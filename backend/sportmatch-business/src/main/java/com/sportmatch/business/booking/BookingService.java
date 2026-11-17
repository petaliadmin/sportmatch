package com.sportmatch.business.booking;

import com.sportmatch.commons.events.Topics;
import com.sportmatch.messaging.OutboxWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class BookingService {

    private static final String COURT_SELECT =
            "select id, venue_id, venue_name, name, sport, price_per_hour_fcfa, open_hour, close_hour from court";
    private static final String BOOKING_SELECT = """
            select b.id, b.court_id, c.name as court_name, c.venue_name, b.user_id, b.starts_at, b.ends_at,
                   b.price_fcfa, b.status, b.created_at
            from booking b join court c on c.id = b.court_id
            """;

    private final JdbcClient jdbc;
    private final OutboxWriter outbox;
    private final Clock clock;

    @Autowired
    public BookingService(JdbcClient jdbc, OutboxWriter outbox) {
        this(jdbc, outbox, Clock.systemUTC());
    }

    BookingService(JdbcClient jdbc, OutboxWriter outbox, Clock clock) {
        this.jdbc = jdbc;
        this.outbox = outbox;
        this.clock = clock;
    }

    public List<Court> courts(UUID venueId) {
        if (venueId == null) {
            return jdbc.sql(COURT_SELECT + " order by venue_name, name").query(Court.class).list();
        }
        return jdbc.sql(COURT_SELECT + " where venue_id = :venueId order by name")
                .param("venueId", venueId).query(Court.class).list();
    }

    public Court court(UUID id) {
        return jdbc.sql(COURT_SELECT + " where id = :id").param("id", id).query(Court.class).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Terrain introuvable"));
    }

    public List<Slot> availability(UUID courtId, LocalDate day) {
        Court court = court(courtId);
        OffsetDateTime from = day.atStartOfDay(BookingRules.DAKAR).toOffsetDateTime();
        List<Booking> confirmed = jdbc.sql(BOOKING_SELECT + """
                         where b.court_id = :courtId and b.status = 'CONFIRMED'
                           and b.starts_at < :to and b.ends_at > :from
                        """)
                .param("courtId", courtId).param("from", from).param("to", from.plusDays(1))
                .query(Booking.class).list();
        return BookingRules.dailySlots(day, court, confirmed, clock);
    }

    @Transactional
    public Booking book(String userId, String userEmail, CreateBookingRequest request) {
        // Verrou sur le terrain : deux réservations simultanées du même terrain sont sérialisées.
        jdbc.sql("select id from court where id = :id for update").param("id", request.courtId())
                .query(UUID.class).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Terrain introuvable"));
        Court court = court(request.courtId());
        BookingRules.validateRequest(request.startsAt(), request.hours(), court, clock);

        OffsetDateTime start = request.startsAt();
        OffsetDateTime end = start.plusHours(request.hours());
        boolean taken = jdbc.sql("""
                        select exists(select 1 from booking where court_id = :courtId and status = 'CONFIRMED'
                                      and starts_at < :end and ends_at > :start)
                        """)
                .param("courtId", court.id()).param("start", start).param("end", end)
                .query(Boolean.class).single();
        if (taken) {
            throw BookingConflict.conflict("Ce créneau vient d'être réservé, choisis-en un autre");
        }

        UUID id = UUID.randomUUID();
        int price = court.pricePerHourFcfa() * request.hours();
        jdbc.sql("""
                        insert into booking (id, court_id, user_id, user_email, starts_at, ends_at, price_fcfa, status)
                        values (:id, :courtId, :userId, :email, :start, :end, :price, 'CONFIRMED')
                        """)
                .param("id", id).param("courtId", court.id()).param("userId", userId).param("email", userEmail)
                .param("start", start).param("end", end).param("price", price)
                .update();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("bookingId", id.toString());
        payload.put("userId", userId);
        payload.put("userEmail", userEmail);
        payload.put("courtName", court.name());
        payload.put("venueName", court.venueName());
        payload.put("startsAt", start.toString());
        payload.put("endsAt", end.toString());
        payload.put("priceFcfa", price);
        outbox.append(Topics.BOOKING_V1, "booking", id.toString(), "booking.confirmed", payload);
        return booking(id);
    }

    @Transactional
    public Booking cancel(String userId, UUID bookingId) {
        Booking booking = booking(bookingId);
        if (!booking.userId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cette réservation ne t'appartient pas");
        }
        if (!"CONFIRMED".equals(booking.status())) {
            throw BookingConflict.conflict("Cette réservation est déjà annulée");
        }
        if (booking.startsAt().isBefore(OffsetDateTime.now(clock))) {
            throw BookingConflict.conflict("Impossible d'annuler un créneau déjà commencé");
        }
        jdbc.sql("update booking set status = 'CANCELLED', cancelled_at = now() where id = :id")
                .param("id", bookingId).update();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("bookingId", bookingId.toString());
        payload.put("userId", userId);
        payload.put("courtName", booking.courtName());
        payload.put("venueName", booking.venueName());
        payload.put("startsAt", booking.startsAt().toString());
        outbox.append(Topics.BOOKING_V1, "booking", bookingId.toString(), "booking.cancelled", payload);
        return booking(bookingId);
    }

    public List<Booking> mine(String userId) {
        return jdbc.sql(BOOKING_SELECT + " where b.user_id = :userId order by b.starts_at desc limit 50")
                .param("userId", userId).query(Booking.class).list();
    }

    public Booking booking(UUID id) {
        return jdbc.sql(BOOKING_SELECT + " where b.id = :id").param("id", id).query(Booking.class).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Réservation introuvable"));
    }
}
