package com.sportmatch.chat;

import com.sportmatch.commons.events.Topics;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class ChatConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler handler;
    private final MembershipHandshakeInterceptor interceptor;
    private final String[] allowedOrigins;

    public ChatConfig(ChatWebSocketHandler handler, MembershipHandshakeInterceptor interceptor,
                      @Value("${sportmatch.chat.allowed-origins:*}") String[] allowedOrigins) {
        this.handler = handler;
        this.interceptor = interceptor;
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/api/v1/chat/ws")
                .addInterceptors(interceptor)
                .setAllowedOriginPatterns(allowedOrigins);
    }

    @Bean
    RedisMessageListenerContainer chatListenerContainer(RedisConnectionFactory connectionFactory) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(handler, new PatternTopic(ChatChannels.PATTERN));
        return container;
    }

    @Bean
    NewTopic matchTopic(@Value("${sportmatch.kafka.partitions:3}") int partitions,
                        @Value("${sportmatch.kafka.replicas:1}") short replicas) {
        return TopicBuilder.name(Topics.MATCH_V1).partitions(partitions).replicas(replicas).build();
    }
}
