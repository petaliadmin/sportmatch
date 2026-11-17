package com.sportmatch.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.jackson.JacksonAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.JdbcClientAutoConfiguration;
import org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.util.backoff.FixedBackOff;

/**
 * Socle messaging commun à tous les microservices :
 * <ul>
 *   <li>{@link OutboxWriter} et {@link OutboxPublisher} (désactivable : sportmatch.outbox.enabled=false) ;</li>
 *   <li>gestion d'erreurs consommateur : 3 nouvelles tentatives à 1 s puis dead letter queue "&lt;topic&gt;.DLT".</li>
 * </ul>
 */
@AutoConfiguration(after = {JacksonAutoConfiguration.class, JdbcClientAutoConfiguration.class, KafkaAutoConfiguration.class})
@EnableScheduling
public class MessagingAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    OutboxWriter outboxWriter(JdbcClient jdbc, ObjectMapper mapper, @Value("${spring.application.name}") String source) {
        return new OutboxWriter(jdbc, mapper, source);
    }

    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(name = "sportmatch.outbox.enabled", havingValue = "true", matchIfMissing = true)
    OutboxPublisher outboxPublisher(JdbcClient jdbc, KafkaTemplate<String, String> kafka) {
        return new OutboxPublisher(jdbc, kafka);
    }

    @Bean
    @ConditionalOnMissingBean(CommonErrorHandler.class)
    DefaultErrorHandler kafkaErrorHandler(KafkaTemplate<String, String> kafka) {
        return new DefaultErrorHandler(new DeadLetterPublishingRecoverer(kafka), new FixedBackOff(1000L, 3L));
    }
}
