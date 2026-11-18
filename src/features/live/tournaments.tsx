"use client";
import { Crown, Trophy } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, CardSkeleton, EmptyState, ErrorState, Field, Input, Modal, Select } from "@/components/ui";
import { useSession } from "@/lib/api/auth";
import type { ApiBracketMatch, ApiTournamentDetail } from "@/lib/api/client";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { sportName, useAction, useApi, useResource } from "./hooks";

const STATUS: Record<string, { label: string; tone: "primary" | "warning" | "success" }> = {
  REGISTRATION: { label: "Inscriptions ouvertes", tone: "primary" },
  IN_PROGRESS: { label: "En cours", tone: "warning" },
  COMPLETED: { label: "Terminé", tone: "success" },
};

export function TournamentsPanel() {
  const client = useApi();
  const { user, login } = useSession();
  const list = useResource(() => client.tournaments(), [client]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  if (openId) return <TournamentDetail id={openId} onBack={() => { setOpenId(null); list.reload(); }} />;
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button size="sm" onClick={() => (user ? setCreating(true) : login())}><Trophy className="h-3.5 w-3.5" /> Organiser un tournoi</Button></div>
      {list.loading ? <CardSkeleton rows={3} /> : list.error ? <ErrorState description={list.error} onRetry={list.reload} /> :
        !list.data?.length ? <EmptyState icon={<Trophy />} title="Aucun tournoi" description="Organise le premier tournoi de ton quartier." /> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {list.data.map((t) => (
              <Card key={t.id} interactive onClick={() => setOpenId(t.id)} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-muted">{sportName(t.sport)} · {new Date(t.startsOn).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} · {t.teams}/{t.maxTeams} équipes</p>
                  </div>
                  <Badge tone={STATUS[t.status].tone}>{STATUS[t.status].label}</Badge>
                </div>
                {t.championName && <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold"><Crown className="h-4 w-4 text-warning" /> {t.championName}</p>}
              </Card>
            ))}
          </div>
        )}
      <CreateTournament open={creating} onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); setOpenId(id); }} />
    </div>
  );
}

function CreateTournament({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const client = useApi();
  const { busy, run } = useAction();
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const [form, setForm] = useState({ name: "", sport: "FOOTBALL", startsOn: nextWeek, maxTeams: "8" });
  const submit = async () => {
    const r = await run("create", () => client.createTournament({ ...form, maxTeams: Number(form.maxTeams) }), "Tournoi créé, les inscriptions sont ouvertes");
    if (r) onCreated(r.tournament.id);
  };
  return (
    <Modal open={open} onClose={onClose} title="Organiser un tournoi" footer={<Button loading={busy === "create"} disabled={form.name.trim().length < 3} onClick={submit}>Créer</Button>}>
      <div className="space-y-3">
        <Field label="Nom"><Input value={form.name} maxLength={120} placeholder="Coupe de la Corniche" onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Sport"><Select value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })}>
            {["FOOTBALL", "BASKETBALL", "TENNIS", "PADEL"].map((s) => <option key={s} value={s}>{sportName(s)}</option>)}
          </Select></Field>
          <Field label="Date"><Input type="date" min={nextWeek} value={form.startsOn} onChange={(e) => setForm({ ...form, startsOn: e.target.value })} /></Field>
          <Field label="Équipes max"><Select value={form.maxTeams} onChange={(e) => setForm({ ...form, maxTeams: e.target.value })}>
            {["4", "8", "16", "32"].map((n) => <option key={n} value={n}>{n}</option>)}
          </Select></Field>
        </div>
      </div>
    </Modal>
  );
}

function TournamentDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const client = useApi();
  const { user, login } = useSession();
  const { celebrate } = useStore();
  const { busy, run } = useAction();
  const detail = useResource(() => client.tournament(id), [id, client]);
  const [teamName, setTeamName] = useState("");
  const [scoring, setScoring] = useState<ApiBracketMatch | null>(null);

  const apply = (d: ApiTournamentDetail | null) => { if (d) detail.setData(d); return d; };
  if (detail.loading && !detail.data) return <CardSkeleton rows={4} />;
  if (detail.error || !detail.data) return <ErrorState description={detail.error ?? undefined} onRetry={detail.reload} />;
  const { tournament: t, teams, bracket } = detail.data;
  const organizer = user?.id === t.organizerId;
  const myTeam = teams.find((x) => x.captainId === user?.id);
  const rounds = Array.from(new Set(bracket.map((m) => m.round))).sort((a, b) => a - b);
  const roundName = (r: number) => (r === rounds.length ? "Finale" : r === rounds.length - 1 ? "Demi-finales" : r === rounds.length - 2 ? "Quarts" : `Tour ${r}`);

  return (
    <div className="space-y-5">
      <Button variant="link" onClick={onBack}>← Tous les tournois</Button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">{t.name}</h2>
          <p className="text-sm text-muted">{sportName(t.sport)} · {teams.length}/{t.maxTeams} équipes</p>
        </div>
        <Badge tone={STATUS[t.status].tone}>{STATUS[t.status].label}</Badge>
      </div>
      {t.championName && (
        <Card className="flex items-center gap-3 border-warning/40 bg-warning/10 p-4">
          <Crown className="h-6 w-6 text-warning" /><p className="font-display text-lg font-bold">{t.championName} remporte le tournoi !</p>
        </Card>
      )}
      {t.status === "REGISTRATION" && (
        <Card className="space-y-3 p-4">
          <p className="font-semibold">Équipes inscrites</p>
          <div className="flex flex-wrap gap-2">{teams.length ? teams.map((x) => <Badge key={x.id}>{x.name}</Badge>) : <span className="text-sm text-muted">Aucune pour l'instant.</span>}</div>
          {!myTeam && teams.length < t.maxTeams && (
            <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!user) return login(); if (apply(await run("team", () => client.registerTeam(id, teamName), "Équipe inscrite"))) setTeamName(""); }}>
              <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Nom de ton équipe" maxLength={60} aria-label="Nom de l'équipe" />
              <Button type="submit" loading={busy === "team"} disabled={teamName.trim().length < 2}>Inscrire</Button>
            </form>
          )}
          {organizer && <Button variant="outline" loading={busy === "start"} disabled={teams.length < 2}
            onClick={async () => { if (apply(await run("start", () => client.startTournament(id), "Tableau généré, que le meilleur gagne !"))) celebrate("whistle"); }}>
            Clore les inscriptions et générer le tableau</Button>}
        </Card>
      )}
      {bracket.length > 0 && (
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
          {rounds.map((r) => (
            <div key={r} className="w-56 shrink-0 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{roundName(r)}</p>
              {bracket.filter((m) => m.round === r).map((m) => (
                <Card key={m.id} className={cn("p-3 text-sm", m.status === "READY" && organizer && "cursor-pointer hover:border-primary")} onClick={() => m.status === "READY" && organizer && setScoring(m)}>
                  <Line name={m.homeTeam} score={m.homeScore} winner={!!m.winnerTeamId && m.winnerTeamId === m.homeTeamId} />
                  <Line name={m.bye ? "Exempté" : m.awayTeam} score={m.awayScore} winner={!!m.winnerTeamId && m.winnerTeamId === m.awayTeamId} />
                  {m.status === "READY" && <p className="mt-1 text-2xs text-primary-ink">{organizer ? "Saisir le score" : "À jouer"}</p>}
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}
      <ScoreModal match={scoring} onClose={() => setScoring(null)} onSave={async (h, a) => {
        const d = apply(await run("score", () => client.recordResult(id, scoring!.id, h, a), "Score enregistré"));
        if (d) { setScoring(null); if (d.tournament.status === "COMPLETED") celebrate("cheer"); }
      }} busy={busy === "score"} />
    </div>
  );
}

function Line({ name, score, winner }: { name: string | null; score: number | null; winner: boolean }) {
  return (
    <div className={cn("flex items-center justify-between py-0.5", winner && "font-bold")}>
      <span className={cn("truncate", !name && "text-muted")}>{name ?? "À déterminer"}</span>
      <span className="tabular">{score ?? ""}</span>
    </div>
  );
}

function ScoreModal({ match, onClose, onSave, busy }: { match: ApiBracketMatch | null; onClose: () => void; onSave: (h: number, a: number) => void; busy: boolean }) {
  const [home, setHome] = useState("0");
  const [away, setAway] = useState("0");
  return (
    <Modal open={!!match} onClose={onClose} title="Résultat du match" description="Pas de match nul en élimination directe."
      footer={<Button loading={busy} disabled={home === away} onClick={() => onSave(Number(home), Number(away))}>Valider</Button>}>
      {match && (
        <div className="grid grid-cols-2 gap-3">
          <Field label={match.homeTeam ?? ""}><Input type="number" min={0} value={home} onChange={(e) => setHome(e.target.value)} /></Field>
          <Field label={match.awayTeam ?? ""}><Input type="number" min={0} value={away} onChange={(e) => setAway(e.target.value)} /></Field>
        </div>
      )}
    </Modal>
  );
}
