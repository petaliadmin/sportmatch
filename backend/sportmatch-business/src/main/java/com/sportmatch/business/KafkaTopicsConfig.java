package com.sportmatch.business;

import com.sportmatch.commons.events.Topics;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicsConfig {

    @Bean
    NewTopic bookingTopic(@Value("${sportmatch.kafka.partitions:3}") int partitions,
                          @Value("${sportmatch.kafka.replicas:1}") short replicas) {
        return TopicBuilder.name(Topics.BOOKING_V1).partitions(partitions).replicas(replicas).build();
    }
}
