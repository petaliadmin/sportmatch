package com.sportmatch.events.tournament;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/** Représentations exposées par l'API tournois. */
public final class Views {

    private Views() {
    }

    public record TournamentSummary(UUID id, String name, String sport, LocalDate startsOn, int maxTeams,
                                    String status, String organizerId, int teams, String championName) {
    }

    public record Team(UUID id, String name, String captainId, OffsetDateTime registeredAt) {
    }

    public record BracketMatch(UUID id, int round, int position, UUID homeTeamId, String homeTeam,
                               UUID awayTeamId, String awayTeam, Integer homeScore, Integer awayScore,
                               UUID winnerTeamId, String status, boolean bye) {
    }

    public record TournamentDetail(TournamentSummary tournament, List<Team> teams, List<BracketMatch> bracket) {
    }

    public record CreateTournament(@NotBlank @Size(max = 120) String name,
                                   @NotBlank String sport,
                                   @NotNull @Future LocalDate startsOn,
                                   @Min(2) @Max(32) int maxTeams) {
    }

    public record RegisterTeam(@NotBlank @Size(max = 60) String name) {
    }

    public record MatchResult(@NotNull @PositiveOrZero Integer homeScore, @NotNull @PositiveOrZero Integer awayScore) {
    }
}
