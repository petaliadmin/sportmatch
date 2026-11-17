package com.sportmatch.admin;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Service amorcé en phase 1 (socle technique) ; le métier arrive dans les phases suivantes du plan. */
@RestController
public class StatusController {

    private final String name;

    public StatusController(@Value("${spring.application.name}") String name) {
        this.name = name;
    }

    @GetMapping("/api/v1/admin/status")
    public Map<String, String> status() {
        return Map.of("service", name, "version", "1.0.0-SNAPSHOT", "phase", "socle");
    }
}
