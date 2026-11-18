package com.sportmatch.app.player;

public record PlayerProfile(String userId, String displayName, String favoriteSport, String level, String district,
                            String bio, PlayerStats stats) {
}
