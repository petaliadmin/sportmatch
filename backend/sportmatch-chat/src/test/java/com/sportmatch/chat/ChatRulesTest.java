package com.sportmatch.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportmatch.commons.events.EventEnvelope;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ChatRulesTest {

    private final ObjectMapper mapper = new ObjectMapper();

    private EventEnvelope event(String type, Map<String, Object> payload) {
        return new EventEnvelope(UUID.randomUUID(), type, OffsetDateTime.now(), "sportmatch-app", "m", mapper.valueToTree(payload));
    }

    @Test
    void lOrganisateurEntreDansLaConversationALaCreationDuMatch() {
        assertThat(MembershipEvents.membersFrom(event("match.created", Map.of("matchId", "m", "organizerId", "awa"))))
                .containsExactly("awa");
    }

    @Test
    void unJoueurQuiRejointEntreDansLaConversation() {
        assertThat(MembershipEvents.membersFrom(event("match.player-joined",
                Map.of("matchId", "m", "organizerId", "awa", "playerId", "moussa"))))
                .containsExactlyInAnyOrder("awa", "moussa");
    }

    @Test
    void lesAutresEvenementsSontIgnores() {
        assertThat(MembershipEvents.membersFrom(event("match.archived", Map.of("organizerId", "awa")))).isEmpty();
    }

    @Test
    void canalRedisAllerRetour() {
        UUID id = UUID.randomUUID();
        assertThat(ChatChannels.conversationOf(ChatChannels.channelFor(id))).contains(id);
        assertThat(ChatChannels.conversationOf("autre:canal")).isEmpty();
        assertThat(ChatChannels.conversationOf("chat:conv:pas-un-uuid")).isEmpty();
    }
}
