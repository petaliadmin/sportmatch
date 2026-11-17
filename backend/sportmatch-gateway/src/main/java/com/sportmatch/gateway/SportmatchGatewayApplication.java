package com.sportmatch.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class SportmatchGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(SportmatchGatewayApplication.class, args);
    }
}
