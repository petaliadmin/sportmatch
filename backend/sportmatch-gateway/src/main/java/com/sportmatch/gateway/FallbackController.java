package com.sportmatch.gateway;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Réponse renvoyée quand un service est indisponible ou que son circuit breaker est ouvert. */
@RestController
public class FallbackController {

    @RequestMapping("/fallback/{service}")
    public ResponseEntity<ProblemDetail> fallback(@PathVariable("service") String service) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE,
                "Le service " + service + " est momentanément indisponible. Réessaie dans quelques secondes.");
        problem.setTitle("Service indisponible");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(problem);
    }
}
