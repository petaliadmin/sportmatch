/**
 * Configuration de la connexion à l'API réelle (bêta).
 * Sans NEXT_PUBLIC_API_URL, l'application reste un prototype 100 % statique (données fictives),
 * comme sur Vercel. Avec la variable, l'espace « Bêta live » parle à la gateway Spring Boot.
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
export const KEYCLOAK_URL = (process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? "http://localhost:8180").replace(/\/$/, "");
export const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? "sportmatch";
export const KEYCLOAK_CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? "sportmatch-web";

export const apiEnabled = API_URL.length > 0;

export const wsUrl = (path: string) => API_URL.replace(/^http/, "ws") + path;

/** Centre de Dakar (Plateau), utilisé si la géolocalisation est refusée. */
export const DAKAR_CENTER = { lat: 14.6928, lng: -17.4467 };
