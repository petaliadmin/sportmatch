package com.sportmatch.notifications;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportmatch.commons.events.EventEnvelope;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationFactoryTest {

    private final ObjectMapper mapper = new ObjectMapper();

    private EventEnvelope event(String type, Map<String, Object> payload) {
        return new EventEnvelope(UUID.randomUUID(), type, OffsetDateTime.now(), "sportmatch-app", "m-1", mapper.valueToTree(payload));
    }

    @Test
    void lOrganisateurEstPrevenuQuandUnJoueurRejoint() {
        var notification = NotificationFactory.from(event("match.player-joined",
                Map.of("organizerId", "awa", "playerId", "moussa", "participants", 4, "maxPlayers", 10)));

        assertThat(notification).isPresent();
        assertThat(notification.get().userId()).isEqualTo("awa");
        assertThat(notification.get().body()).contains("a rejoint").contains("4/10");
    }

    @Test
    void unEvenementInconnuNeProduitPasDeNotification() {
        assertThat(NotificationFactory.from(event("match.archived", Map.of("organizerId", "awa")))).isEmpty();
    }

    @Test
    void unEvenementSansOrganisateurEstIgnore() {
        assertThat(NotificationFactory.from(event("match.created", Map.of()))).isEmpty();
    }

    @Test
    void uneReservationConfirmeePrevientLeJoueurAvecLaDateEnHeureDeDakar() {
        var notification = NotificationFactory.from(event("booking.confirmed", Map.of(
                "userId", "awa", "courtName", "Terrain A", "venueName", "Arena Almadies Five",
                "startsAt", "2030-06-15T18:00:00Z", "userEmail", "awa@demo.sportmatch.test")));

        assertThat(notification).isPresent();
        assertThat(notification.get().userId()).isEqualTo("awa");
        assertThat(notification.get().title()).isEqualTo("Réservation confirmée");
        assertThat(notification.get().body()).contains("Terrain A", "samedi 15 juin à 18h00", "aucun paiement");
    }
}
