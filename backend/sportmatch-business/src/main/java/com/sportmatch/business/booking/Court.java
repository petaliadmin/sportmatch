package com.sportmatch.business.booking;

import java.util.UUID;

/** Terrain réservable (un complexe = plusieurs terrains). venueId reprend l'identifiant du catalogue sportmatch-app. */
public record Court(UUID id, UUID venueId, String venueName, String name, String sport,
                    int pricePerHourFcfa, int openHour, int closeHour) {
}
