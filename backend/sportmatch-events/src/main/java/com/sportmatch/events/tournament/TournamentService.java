package com.sportmatch.events.tournament;

import com.sportmatch.commons.events.Topics;
import com.sportmatch.events.tournament.Views.BracketMatch;
import com.sportmatch.events.tournament.Views.CreateTournament;
import com.sportmatch.events.tournament.Views.MatchResult;
import com.sportmatch.events.tournament.Views.Team;
import com.sportmatch.events.tournament.Views.TournamentDetail;
import com.sportmatch.events.tournament.Views.TournamentSummary;
import com.sportmatch.messaging.OutboxWriter;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TournamentService {

    private static final String SUMMARY_SELECT = """
            select t.id, t.name, t.sport, t.starts_on, t.max_teams, t.status, t.organizer_id,
                   (select count(*) from team tm where tm.tournament_id = t.id) as teams,
                   (select name from team c where c.id = t.champion_team_id) as champion_name
            from tournament t
            """;

    private final JdbcClient jdbc;
    private final OutboxWriter outbox;

    public TournamentService(JdbcClient jdbc, OutboxWriter outbox) {
        this.jdbc = jdbc;
        this.outbox = outbox;
    }

    public List<TournamentSummary> list(String status) {
        if (status == null || status.isBlank()) {
            return jdbc.sql(SUMMARY_SELECT + " order by t.starts_on").query(TournamentSummary.class).list();
        }
        return jdbc.sql(SUMMARY_SELECT + " where t.status = :status order by t.starts_on")
                .param("status", status.toUpperCase()).query(TournamentSummary.class).list();
    }

    public TournamentDetail detail(UUID id) {
        TournamentSummary summary = summary(id);
        List<Team> teams = jdbc.sql("select id, name, captain_id, registered_at from team where tournament_id = :id order by registered_at")
                .param("id", id).query(Team.class).list();
        List<BracketMatch> bracket = jdbc.sql("""
                        select m.id, m.round, m.position, m.home_team_id, h.name as home_team, m.away_team_id, a.name as away_team,
                               m.home_score, m.away_score, m.winner_team_id, m.status, m.bye
                        from bracket_match m
                        left join team h on h.id = m.home_team_id
                        left join team a on a.id = m.away_team_id
                        where m.tournament_id = :id order by m.round, m.position
                        """)
                .param("id", id).query(BracketMatch.class).list();
        return new TournamentDetail(summary, teams, bracket);
    }

    @Transactional
    public TournamentDetail create(String organizerId, CreateTournament request) {
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                        insert into tournament (id, organizer_id, name, sport, starts_on, max_teams, status)
                        values (:id, :organizer, :name, :sport, :startsOn, :maxTeams, 'REGISTRATION')
                        """)
                .param("id", id).param("organizer", organizerId).param("name", request.name().strip())
                .param("sport", request.sport().toUpperCase()).param("startsOn", request.startsOn())
                .param("maxTeams", request.maxTeams())
                .update();
        publish(id, "tournament.created", Map.of("tournamentId", id.toString(), "organizerId", organizerId,
                "name", request.name().strip(), "startsOn", request.startsOn().toString()));
        return detail(id);
    }

    @Transactional
    public TournamentDetail registerTeam(String captainId, UUID tournamentId, String teamName) {
        TournamentSummary t = lock(tournamentId);
        if (!"REGISTRATION".equals(t.status())) {
            throw TournamentRuleViolation.conflict("Les inscriptions sont closes");
        }
        if (t.teams() >= t.maxTeams()) {
            throw TournamentRuleViolation.conflict("Le tournoi est complet");
        }
        UUID teamId = UUID.randomUUID();
        try {
            jdbc.sql("insert into team (id, tournament_id, name, captain_id) values (:id, :t, :name, :captain)")
                    .param("id", teamId).param("t", tournamentId).param("name", teamName.strip()).param("captain", captainId)
                    .update();
        } catch (DuplicateKeyException e) {
            throw TournamentRuleViolation.conflict("Ce nom d'équipe est déjà pris, ou tu as déjà inscrit une équipe");
        }
        publish(tournamentId, "tournament.team-registered", Map.of("tournamentId", tournamentId.toString(),
                "tournamentName", t.name(), "teamId", teamId.toString(), "teamName", teamName.strip(),
                "captainId", captainId, "organizerId", t.organizerId()));
        return detail(tournamentId);
    }

    @Transactional
    public TournamentDetail start(String userId, UUID tournamentId) {
        TournamentSummary t = lock(tournamentId);
        requireOrganizer(t, userId);
        if (!"REGISTRATION".equals(t.status())) {
            throw TournamentRuleViolation.conflict("Le tournoi a déjà commencé");
        }
        List<UUID> teams = jdbc.sql("select id from team where tournament_id = :t order by registered_at, id")
                .param("t", tournamentId).query(UUID.class).list();
        if (teams.size() < 2) {
            throw TournamentRuleViolation.conflict("Il faut au moins 2 équipes pour lancer le tournoi");
        }
        Bracket bracket = Bracket.plan(teams);
        for (Bracket.Slot s : bracket.all()) {
            jdbc.sql("""
                            insert into bracket_match (id, tournament_id, round, position, home_team_id, away_team_id, winner_team_id, status, bye)
                            values (:id, :t, :round, :position, :home, :away, :winner, :status, :bye)
                            """)
                    .param("id", UUID.randomUUID()).param("t", tournamentId).param("round", s.round).param("position", s.position)
                    .param("home", s.home).param("away", s.away).param("winner", s.winner).param("status", s.status).param("bye", s.bye)
                    .update();
        }
        jdbc.sql("update tournament set status = 'IN_PROGRESS', rounds = :rounds where id = :id")
                .param("rounds", bracket.roundCount()).param("id", tournamentId).update();
        publish(tournamentId, "tournament.started", Map.of("tournamentId", tournamentId.toString(),
                "name", t.name(), "organizerId", t.organizerId(), "teams", teams.size()));
        return detail(tournamentId);
    }

    @Transactional
    public TournamentDetail recordResult(String userId, UUID tournamentId, UUID matchId, MatchResult result) {
        TournamentSummary t = lock(tournamentId);
        requireOrganizer(t, userId);
        BracketMatch m = detail(tournamentId).bracket().stream().filter(b -> b.id().equals(matchId)).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match introuvable"));
        if (!Bracket.READY.equals(m.status())) {
            throw TournamentRuleViolation.conflict("Ce match n'est pas prêt à être joué ou a déjà un résultat");
        }
        if (result.homeScore().equals(result.awayScore())) {
            throw TournamentRuleViolation.conflict("Pas de match nul en élimination directe : départage les équipes");
        }
        UUID winner = result.homeScore() > result.awayScore() ? m.homeTeamId() : m.awayTeamId();
        jdbc.sql("update bracket_match set home_score = :h, away_score = :a, winner_team_id = :w, status = 'PLAYED' where id = :id")
                .param("h", result.homeScore()).param("a", result.awayScore()).param("w", winner).param("id", matchId).update();

        int rounds = jdbc.sql("select rounds from tournament where id = :id").param("id", tournamentId).query(Integer.class).single();
        if (m.round() == rounds) {
            jdbc.sql("update tournament set status = 'COMPLETED', champion_team_id = :w where id = :id")
                    .param("w", winner).param("id", tournamentId).update();
            String championName = jdbc.sql("select name from team where id = :id").param("id", winner).query(String.class).single();
            publish(tournamentId, "tournament.completed", Map.of("tournamentId", tournamentId.toString(),
                    "name", t.name(), "organizerId", t.organizerId(), "championTeamId", winner.toString(),
                    "championName", championName));
        } else {
            String column = m.position() % 2 == 0 ? "home_team_id" : "away_team_id";
            jdbc.sql("update bracket_match set " + column + " = :w where tournament_id = :t and round = :r and position = :p")
                    .param("w", winner).param("t", tournamentId).param("r", m.round() + 1).param("p", m.position() / 2).update();
            jdbc.sql("""
                            update bracket_match set status = 'READY'
                            where tournament_id = :t and round = :r and position = :p
                              and status = 'PENDING' and home_team_id is not null and away_team_id is not null
                            """)
                    .param("t", tournamentId).param("r", m.round() + 1).param("p", m.position() / 2).update();
        }
        return detail(tournamentId);
    }

    private TournamentSummary summary(UUID id) {
        return jdbc.sql(SUMMARY_SELECT + " where t.id = :id").param("id", id).query(TournamentSummary.class).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournoi introuvable"));
    }

    private TournamentSummary lock(UUID id) {
        jdbc.sql("select id from tournament where id = :id for update").param("id", id).query(UUID.class).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournoi introuvable"));
        return summary(id);
    }

    private static void requireOrganizer(TournamentSummary t, String userId) {
        if (!t.organizerId().equals(userId)) {
            throw TournamentRuleViolation.forbidden("Seul l'organisateur peut faire cette action");
        }
    }

    private void publish(UUID tournamentId, String type, Map<String, Object> payload) {
        outbox.append(Topics.TOURNAMENT_V1, "tournament", tournamentId.toString(), type, new LinkedHashMap<>(payload));
    }
}
