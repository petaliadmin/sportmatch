package com.sportmatch.app.player;

import com.sportmatch.app.match.MatchRules;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/** Profil joueur (préférences déclarées) et fiabilité calculée à partir des feuilles de présence. */
@Service
public class PlayerService {

    private final JdbcClient jdbc;

    public PlayerService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public PlayerProfile profile(String userId, String fallbackName) {
        Stored stored = jdbc.sql("""
                        select display_name, favorite_sport, level, district, bio
                        from player_profile where user_id = :id
                        """)
                .param("id", userId).query(Stored.class).optional()
                .orElse(new Stored(fallbackName == null || fallbackName.isBlank() ? lastKnownName(userId) : fallbackName,
                        null, null, null, null));
        return new PlayerProfile(userId, stored.displayName(), stored.favoriteSport(), stored.level(), stored.district(),
                stored.bio(), stats(userId));
    }

    public PlayerProfile update(String userId, UpdateProfile request) {
        jdbc.sql("""
                        insert into player_profile (user_id, display_name, favorite_sport, level, district, bio, updated_at)
                        values (:id, :name, :sport, :level, :district, :bio, now())
                        on conflict (user_id) do update set display_name = excluded.display_name,
                            favorite_sport = excluded.favorite_sport, level = excluded.level,
                            district = excluded.district, bio = excluded.bio, updated_at = now()
                        """)
                .param("id", userId)
                .param("name", request.displayName().trim())
                .param("sport", upper(request.favoriteSport()))
                .param("level", upper(request.level()))
                .param("district", blankToNull(request.district()))
                .param("bio", blankToNull(request.bio()))
                .update();
        // Le nom affiché suit le profil dans les matchs déjà rejoints.
        jdbc.sql("update match_participant set player_name = :name where player_id = :id")
                .param("name", request.displayName().trim()).param("id", userId).update();
        jdbc.sql("update sport_match set organizer_name = :name where organizer_id = :id")
                .param("name", request.displayName().trim()).param("id", userId).update();
        return profile(userId, null);
    }

    public PlayerStats stats(String userId) {
        RawStats raw = jdbc.sql("""
                        select count(*) filter (where m.status <> 'CANCELLED') as matches_joined,
                               count(*) filter (where m.status <> 'CANCELLED' and m.organizer_id = :id) as matches_organized,
                               count(*) filter (where p.attended is not null) as rated,
                               count(*) filter (where p.attended = false) as no_shows
                        from match_participant p join sport_match m on m.id = p.match_id
                        where p.player_id = :id
                        """)
                .param("id", userId).query(RawStats.class).single();
        return new PlayerStats(raw.matchesJoined(), raw.matchesOrganized(), raw.rated(), raw.noShows(),
                MatchRules.reliabilityPercent(raw.rated(), raw.noShows()));
    }

    private String lastKnownName(String userId) {
        return jdbc.sql("select player_name from match_participant where player_id = :id and player_name is not null order by joined_at desc limit 1")
                .param("id", userId).query(String.class).optional().orElse("Joueur");
    }

    private static String upper(String v) {
        return v == null || v.isBlank() ? null : v.toUpperCase();
    }

    private static String blankToNull(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }

    record Stored(String displayName, String favoriteSport, String level, String district, String bio) {
    }

    record RawStats(int matchesJoined, int matchesOrganized, int rated, int noShows) {
    }
}
