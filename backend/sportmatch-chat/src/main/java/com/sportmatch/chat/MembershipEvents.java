package com.sportmatch.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.sportmatch.commons.events.EventEnvelope;

import java.util.LinkedHashSet;
import java.util.Set;

/** Déduit, d'un événement de match, quels joueurs doivent appartenir à la conversation du match. */
public final class MembershipEvents {

    private MembershipEvents() {
    }

    public static Set<String> membersFrom(EventEnvelope event) {
        JsonNode p = event.payload();
        Set<String> members = new LinkedHashSet<>();
        switch (event.eventType()) {
            case "match.created" -> add(members, p.path("organizerId"));
            case "match.player-joined" -> {
                add(members, p.path("organizerId"));
                add(members, p.path("playerId"));
            }
            default -> {
            }
        }
        return members;
    }

    private static void add(Set<String> members, JsonNode node) {
        String value = node.asText(null);
        if (value != null && !value.isBlank()) {
            members.add(value);
        }
    }
}
