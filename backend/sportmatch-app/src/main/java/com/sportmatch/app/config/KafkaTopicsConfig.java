package com.sportmatch.app.config;

import com.sportmatch.commons.events.Topics;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/** Déclare les topics dont sportmatch-app est propriétaire (création idempotente au démarrage). */
@Configuration
public class KafkaTopicsConfig {

    @Bean
    NewTopic matchTopic(@Value("${sportmatch.kafka.partitions:3}") int partitions,
                        @Value("${sportmatch.kafka.replicas:1}") short replicas) {
        return TopicBuilder.name(Topics.MATCH_V1).partitions(partitions).replicas(replicas).build();
    }
}
