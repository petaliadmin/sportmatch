package com.sportmatch.notifications;

import com.sportmatch.commons.events.Topics;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

/**
 * Tolérance aux pannes côté consommateur : 3 nouvelles tentatives espacées d'une seconde,
 * puis envoi du message dans la dead letter queue "&lt;topic&gt;.DLT" pour analyse et rejeu.
 */
@Configuration
public class KafkaConfig {

    @Bean
    DefaultErrorHandler kafkaErrorHandler(KafkaTemplate<String, String> template) {
        return new DefaultErrorHandler(new DeadLetterPublishingRecoverer(template), new FixedBackOff(1000L, 3L));
    }

    @Bean
    NewTopic matchTopic(@Value("${sportmatch.kafka.partitions:3}") int partitions,
                        @Value("${sportmatch.kafka.replicas:1}") short replicas) {
        return TopicBuilder.name(Topics.MATCH_V1).partitions(partitions).replicas(replicas).build();
    }

    @Bean
    NewTopic matchDeadLetterTopic(@Value("${sportmatch.kafka.partitions:3}") int partitions,
                                  @Value("${sportmatch.kafka.replicas:1}") short replicas) {
        return TopicBuilder.name(Topics.MATCH_V1 + Topics.DLT_SUFFIX).partitions(partitions).replicas(replicas).build();
    }
}
