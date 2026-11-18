package com.sportmatch.app.match;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/** En-têtes d'identité posés par la gateway (le nom est encodé URL pour rester ASCII). */
public final class Identity {

    public static final String USER_HEADER = "X-User-Id";
    public static final String NAME_HEADER = "X-User-Name";
    public static final String ROLES_HEADER = "X-User-Roles";

    private Identity() {
    }

    public static String decode(String header) {
        return header == null || header.isBlank() ? null : URLDecoder.decode(header, StandardCharsets.UTF_8);
    }

    public static boolean hasRole(String roles, String role) {
        return roles != null && Arrays.asList(roles.split(",")).contains(role);
    }
}
