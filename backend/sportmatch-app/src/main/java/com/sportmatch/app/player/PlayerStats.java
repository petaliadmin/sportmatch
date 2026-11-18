package com.sportmatch.app.player;

/** reliabilityPercent : null tant qu'aucun organisateur n'a renseigné de présence. */
public record PlayerStats(int matchesJoined, int matchesOrganized, int attendanceRated, int noShows, Integer reliabilityPercent) {
}
