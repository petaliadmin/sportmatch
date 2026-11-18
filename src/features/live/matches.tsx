"use client";
import { CalendarPlus, Check, Repeat, Share2, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, Badge, Button, Card, CardSkeleton, EmptyState, ErrorState, Field, Input, Modal, Progress, Select } from "@/components/ui";
import { useSession } from "@/lib/api/auth";
import type { ApiMatch, MatchFilter } from "@/lib/api/client";
import { useStore } from "@/lib/store";
import { SPORT_LABELS, sportName, useAction, useApi, useResource, when } from "./hooks";

const LEVELS: Record<string, string> = { BEGINNER: "Débutant", INTERMEDIATE: "Intermédiaire", ADVANCED: "Confirmé" };
export const levelName = (l: string) => LEVELS[l] ?? l.toLowerCase();

/** Lien public d'un match : ouvre la bêta live directement sur ce match (?match=<id>#live). */
export function matchLink(id: string) {
  return `${window.location.origin}${window.location.pathname}?match=${id}#live`;
}

export function MatchesPanel({ onOpenChat, focusMatchId }: { onOpenChat: (matchId: string) => void; focusMatchId?: string | null }) {
  const client = useApi();
  const { user, login } = useSession();
  const [view, setView] = useState<"discover" | "mine">("discover");
  const [filter, setFilter] = useState<MatchFilter>({ status: "OPEN" });
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<string | null>(focusMatchId ?? null);
  const matches = useResource(() => (view === "mine" ? client.myMatches() : client.matches(filter)), [view, filter, client]);
  const mine = useResource(() => (user ? client.myMatches() : Promise.resolve([] as ApiMatch[])), [user, client]);
  const joinedIds = new Set((mine.data ?? []).map((m) => m.id));
  const refresh = () => { matches.reload(); mine.reload(); };

  useEffect(() => { if (focusMatchId) setDetail(focusMatchId); }, [focusMatchId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button size="sm" variant={view === "discover" ? "primary" : "outline"} onClick={() => setView("discover")}>À rejoindre</Button>
          <Button size="sm" variant={view === "mine" ? "primary" : "outline"} onClick={() => (user ? setView("mine") : login())}>
            Mes matchs{mine.data?.length ? ` · ${mine.data.length}` : ""}
          </Button>
        </div>
        <Button size="sm" onClick={() => (user ? setCreating(true) : login())}><CalendarPlus className="h-3.5 w-3.5" /> Créer un match</Button>
      </div>

      {view === "discover" && <Filters value={filter} onChange={setFilter} />}

      {matches.loading && !matches.data ? <CardSkeleton rows={3} /> : matches.error ? <ErrorState description={matches.error} onRetry={matches.reload} /> :
        !matches.data?.length ? (
          <EmptyState icon={<Users />} title={view === "mine" ? "Tu n'as pas encore de match" : "Aucun match pour ces critères"}
            description={view === "mine" ? "Rejoins-en un ou crée le tien." : "Élargis les filtres ou lance le premier !"} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {matches.data.map((m) => (
              <MatchCard key={m.id} match={m} joined={joinedIds.has(m.id)} onChanged={refresh}
                onOpenChat={onOpenChat} onDetails={() => setDetail(m.id)} />
            ))}
          </div>
        )}
      <CreateMatch open={creating} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); setView("discover"); refresh(); }} />
      <MatchDetail matchId={detail} joined={!!detail && joinedIds.has(detail)} onClose={() => setDetail(null)} onChanged={refresh} />
    </div>
  );
}

function Filters({ value, onChange }: { value: MatchFilter; onChange: (f: MatchFilter) => void }) {
  const set = (k: keyof MatchFilter, v: string) => onChange({ ...value, [k]: v || undefined });
  return (
    <Card className="grid grid-cols-2 gap-3 p-3 md:grid-cols-5">
      <Field label="Statut"><Select value={value.status ?? "OPEN"} onChange={(e) => set("status", e.target.value)}>
        <option value="OPEN">Ouverts</option><option value="FULL">Complets</option>
      </Select></Field>
      <Field label="Sport"><Select value={value.sport ?? ""} onChange={(e) => set("sport", e.target.value)}>
        <option value="">Tous</option>{Object.entries(SPORT_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </Select></Field>
      <Field label="Niveau"><Select value={value.level ?? ""} onChange={(e) => set("level", e.target.value)}>
        <option value="">Tous</option>{Object.entries(LEVELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </Select></Field>
      <Field label="Du"><Input type="date" value={value.from ?? ""} onChange={(e) => set("from", e.target.value)} /></Field>
      <Field label="Au"><Input type="date" value={value.to ?? ""} min={value.from} onChange={(e) => set("to", e.target.value)} /></Field>
    </Card>
  );
}

function useMatchActions(onChanged: () => void) {
  const client = useApi();
  const { user, login } = useSession();
  const { celebrate, toast } = useStore();
  const { busy, run } = useAction();
  return {
    busy,
    join: async (id: string) => {
      if (!user) return login();
      if (await run(`join-${id}`, () => client.joinMatch(id), "Tu es dans l'équipe !")) { celebrate("whistle"); onChanged(); }
    },
    leave: async (id: string) => {
      if (await run(`leave-${id}`, () => client.leaveMatch(id), "Tu t'es retiré, l'organisateur est prévenu")) onChanged();
    },
    cancel: async (id: string) => {
      if (await run(`cancel-${id}`, () => client.cancelMatch(id), "Match annulé, les participants sont prévenus")) onChanged();
    },
    share: async (m: ApiMatch) => {
      const url = matchLink(m.id);
      const text = `${sportName(m.sport)} à ${m.venueName}, ${when(m.startsAt)} — rejoins-nous sur SportMatch : ${url}`;
      try {
        if (navigator.share) { await navigator.share({ title: "Match SportMatch", text, url }); return; }
      } catch { return; }
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
      try { await navigator.clipboard.writeText(url); toast({ title: "Lien copié", body: "Colle-le dans ton groupe WhatsApp.", tone: "success" }); } catch {}
    },
  };
}

function MatchCard({ match: m, joined, onChanged, onOpenChat, onDetails }: {
  match: ApiMatch; joined: boolean; onChanged: () => void; onOpenChat: (id: string) => void; onDetails: () => void;
}) {
  const { user } = useSession();
  const a = useMatchActions(onChanged);
  const mine = !!user && m.organizerId === user.id;
  const upcoming = new Date(m.startsAt).getTime() > Date.now();
  const cancelled = m.status === "CANCELLED";
  return (
    <Card className={`p-4 ${cancelled ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{sportName(m.sport)} · {m.venueName}</p>
          <p className="text-sm text-muted">{when(m.startsAt)} · {m.durationMinutes} min · {levelName(m.level)}</p>
          {(m.seriesId || (!mine && m.organizerName)) && <p className="text-xs text-muted">{!mine && m.organizerName ? `Par ${m.organizerName}` : ""}{m.seriesId && <> <Repeat className="inline h-3 w-3" aria-hidden /> chaque semaine</>}</p>}
        </div>
        {cancelled ? <Badge tone="error">Annulé</Badge> : mine ? <Badge tone="primary">Organisé par toi</Badge> : joined ? <Badge tone="info">Inscrit</Badge>
          : <Badge tone={m.status === "OPEN" ? "success" : "neutral"}>{m.status === "OPEN" ? "Ouvert" : "Complet"}</Badge>}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Progress value={m.participants} max={m.maxPlayers} className="flex-1" />
        <span className="tabular text-xs text-muted">{m.participants}/{m.maxPlayers}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {!cancelled && upcoming && m.status === "OPEN" && !mine && !joined && <Button size="sm" loading={a.busy === `join-${m.id}`} onClick={() => a.join(m.id)}>Rejoindre</Button>}
        <Button size="sm" variant="outline" onClick={onDetails}>Joueurs</Button>
        {user && (joined || mine) && !cancelled && <Button size="sm" variant="outline" onClick={() => onOpenChat(m.id)}>Chat du match</Button>}
        {!cancelled && <Button size="sm" variant="ghost" aria-label="Partager le match" onClick={() => a.share(m)}><Share2 className="h-3.5 w-3.5" /> Partager</Button>}
        {joined && !mine && !cancelled && upcoming && <Button size="sm" variant="ghost" loading={a.busy === `leave-${m.id}`} onClick={() => a.leave(m.id)}>Quitter</Button>}
        {!cancelled && (mine || user?.roles.includes("admin")) && (
          <Button size="sm" variant="ghost" loading={a.busy === `cancel-${m.id}`} onClick={() => a.cancel(m.id)}>
            {mine ? "Annuler" : "Annuler (modération)"}
          </Button>
        )}
      </div>
    </Card>
  );
}

/** Détail : participants, fiabilité, feuille de présence (organisateur, après le coup d'envoi). */
function MatchDetail({ matchId, joined, onClose, onChanged }: { matchId: string | null; joined: boolean; onClose: () => void; onChanged: () => void }) {
  const client = useApi();
  const { user } = useSession();
  const { busy, run } = useAction();
  const a = useMatchActions(() => { onChanged(); match.reload(); people.reload(); });
  const match = useResource(() => (matchId ? client.match(matchId) : Promise.resolve(null)), [matchId, client]);
  const people = useResource(() => (matchId ? client.participants(matchId) : Promise.resolve([])), [matchId, client]);
  const [profile, setProfile] = useState<string | null>(null);
  const m = match.data;
  const mine = !!m && !!user && m.organizerId === user.id;
  const started = !!m && new Date(m.startsAt).getTime() <= Date.now();

  const mark = async (playerId: string, present: boolean) => {
    if (!m) return;
    const r = await run(`att-${playerId}`, () => client.markAttendance(m.id, playerId, present), present ? "Présence notée" : "Absence notée");
    if (r) people.setData(r);
  };

  return (
    <Modal open={!!matchId} onClose={onClose} title={m ? `${sportName(m.sport)} · ${m.venueName}` : "Match"}
      description={m ? `${when(m.startsAt)} · ${m.durationMinutes} min · ${levelName(m.level)}` : undefined}
      footer={m && m.status === "OPEN" && !mine && !joined && !started ? <Button loading={a.busy === `join-${m.id}`} onClick={() => a.join(m.id)}>Rejoindre ce match</Button> : undefined}>
      {match.error ? <ErrorState description={match.error} onRetry={match.reload} /> : people.loading && !people.data ? <CardSkeleton rows={2} /> : (
        <div className="space-y-2">
          <p className="text-sm text-muted">{people.data?.length ?? 0} joueur(s) sur {m?.maxPlayers ?? "?"}{mine && started ? " · coche la présence de chacun après le match" : ""}</p>
          {people.data?.map((p) => (
            <div key={p.playerId} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2">
              <button type="button" className="flex items-center gap-2 text-left" onClick={() => user && setProfile(p.playerId)}>
                <Avatar name={p.displayName} size={28} />
                <span className="text-sm font-semibold">{p.displayName}{p.playerId === m?.organizerId ? " · organisateur" : ""}</span>
              </button>
              {mine && started && m?.status !== "CANCELLED" ? (
                <div className="flex gap-1">
                  <Button size="sm" variant={p.attended === true ? "primary" : "outline"} aria-label={`${p.displayName} présent`} loading={busy === `att-${p.playerId}`} onClick={() => mark(p.playerId, true)}><Check className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant={p.attended === false ? "primary" : "outline"} aria-label={`${p.displayName} absent`} onClick={() => mark(p.playerId, false)}><X className="h-3.5 w-3.5" /></Button>
                </div>
              ) : p.attended != null && <Badge tone={p.attended ? "success" : "warning"}>{p.attended ? "Présent" : "Absent"}</Badge>}
            </div>
          ))}
          {!user && <p className="text-xs text-muted">Connecte-toi pour voir le profil et la fiabilité des joueurs.</p>}
        </div>
      )}
      <PlayerCard playerId={profile} onClose={() => setProfile(null)} />
    </Modal>
  );
}

export function PlayerCard({ playerId, onClose }: { playerId: string | null; onClose: () => void }) {
  const client = useApi();
  const p = useResource(() => (playerId ? client.player(playerId) : Promise.resolve(null)), [playerId, client]);
  if (!playerId) return null;
  return (
    <Card className="mt-3 space-y-1 p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{p.data?.displayName ?? "…"}</p>
        <Button size="icon-sm" variant="ghost" aria-label="Fermer le profil" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      {p.data && (
        <>
          <p className="text-sm text-muted">
            {[p.data.favoriteSport && sportName(p.data.favoriteSport), p.data.level && levelName(p.data.level), p.data.district].filter(Boolean).join(" · ") || "Profil non renseigné"}
          </p>
          {p.data.bio && <p className="text-sm">{p.data.bio}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge tone="neutral">{p.data.stats.matchesJoined} matchs</Badge>
            <Badge tone="neutral">{p.data.stats.matchesOrganized} organisés</Badge>
            <Badge tone="neutral">{p.data.stats.reliabilityPercent == null ? "Fiabilité : nouveau joueur" : `Fiabilité : ${p.data.stats.reliabilityPercent} %`}</Badge>
          </div>
        </>
      )}
    </Card>
  );
}

function CreateMatch({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const client = useApi();
  const { celebrate } = useStore();
  const { busy, run } = useAction();
  const venues = useResource(() => client.venues(), [client]);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [form, setForm] = useState({ venueId: "", date: tomorrow, time: "19:00", durationMinutes: "90", maxPlayers: "10", level: "INTERMEDIATE", repeatWeeks: "0" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  const venue = venues.data?.find((v) => v.id === (form.venueId || venues.data?.[0]?.id));
  const repeat = Number(form.repeatWeeks);

  const submit = async () => {
    if (!venue) return;
    const r = await run("create", () => client.createMatch({
      venueId: venue.id, sport: venue.sport, startsAt: `${form.date}T${form.time}:00Z`,
      durationMinutes: Number(form.durationMinutes), maxPlayers: Number(form.maxPlayers), level: form.level, repeatWeeks: repeat,
    }), repeat ? `Série de ${repeat + 1} matchs publiée` : "Match publié, les joueurs du coin sont prévenus");
    if (r) { celebrate("cheer"); onCreated(); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Créer un match" footer={<Button loading={busy === "create"} onClick={submit} disabled={!venue}>Publier le match</Button>}>
      <div className="space-y-3">
        <Field label="Terrain">
          <Select value={form.venueId || venue?.id || ""} onChange={set("venueId")}>
            {venues.data?.map((v) => <option key={v.id} value={v.id}>{v.name} · {sportName(v.sport)}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><Input type="date" min={tomorrow} value={form.date} onChange={set("date")} /></Field>
          <Field label="Heure (Dakar)"><Input type="time" step={1800} value={form.time} onChange={set("time")} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Durée"><Select value={form.durationMinutes} onChange={set("durationMinutes")}>{["60", "90", "120"].map((d) => <option key={d} value={d}>{d} min</option>)}</Select></Field>
          <Field label="Joueurs"><Input type="number" min={2} max={30} value={form.maxPlayers} onChange={set("maxPlayers")} /></Field>
          <Field label="Niveau"><Select value={form.level} onChange={set("level")}>
            {Object.entries(LEVELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select></Field>
        </div>
        <Field label="Répétition">
          <Select value={form.repeatWeeks} onChange={set("repeatWeeks")}>
            <option value="0">Match unique</option>
            {[1, 3, 7].map((n) => <option key={n} value={String(n)}>Chaque semaine, {n + 1} semaines</option>)}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
