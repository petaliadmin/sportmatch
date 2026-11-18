import { API_URL } from "./config";

/** Client typé de l'API SportMatch (gateway). Les types reflètent contracts/openapi. */

export interface ApiVenue {
  id: string; name: string; district: string; sport: string; pricePerHourFcfa: number;
  rating: number | null; latitude: number | null; longitude: number | null; distanceKm: number | null;
}
export interface ApiMatch {
  id: string; venueId: string; venueName: string; sport: string; startsAt: string; durationMinutes: number;
  maxPlayers: number; level: string; organizerId: string; organizerName: string | null;
  status: "OPEN" | "FULL" | "CANCELLED"; participants: number; seriesId: string | null;
}
export interface ApiParticipant { playerId: string; displayName: string; joinedAt: string; attended: boolean | null }
export interface PlayerStats { matchesJoined: number; matchesOrganized: number; attendanceRated: number; noShows: number; reliabilityPercent: number | null }
export interface PlayerProfile {
  userId: string; displayName: string; favoriteSport: string | null; level: string | null; district: string | null; bio: string | null; stats: PlayerStats;
}
export interface MatchFilter { status?: "OPEN" | "FULL"; sport?: string; level?: string; from?: string; to?: string }
export interface ApiCourt {
  id: string; venueId: string; venueName: string; name: string; sport: string;
  pricePerHourFcfa: number; openHour: number; closeHour: number;
}
export interface ApiSlot { startsAt: string; endsAt: string; available: boolean }
export interface ApiBooking {
  id: string; courtId: string; courtName: string; venueName: string; userId: string;
  startsAt: string; endsAt: string; priceFcfa: number; status: "CONFIRMED" | "CANCELLED"; createdAt: string;
}
export interface ApiNotification { id: string; userId: string; title: string; body: string; createdAt: string; readAt: string | null }
export interface ApiConversation { id: string; matchId: string; members: number; lastMessage: string | null; lastMessageAt: string | null }
export interface ApiChatMessage { id: string; conversationId: string; senderId: string; senderName: string | null; body: string; sentAt: string }
export interface ApiTournamentSummary {
  id: string; name: string; sport: string; startsOn: string; maxTeams: number;
  status: "REGISTRATION" | "IN_PROGRESS" | "COMPLETED"; organizerId: string; teams: number; championName: string | null;
}
export interface ApiTeam { id: string; name: string; captainId: string; registeredAt: string }
export interface ApiBracketMatch {
  id: string; round: number; position: number; homeTeamId: string | null; homeTeam: string | null;
  awayTeamId: string | null; awayTeam: string | null; homeScore: number | null; awayScore: number | null;
  winnerTeamId: string | null; status: "PENDING" | "READY" | "PLAYED"; bye: boolean;
}
export interface ApiTournamentDetail { tournament: ApiTournamentSummary; teams: ApiTeam[]; bracket: ApiBracketMatch[] }

export interface ProCourt {
  id: string; venueId: string; venueName: string; name: string; sport: string;
  pricePerHourFcfa: number; openHour: number; closeHour: number; upcomingBookings: number;
}
export interface ProBooking {
  id: string; courtId: string; courtName: string; venueName: string; customerEmail: string | null;
  startsAt: string; endsAt: string; priceFcfa: number; status: "CONFIRMED" | "CANCELLED" | "BLOCKED";
}
export interface ProDashboard {
  courts: number; bookingsNext7Days: number; revenueNext7DaysFcfa: number; revenueLast30DaysFcfa: number;
  occupancyTodayPercent: number; blockedSlotsNext7Days: number;
}
export interface AdminOverview {
  totalEvents: number;
  byType: { eventType: string; last24h: number; last7d: number }[];
  last7Days: { day: string; count: number }[];
  kpis: Record<string, number>;
}
export interface PlatformEvent { eventId: string; eventType: string; source: string; aggregateId: string; occurredAt: string; payload: string }

/** Erreur RFC 9457 renvoyée par les services (message lisible dans `detail`). */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type TokenFn = () => Promise<string | null>;

async function call<T>(token: TokenFn, method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const t = await token();
  if (t) headers.Authorization = `Bearer ${t}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(API_URL + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, "Serveur injoignable. L'environnement local est-il démarré ?");
  }
  if (!res.ok) {
    let message = res.status === 401 ? "Connecte-toi pour continuer." : `Erreur ${res.status}`;
    try {
      const p = await res.json();
      message = p.detail ?? p.title ?? message;
    } catch {}
    throw new ApiError(res.status, message);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export function api(token: TokenFn) {
  const get = <T,>(p: string) => call<T>(token, "GET", p);
  const post = <T,>(p: string, b: unknown = {}) => call<T>(token, "POST", p, b);
  return {
    venues: (sport?: string) => get<ApiVenue[]>(`/api/v1/venues${sport ? `?sport=${sport}` : ""}`),
    nearby: (lat: number, lng: number, radiusKm: number, sport?: string) =>
      get<ApiVenue[]>(`/api/v1/venues/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}${sport ? `&sport=${sport}` : ""}`),
    matches: (f: MatchFilter = {}) => {
      const q = new URLSearchParams({ status: f.status ?? "OPEN" });
      (["sport", "level", "from", "to"] as const).forEach((k) => { if (f[k]) q.set(k, f[k]!); });
      return get<ApiMatch[]>(`/api/v1/matches?${q}`);
    },
    match: (id: string) => get<ApiMatch>(`/api/v1/matches/${id}`),
    myMatches: () => get<ApiMatch[]>("/api/v1/matches/mine"),
    participants: (id: string) => get<ApiParticipant[]>(`/api/v1/matches/${id}/participants`),
    createMatch: (b: { venueId: string; sport: string; startsAt: string; durationMinutes: number; maxPlayers: number; level: string; repeatWeeks?: number }) =>
      post<ApiMatch>("/api/v1/matches", b),
    leaveMatch: (id: string) => post<ApiMatch>(`/api/v1/matches/${id}/leave`),
    markAttendance: (id: string, playerId: string, present: boolean) =>
      post<ApiParticipant[]>(`/api/v1/matches/${id}/attendance`, { playerId, present }),
    myProfile: () => get<PlayerProfile>("/api/v1/me/profile"),
    updateProfile: (b: { displayName: string; favoriteSport?: string; level?: string; district?: string; bio?: string }) =>
      call<PlayerProfile>(token, "PUT", "/api/v1/me/profile", b),
    player: (id: string) => get<PlayerProfile>(`/api/v1/players/${encodeURIComponent(id)}`),
    unreadCount: () => get<{ unread: number }>("/api/v1/notifications/unread-count"),
    markRead: (id: string) => post<{ unread: number }>(`/api/v1/notifications/${id}/read`),
    markAllRead: () => post<{ unread: number }>("/api/v1/notifications/read-all"),
    joinMatch: (id: string) => post<ApiMatch>(`/api/v1/matches/${id}/join`),
    cancelMatch: (id: string) => post<ApiMatch>(`/api/v1/matches/${id}/cancel`),
    proCourts: () => get<ProCourt[]>("/api/v1/business/pro/courts"),
    proUpdateCourt: (id: string, b: Partial<Pick<ProCourt, "pricePerHourFcfa" | "openHour" | "closeHour">>) =>
      call<ProCourt>(token, "PATCH", `/api/v1/business/pro/courts/${id}`, b),
    proBookings: (from: string, to: string) => get<ProBooking[]>(`/api/v1/business/pro/bookings?from=${from}&to=${to}`),
    proBlock: (courtId: string, startsAt: string, hours: number) =>
      post<ProBooking>(`/api/v1/business/pro/courts/${courtId}/blocks`, { startsAt, hours }),
    proRelease: (id: string) => call<void>(token, "DELETE", `/api/v1/business/pro/blocks/${id}`),
    proDashboard: () => get<ProDashboard>("/api/v1/business/pro/dashboard"),
    adminOverview: () => get<AdminOverview>("/api/v1/admin/overview"),
    adminEvents: (type?: string) => get<PlatformEvent[]>(`/api/v1/admin/events?limit=100${type ? `&type=${type}` : ""}`),
    courts: (venueId?: string) => get<ApiCourt[]>(`/api/v1/business/courts${venueId ? `?venueId=${venueId}` : ""}`),
    availability: (courtId: string, date: string) => get<ApiSlot[]>(`/api/v1/business/courts/${courtId}/availability?date=${date}`),
    book: (b: { courtId: string; startsAt: string; hours: number }) => post<ApiBooking>("/api/v1/business/bookings", b),
    myBookings: () => get<ApiBooking[]>("/api/v1/business/bookings/mine"),
    cancelBooking: (id: string) => post<ApiBooking>(`/api/v1/business/bookings/${id}/cancel`),
    notifications: () => get<ApiNotification[]>("/api/v1/notifications"),
    conversations: () => get<ApiConversation[]>("/api/v1/chat/conversations"),
    messages: (conversationId: string) => get<ApiChatMessage[]>(`/api/v1/chat/conversations/${conversationId}/messages`),
    send: (conversationId: string, body: string) => post<ApiChatMessage>(`/api/v1/chat/conversations/${conversationId}/messages`, { body }),
    tournaments: () => get<ApiTournamentSummary[]>("/api/v1/events/tournaments"),
    tournament: (id: string) => get<ApiTournamentDetail>(`/api/v1/events/tournaments/${id}`),
    createTournament: (b: { name: string; sport: string; startsOn: string; maxTeams: number }) =>
      post<ApiTournamentDetail>("/api/v1/events/tournaments", b),
    registerTeam: (id: string, name: string) => post<ApiTournamentDetail>(`/api/v1/events/tournaments/${id}/teams`, { name }),
    startTournament: (id: string) => post<ApiTournamentDetail>(`/api/v1/events/tournaments/${id}/start`),
    recordResult: (id: string, matchId: string, homeScore: number, awayScore: number) =>
      post<ApiTournamentDetail>(`/api/v1/events/tournaments/${id}/matches/${matchId}/result`, { homeScore, awayScore }),
  };
}
export type Api = ReturnType<typeof api>;
