package com.sportmatch.events.tournament;

import com.sportmatch.events.tournament.Views.CreateTournament;
import com.sportmatch.events.tournament.Views.MatchResult;
import com.sportmatch.events.tournament.Views.RegisterTeam;
import com.sportmatch.events.tournament.Views.TournamentDetail;
import com.sportmatch.events.tournament.Views.TournamentSummary;
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

@RestController
@RequestMapping("/api/v1/events/tournaments")
public class TournamentController {

    private final TournamentService service;

    public TournamentController(TournamentService service) {
        this.service = service;
    }

    @GetMapping
    public List<TournamentSummary> list(@RequestParam(name = "status", required = false) String status) {
        return service.list(status);
    }

    @GetMapping("/{id}")
    public TournamentDetail detail(@PathVariable("id") UUID id) {
        return service.detail(id);
    }

    @PostMapping
    public ResponseEntity<TournamentDetail> create(@RequestHeader("X-User-Id") String userId,
                                                   @Valid @RequestBody CreateTournament request) {
        TournamentDetail created = service.create(userId, request);
        return ResponseEntity.created(URI.create("/api/v1/events/tournaments/" + created.tournament().id())).body(created);
    }

    @PostMapping("/{id}/teams")
    public TournamentDetail register(@RequestHeader("X-User-Id") String userId, @PathVariable("id") UUID id,
                                     @Valid @RequestBody RegisterTeam request) {
        return service.registerTeam(userId, id, request.name());
    }

    @PostMapping("/{id}/start")
    public TournamentDetail start(@RequestHeader("X-User-Id") String userId, @PathVariable("id") UUID id) {
        return service.start(userId, id);
    }

    @PostMapping("/{id}/matches/{matchId}/result")
    public TournamentDetail result(@RequestHeader("X-User-Id") String userId, @PathVariable("id") UUID id,
                                   @PathVariable("matchId") UUID matchId, @Valid @RequestBody MatchResult result) {
        return service.recordResult(userId, id, matchId, result);
    }
}
