package com.sportmatch.app.match;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.UUID;

/**
 * API v1 de l'espace joueurs. L'identité arrive dans l'en-tête X-User-Id, posé par la gateway
 * à partir du jeton Keycloak (le service n'est jamais exposé directement en dehors du réseau interne).
 */
@RestController
@RequestMapping("/api/v1")
public class MatchController {

    static final String USER_HEADER = "X-User-Id";

    private final MatchService service;

    public MatchController(MatchService service) {
        this.service = service;
    }

    @GetMapping("/venues")
    public List<Venue> venues(@RequestParam(name = "sport", required = false) String sport) {
        return service.venues(sport);
    }

    @GetMapping("/venues/{id}")
    public Venue venue(@PathVariable("id") UUID id) {
        return service.venue(id);
    }

    @GetMapping("/matches")
    public List<MatchView> matches(@RequestParam(name = "status", defaultValue = "OPEN") String status) {
        return service.matches(status);
    }

    @GetMapping("/matches/{id}")
    public MatchView match(@PathVariable("id") UUID id) {
        return service.match(id);
    }

    @PostMapping("/matches")
    public ResponseEntity<MatchView> create(@RequestHeader(USER_HEADER) String userId,
                                            @Valid @RequestBody CreateMatchRequest request) {
        MatchView created = service.create(userId, request);
        return ResponseEntity.created(URI.create("/api/v1/matches/" + created.id())).body(created);
    }

    @PostMapping("/matches/{id}/join")
    public MatchView join(@RequestHeader(USER_HEADER) String userId, @PathVariable("id") UUID id) {
        return service.join(userId, id);
    }
}
