package com.sportmatch.chat;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportmatch.commons.events.EventEnvelope;
import com.sportmatch.commons.events.Topics;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class MatchEventsListener {

    private final ObjectMapper mapper;
    private final ConversationStore store;

    public MatchEventsListener(ObjectMapper mapper, ConversationStore store) {
        this.mapper = mapper;
        this.store = store;
    }

    @KafkaListener(topics = Topics.MATCH_V1, groupId = "sportmatch-chat")
    public void onMatchEvent(String message) throws JsonProcessingException {
        store.onMatchEvent(mapper.readValue(message, EventEnvelope.class));
    }
}
