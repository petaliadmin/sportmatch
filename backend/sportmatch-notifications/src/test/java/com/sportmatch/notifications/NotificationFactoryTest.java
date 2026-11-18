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
    void unDepartPrevientLOrganisateurAvecLeNomDuJoueur() {
        var n = NotificationFactory.from(event("match.player-left",
                Map.of("organizerId", "awa", "playerId", "moussa", "playerName", "Moussa Diop", "participants", 3, "maxPlayers", 10)));
        assertThat(n).isPresent();
        assertThat(n.get().title()).isEqualTo("Une place s'est libérée");
        assertThat(n.get().body()).startsWith("Moussa Diop").contains("3/10");
    }

    @Test
    void uneSerieHebdomadaireNeNotifieQuUneFois() {
        var first = NotificationFactory.from(event("match.created", Map.of("organizerId", "awa", "occurrence", 0, "occurrences", 4)));
        var next = NotificationFactory.from(event("match.created", Map.of("organizerId", "awa", "occurrence", 1, "occurrences", 4)));
        assertThat(first).isPresent();
        assertThat(first.get().body()).contains("Série de 4 matchs");
        assertThat(next).isEmpty();
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

    @Test
    void unMatchAnnuleParLaModerationPrevientChaqueParticipantEtLOrganisateur() {
        var all = NotificationFactory.all(event("match.cancelled", Map.of(
                "organizerId", "awa", "cancelledBy", "admin", "byModeration", true,
                "participantIds", java.util.List.of("awa", "moussa", "ibou"))));

        assertThat(all).extracting(NewNotification::userId).containsExactly("awa", "moussa", "ibou");
        assertThat(all).allSatisfy(n -> assertThat(n.body()).contains("modération"));
    }
}
