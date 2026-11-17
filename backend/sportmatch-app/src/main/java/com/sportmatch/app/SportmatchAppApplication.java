package com.sportmatch.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SportmatchAppApplication {

    public static void main(String[] args) {
        SpringApplication.run(SportmatchAppApplication.class, args);
    }
}
