package com.sportmatch.notifications;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportmatch.commons.events.EventEnvelope;
import com.sportmatch.commons.events.Topics;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class MatchEventsListener {

    private final ObjectMapper mapper;
    private final NotificationStore store;

    public MatchEventsListener(ObjectMapper mapper, NotificationStore store) {
        this.mapper = mapper;
        this.store = store;
    }

    @KafkaListener(topics = Topics.MATCH_V1, groupId = "sportmatch-notifications")
    public void onMatchEvent(String message) throws JsonProcessingException {
        store.handle(mapper.readValue(message, EventEnvelope.class));
    }
}
