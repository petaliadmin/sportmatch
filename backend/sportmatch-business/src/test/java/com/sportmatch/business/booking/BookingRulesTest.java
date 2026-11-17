package com.sportmatch.business.booking;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BookingRulesTest {

    private final Clock clock = Clock.fixed(Instant.parse("2030-06-15T09:30:00Z"), ZoneOffset.UTC);
    private final Court court = new Court(UUID.randomUUID(), UUID.randomUUID(), "Arena", "Terrain A", "FOOTBALL", 30000, 8, 23);

    private static OffsetDateTime at(String iso) {
        return OffsetDateTime.parse(iso);
    }

    @Test
    void unCreneauFuturAlHeurePilePendantLOuvertureEstAccepte() {
        assertThatCode(() -> BookingRules.validateRequest(at("2030-06-15T18:00:00Z"), 2, court, clock)).doesNotThrowAnyException();
    }

    @Test
    void unCreneauPasseEstRefuse() {
        assertThatThrownBy(() -> BookingRules.validateRequest(at("2030-06-15T09:00:00Z"), 1, court, clock))
                .isInstanceOf(BookingConflict.class).hasMessageContaining("passé");
    }

    @Test
    void unCreneauQuiNeCommencePasAlHeurePileEstRefuse() {
        assertThatThrownBy(() -> BookingRules.validateRequest(at("2030-06-15T18:30:00Z"), 1, court, clock))
                .isInstanceOf(BookingConflict.class);
    }

    @Test
    void unCreneauQuiDepasseLaFermetureEstRefuse() {
        assertThatThrownBy(() -> BookingRules.validateRequest(at("2030-06-15T22:00:00Z"), 2, court, clock))
                .isInstanceOf(BookingConflict.class).hasMessageContaining("ouvert");
    }

    @Test
    void detectionDesChevauchements() {
        assertThat(BookingRules.overlaps(at("2030-06-15T18:00:00Z"), at("2030-06-15T20:00:00Z"),
                at("2030-06-15T19:00:00Z"), at("2030-06-15T21:00:00Z"))).isTrue();
        assertThat(BookingRules.overlaps(at("2030-06-15T18:00:00Z"), at("2030-06-15T19:00:00Z"),
                at("2030-06-15T19:00:00Z"), at("2030-06-15T20:00:00Z"))).isFalse();
    }

    @Test
    void lesCreneauxReservesOuPassesSontIndisponibles() {
        Booking existing = new Booking(UUID.randomUUID(), court.id(), "Terrain A", "Arena", "u1",
                at("2030-06-15T18:00:00Z"), at("2030-06-15T20:00:00Z"), 60000, "CONFIRMED", at("2030-06-01T00:00:00Z"));

        List<Slot> slots = BookingRules.dailySlots(LocalDate.parse("2030-06-15"), court, List.of(existing), clock);

        assertThat(slots).hasSize(15);
        assertThat(slots.get(0).available()).as("8 h, déjà passé").isFalse();
        assertThat(slots.get(2).available()).as("10 h").isTrue();
        assertThat(slots.get(10).available()).as("18 h réservé").isFalse();
        assertThat(slots.get(11).available()).as("19 h réservé").isFalse();
        assertThat(slots.get(12).available()).as("20 h libre").isTrue();
    }
}
