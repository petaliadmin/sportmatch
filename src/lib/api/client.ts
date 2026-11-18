import { API_URL } from "./config";

/** Client typé de l'API SportMatch (gateway). Les types reflètent contracts/openapi. */

export interface ApiVenue {
  id: string; name: string; district: string; sport: string; pricePerHourFcfa: number;
  rating: number | null; latitude: number | null; longitude: number | null; distanceKm: number | null;
}
export interface ApiMatch {
  id: string; venueId: string; venueName: string; sport: string; startsAt: string; durationMinutes: number;
  maxPlayers: number; level: string; organizerId: string; status: "OPEN" | "FULL"; participants: number;
}
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
    matches: (status = "OPEN") => get<ApiMatch[]>(`/api/v1/matches?status=${status}`),
    createMatch: (b: { venueId: string; sport: string; startsAt: string; durationMinutes: number; maxPlayers: number; level: string }) =>
      post<ApiMatch>("/api/v1/matches", b),
    joinMatch: (id: string) => post<ApiMatch>(`/api/v1/matches/${id}/join`),
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
