package com.sportmatch.notifications;

import com.sportmatch.commons.events.Topics;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/** Topics consommés. Retries et DLQ : voir platform-messaging (MessagingAutoConfiguration). */
@Configuration
public class KafkaConfig {


    @Bean
    NewTopic matchTopic(@Value("${sportmatch.kafka.partitions:3}") int partitions,
                        @Value("${sportmatch.kafka.replicas:1}") short replicas) {
        return TopicBuilder.name(Topics.MATCH_V1).partitions(partitions).replicas(replicas).build();
    }

    @Bean
    NewTopic bookingTopic(@Value("${sportmatch.kafka.partitions:3}") int partitions,
                          @Value("${sportmatch.kafka.replicas:1}") short replicas) {
        return TopicBuilder.name(Topics.BOOKING_V1).partitions(partitions).replicas(replicas).build();
    }

    @Bean
    NewTopic tournamentTopic(@Value("${sportmatch.kafka.partitions:3}") int partitions,
                             @Value("${sportmatch.kafka.replicas:1}") short replicas) {
        return TopicBuilder.name(Topics.TOURNAMENT_V1).partitions(partitions).replicas(replicas).build();
    }

    @Bean
    NewTopic matchDeadLetterTopic(@Value("${sportmatch.kafka.partitions:3}") int partitions,
                                  @Value("${sportmatch.kafka.replicas:1}") short replicas) {
        return TopicBuilder.name(Topics.MATCH_V1 + Topics.DLT_SUFFIX).partitions(partitions).replicas(replicas).build();
    }
}
