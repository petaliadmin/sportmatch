package com.sportmatch.business.pro;

import com.sportmatch.business.booking.BookingConflict;
import com.sportmatch.business.booking.BookingRules;
import com.sportmatch.business.pro.ProViews.BlockSlot;
import com.sportmatch.business.pro.ProViews.CreateCourt;
import com.sportmatch.business.pro.ProViews.Dashboard;
import com.sportmatch.business.pro.ProViews.ProBooking;
import com.sportmatch.business.pro.ProViews.ProCourt;
import com.sportmatch.business.pro.ProViews.UpdateCourt;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

/** Espace prestataire : uniquement les terrains dont le prestataire connecté est propriétaire. */
@Service
public class ProService {

    private static final String PRO_COURT_SELECT = """
            select c.id, c.venue_id, c.venue_name, c.name, c.sport, c.price_per_hour_fcfa, c.open_hour, c.close_hour,
                   (select count(*) from booking b where b.court_id = c.id and b.status = 'CONFIRMED' and b.starts_at > now())
                       as upcoming_bookings
            from court c
            """;

    private final JdbcClient jdbc;

    public ProService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public List<ProCourt> courts(String owner) {
        return jdbc.sql(PRO_COURT_SELECT + " where c.owner_login = :owner order by c.venue_name, c.name")
                .param("owner", owner).query(ProCourt.class).list();
    }

    @Transactional
    public ProCourt create(String owner, CreateCourt r) {
        if (r.closeHour() <= r.openHour()) {
            throw BookingConflict.invalid("L'heure de fermeture doit suivre l'heure d'ouverture");
        }
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                        insert into court (id, venue_id, venue_name, name, sport, price_per_hour_fcfa, open_hour, close_hour, owner_login)
                        values (:id, :venueId, :venueName, :name, :sport, :price, :open, :close, :owner)
                        """)
                .param("id", id).param("venueId", r.venueId()).param("venueName", r.venueName().strip())
                .param("name", r.name().strip()).param("sport", r.sport().toUpperCase()).param("price", r.pricePerHourFcfa())
                .param("open", r.openHour()).param("close", r.closeHour()).param("owner", owner)
                .update();
        return court(owner, id);
    }

    @Transactional
    public ProCourt update(String owner, UUID id, UpdateCourt r) {
        ProCourt current = court(owner, id);
        int open = r.openHour() == null ? current.openHour() : r.openHour();
        int close = r.closeHour() == null ? current.closeHour() : r.closeHour();
        if (close <= open) {
            throw BookingConflict.invalid("L'heure de fermeture doit suivre l'heure d'ouverture");
        }
        jdbc.sql("update court set price_per_hour_fcfa = :price, open_hour = :open, close_hour = :close where id = :id")
                .param("price", r.pricePerHourFcfa() == null ? current.pricePerHourFcfa() : r.pricePerHourFcfa())
                .param("open", open).param("close", close).param("id", id)
                .update();
        return court(owner, id);
    }

    public List<ProBooking> bookings(String owner, LocalDate from, LocalDate to) {
        return jdbc.sql("""
                        select b.id, b.court_id, c.name as court_name, c.venue_name, b.user_email as customer_email,
                               b.starts_at, b.ends_at, b.price_fcfa, b.status
                        from booking b join court c on c.id = b.court_id
                        where c.owner_login = :owner and b.starts_at >= :from and b.starts_at < :to
                        order by b.starts_at
                        """)
                .param("owner", owner)
                .param("from", from.atStartOfDay().atOffset(ZoneOffset.UTC))
                .param("to", to.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC))
                .query(ProBooking.class).list();
    }

    /** Bloque un créneau (entretien, événement privé…) : il disparaît des disponibilités publiques. */
    @Transactional
    public ProBooking block(String owner, String ownerId, UUID courtId, BlockSlot r) {
        ProCourt c = court(owner, courtId);
        jdbc.sql("select id from court where id = :id for update").param("id", courtId).query(UUID.class).single();
        OffsetDateTime start = r.startsAt();
        OffsetDateTime end = start.plusHours(r.hours());
        boolean taken = jdbc.sql("""
                        select exists(select 1 from booking where court_id = :c and status in ('CONFIRMED', 'BLOCKED')
                                      and starts_at < :end and ends_at > :start)
                        """)
                .param("c", courtId).param("start", start).param("end", end).query(Boolean.class).single();
        if (taken) {
            throw BookingConflict.conflict("Ce créneau est déjà réservé ou bloqué");
        }
        if (start.atZoneSameInstant(BookingRules.DAKAR).getMinute() != 0) {
            throw BookingConflict.invalid("Les créneaux commencent à l'heure pile");
        }
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                        insert into booking (id, court_id, user_id, starts_at, ends_at, price_fcfa, status)
                        values (:id, :c, :user, :start, :end, 0, 'BLOCKED')
                        """)
                .param("id", id).param("c", c.id()).param("user", ownerId).param("start", start).param("end", end).update();
        return booking(owner, id);
    }

    @Transactional
    public void release(String owner, UUID bookingId) {
        ProBooking b = booking(owner, bookingId);
        if (!"BLOCKED".equals(b.status())) {
            throw BookingConflict.conflict("Seuls les créneaux bloqués peuvent être libérés ici");
        }
        jdbc.sql("delete from booking where id = :id").param("id", bookingId).update();
    }

    public Dashboard dashboard(String owner) {
        return jdbc.sql("""
                        with mine as (select id, open_hour, close_hour from court where owner_login = :owner),
                        b as (select b.* from booking b join mine m on m.id = b.court_id)
                        select
                          (select count(*) from mine) as courts,
                          (select count(*) from b where status = 'CONFIRMED' and starts_at between now() and now() + interval '7 days') as bookings_next7_days,
                          (select coalesce(sum(price_fcfa), 0) from b where status = 'CONFIRMED' and starts_at between now() and now() + interval '7 days') as revenue_next7_days_fcfa,
                          (select coalesce(sum(price_fcfa), 0) from b where status = 'CONFIRMED' and starts_at between now() - interval '30 days' and now()) as revenue_last30_days_fcfa,
                          (select case when coalesce(sum(close_hour - open_hour), 0) = 0 then 0
                                  else round(100.0 * (select coalesce(sum(extract(epoch from (ends_at - starts_at)) / 3600), 0) from b
                                                      where status = 'CONFIRMED' and starts_at::date = current_date)
                                             / sum(close_hour - open_hour)) end
                           from mine)::int as occupancy_today_percent,
                          (select count(*) from b where status = 'BLOCKED' and starts_at between now() and now() + interval '7 days') as blocked_slots_next7_days
                        """)
                .param("owner", owner).query(Dashboard.class).single();
    }

    private ProCourt court(String owner, UUID id) {
        return jdbc.sql(PRO_COURT_SELECT + " where c.id = :id and c.owner_login = :owner")
                .param("id", id).param("owner", owner).query(ProCourt.class).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Terrain introuvable dans ton espace"));
    }

    private ProBooking booking(String owner, UUID id) {
        return jdbc.sql("""
                        select b.id, b.court_id, c.name as court_name, c.venue_name, b.user_email as customer_email,
                               b.starts_at, b.ends_at, b.price_fcfa, b.status
                        from booking b join court c on c.id = b.court_id
                        where b.id = :id and c.owner_login = :owner
                        """)
                .param("id", id).param("owner", owner).query(ProBooking.class).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Réservation introuvable dans ton espace"));
    }
}
