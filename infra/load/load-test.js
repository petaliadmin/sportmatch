// Test de charge k6 : navigation anonyme (catalogue, proximité PostGIS, matchs, tournois, créneaux)
// et utilisateurs connectés (création de match, notifications, réservations, conversations).
// Usage : k6 run infra/load/load-test.js   (variables : GATEWAY, KEYCLOAK, PROFILE=ci|staging)
import http from "k6/http";
import { check, group, sleep } from "k6";

const GATEWAY = __ENV.GATEWAY || "http://localhost:8080";
const KEYCLOAK = __ENV.KEYCLOAK || "http://localhost:8180";
const PROFILE = __ENV.PROFILE || "ci";

// ci : runner GitHub avec tout le système sur un seul nœud kind ; staging : objectifs de service réels.
const profiles = {
  ci: { browse: 15, members: 5, duration: "90s", p95: 1500, p99: 3000 },
  staging: { browse: 150, members: 50, duration: "10m", p95: 800, p99: 1500 },
};
const P = profiles[PROFILE];

export const options = {
  scenarios: {
    navigation: { executor: "constant-vus", vus: P.browse, duration: P.duration, exec: "browse" },
    membres: { executor: "constant-vus", vus: P.members, duration: P.duration, exec: "member", startTime: "5s" },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: [`p(95)<${P.p95}`, `p(99)<${P.p99}`],
    "http_req_duration{scenario:navigation}": [`p(95)<${P.p95}`],
    checks: ["rate>0.99"],
  },
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

const ACCOUNTS = ["awa.player", "moussa.player", "fatou.orga", "ibou.business"];

export function setup() {
  const tokens = {};
  for (const u of ACCOUNTS) {
    const r = http.post(`${KEYCLOAK}/realms/sportmatch/protocol/openid-connect/token`, {
      grant_type: "password", client_id: "sportmatch-web", username: u, password: "demo1234",
    });
    check(r, { "jeton obtenu": (x) => x.status === 200 });
    tokens[u] = r.json("access_token");
  }
  const courts = http.get(`${GATEWAY}/api/v1/business/courts`).json();
  return { tokens, courtIds: courts.map((c) => c.id) };
}

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const json = (t) => ({ headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } });

export function browse(data) {
  group("catalogue", () => {
    const lat = 14.69 + Math.random() * 0.07;
    const lng = -17.52 + Math.random() * 0.08;
    check(http.get(`${GATEWAY}/api/v1/venues/nearby?lat=${lat}&lng=${lng}&radiusKm=5`), { "proximité 200": (r) => r.status === 200 });
    check(http.get(`${GATEWAY}/api/v1/matches?status=OPEN`), { "matchs 200": (r) => r.status === 200 });
    check(http.get(`${GATEWAY}/api/v1/events/tournaments`), { "tournois 200": (r) => r.status === 200 });
    const day = new Date(Date.now() + 86400000 * (1 + Math.floor(Math.random() * 6))).toISOString().slice(0, 10);
    check(http.get(`${GATEWAY}/api/v1/business/courts/${pick(data.courtIds)}/availability?date=${day}`), { "créneaux 200": (r) => r.status === 200 });
  });
  sleep(1 + Math.random() * 2);
}

export function member(data) {
  const token = data.tokens[pick(ACCOUNTS)];
  group("membre", () => {
    const venues = http.get(`${GATEWAY}/api/v1/venues?sport=FOOTBALL`).json();
    const start = new Date(Date.now() + 86400000 * (30 + Math.floor(Math.random() * 300)));
    start.setUTCMinutes(0, 0, 0);
    const created = http.post(`${GATEWAY}/api/v1/matches`, JSON.stringify({
      venueId: pick(venues).id, sport: "FOOTBALL", startsAt: start.toISOString(), durationMinutes: 90, maxPlayers: 10, level: "INTERMEDIATE",
    }), json(token));
    check(created, { "match créé 201": (r) => r.status === 201 });
    check(http.get(`${GATEWAY}/api/v1/notifications`, json(token)), { "notifications 200": (r) => r.status === 200 });
    check(http.get(`${GATEWAY}/api/v1/business/bookings/mine`, json(token)), { "réservations 200": (r) => r.status === 200 });
    check(http.get(`${GATEWAY}/api/v1/chat/conversations`, json(token)), { "conversations 200": (r) => r.status === 200 });
  });
  sleep(2 + Math.random() * 3);
}
