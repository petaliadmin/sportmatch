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
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * API v1 de l'espace joueurs. L'identité arrive dans l'en-tête X-User-Id, posé par la gateway
 * à partir du jeton Keycloak (le service n'est jamais exposé directement en dehors du réseau interne).
 */
@RestController
@RequestMapping("/api/v1")
public class MatchController {

    static final String USER_HEADER = Identity.USER_HEADER;

    private final MatchService service;

    public MatchController(MatchService service) {
        this.service = service;
    }

    @GetMapping("/venues")
    public List<Venue> venues(@RequestParam(name = "sport", required = false) String sport) {
        return service.venues(sport);
    }

    @GetMapping("/venues/nearby")
    public List<Venue> nearby(@RequestParam("lat") double latitude,
                              @RequestParam("lng") double longitude,
                              @RequestParam(name = "radiusKm", defaultValue = "5") double radiusKm,
                              @RequestParam(name = "sport", required = false) String sport) {
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || radiusKm <= 0 || radiusKm > 50) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Coordonnées ou rayon invalides (rayon max 50 km)");
        }
        return service.nearby(latitude, longitude, radiusKm, sport);
    }

    @GetMapping("/venues/{id}")
    public Venue venue(@PathVariable("id") UUID id) {
        return service.venue(id);
    }

    @GetMapping("/matches")
    public List<MatchView> matches(@RequestParam(name = "status", defaultValue = "OPEN") String status,
                                   @RequestParam(name = "sport", required = false) String sport,
                                   @RequestParam(name = "level", required = false) String level,
                                   @RequestParam(name = "from", required = false) LocalDate from,
                                   @RequestParam(name = "to", required = false) LocalDate to) {
        return service.matches(new MatchFilter(status, sport, level, from, to));
    }

    /** Mes matchs (organisés ou rejoints). Déclaré avant /matches/{id} : la gateway exige un jeton sur ce chemin. */
    @GetMapping("/matches/mine")
    public List<MatchView> mine(@RequestHeader(USER_HEADER) String userId) {
        return service.mine(userId);
    }

    @GetMapping("/matches/{id}/participants")
    public List<MatchService.Participant> participants(@PathVariable("id") UUID id) {
        return service.participants(id);
    }

    @PostMapping("/matches/{id}/leave")
    public MatchView leave(@RequestHeader(USER_HEADER) String userId,
                           @RequestHeader(name = Identity.NAME_HEADER, required = false) String name,
                           @PathVariable("id") UUID id) {
        return service.leave(userId, Identity.decode(name), id);
    }

    @PostMapping("/matches/{id}/attendance")
    public List<MatchService.Participant> attendance(@RequestHeader(USER_HEADER) String userId,
                                                     @PathVariable("id") UUID id,
                                                     @Valid @RequestBody AttendanceRequest request) {
        return service.markAttendance(userId, id, request.playerId(), request.present());
    }

    @GetMapping("/matches/{id}")
    public MatchView match(@PathVariable("id") UUID id) {
        return service.match(id);
    }

    @PostMapping("/matches")
    public ResponseEntity<MatchView> create(@RequestHeader(USER_HEADER) String userId,
                                            @RequestHeader(name = Identity.NAME_HEADER, required = false) String name,
                                            @Valid @RequestBody CreateMatchRequest request) {
        MatchView created = service.create(userId, Identity.decode(name), request);
        return ResponseEntity.created(URI.create("/api/v1/matches/" + created.id())).body(created);
    }

    @PostMapping("/matches/{id}/cancel")
    public MatchView cancel(@RequestHeader(USER_HEADER) String userId,
                            @RequestHeader(name = "X-User-Roles", required = false) String roles,
                            @PathVariable("id") UUID id) {
        return service.cancel(userId, Identity.hasRole(roles, "admin"), id);
    }

    @PostMapping("/matches/{id}/join")
    public MatchView join(@RequestHeader(USER_HEADER) String userId,
                          @RequestHeader(name = Identity.NAME_HEADER, required = false) String name,
                          @PathVariable("id") UUID id) {
        return service.join(userId, Identity.decode(name), id);
    }
}
