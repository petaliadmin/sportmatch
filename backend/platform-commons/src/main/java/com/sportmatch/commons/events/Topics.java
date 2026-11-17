package com.sportmatch.commons.events;

/** Noms des topics Kafka : sportmatch.&lt;service&gt;.&lt;agrégat&gt;.v&lt;version&gt; */
public final class Topics {

    /** Événements du cycle de vie d'un match (création, inscription d'un joueur). */
    public static final String MATCH_V1 = "sportmatch.app.match.v1";

    /** Événements de réservation de créneaux (confirmée, annulée). */
    public static final String BOOKING_V1 = "sportmatch.business.booking.v1";

    /** Suffixe de la dead letter queue utilisé par DeadLetterPublishingRecoverer. */
    public static final String DLT_SUFFIX = ".DLT";

    private Topics() {
    }
}
