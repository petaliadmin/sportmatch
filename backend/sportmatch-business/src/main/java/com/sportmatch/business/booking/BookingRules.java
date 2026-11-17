package com.sportmatch.business.booking;

import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Règles de réservation, pures et testées unitairement.
 * Les heures d'ouverture s'entendent à l'heure de Dakar (Africa/Dakar = UTC, sans heure d'été).
 */
public final class BookingRules {

    public static final ZoneId DAKAR = ZoneId.of("Africa/Dakar");

    private BookingRules() {
    }

    public static void validateRequest(OffsetDateTime startsAt, int hours, Court court, Clock clock) {
        if (startsAt.isBefore(OffsetDateTime.now(clock))) {
            throw BookingConflict.invalid("Le créneau est déjà passé");
        }
        OffsetDateTime local = startsAt.atZoneSameInstant(DAKAR).toOffsetDateTime();
        if (local.getMinute() != 0 || local.getSecond() != 0 || local.getNano() != 0) {
            throw BookingConflict.invalid("Les créneaux commencent à l'heure pile");
        }
        int start = local.getHour();
        if (start < court.openHour() || start + hours > court.closeHour()) {
            throw BookingConflict.invalid("Le terrain est ouvert de " + court.openHour() + " h à " + court.closeHour() + " h");
        }
    }

    public static boolean overlaps(OffsetDateTime aStart, OffsetDateTime aEnd, OffsetDateTime bStart, OffsetDateTime bEnd) {
        return aStart.isBefore(bEnd) && bStart.isBefore(aEnd);
    }

    /** Découpe une journée en créneaux d'une heure et marque ceux qui chevauchent une réservation existante. */
    public static List<Slot> dailySlots(LocalDate day, Court court, List<Booking> confirmed, Clock clock) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        List<Slot> slots = new ArrayList<>();
        for (int h = court.openHour(); h < court.closeHour(); h++) {
            OffsetDateTime start = day.atTime(h, 0).atZone(DAKAR).toOffsetDateTime();
            OffsetDateTime end = start.plus(1, ChronoUnit.HOURS);
            boolean taken = confirmed.stream().anyMatch(b -> overlaps(start, end, b.startsAt(), b.endsAt()));
            slots.add(new Slot(start, end, !taken && start.isAfter(now)));
        }
        return slots;
    }
}
