package com.sportmatch.admin;

import com.sportmatch.commons.events.Topics;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaAdmin;

/** Déclare les topics écoutés (création idempotente si le back-office démarre avant les services émetteurs). */
@Configuration
public class KafkaTopicsConfig {

    @Bean
    KafkaAdmin.NewTopics consumedTopics(@Value("${sportmatch.kafka.partitions:3}") int partitions,
                                        @Value("${sportmatch.kafka.replicas:1}") short replicas) {
        return new KafkaAdmin.NewTopics(
                TopicBuilder.name(Topics.MATCH_V1).partitions(partitions).replicas(replicas).build(),
                TopicBuilder.name(Topics.BOOKING_V1).partitions(partitions).replicas(replicas).build(),
                TopicBuilder.name(Topics.TOURNAMENT_V1).partitions(partitions).replicas(replicas).build());
    }
}
