"use client";
import { CalendarPlus, Users } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, CardSkeleton, EmptyState, ErrorState, Field, Input, Modal, Progress, Select } from "@/components/ui";
import { useSession } from "@/lib/api/auth";
import { useStore } from "@/lib/store";
import { sportName, useAction, useApi, useResource, when } from "./hooks";

export function MatchesPanel({ onOpenChat }: { onOpenChat: (matchId: string) => void }) {
  const client = useApi();
  const { user, login } = useSession();
  const { celebrate } = useStore();
  const { busy, run } = useAction();
  const [status, setStatus] = useState<"OPEN" | "FULL">("OPEN");
  const [creating, setCreating] = useState(false);
  const matches = useResource(() => client.matches(status), [status, client]);

  const join = async (id: string) => {
    if (!user) return login();
    const r = await run(id, () => client.joinMatch(id), "Tu es dans l'équipe !");
    if (r) { celebrate("whistle"); matches.reload(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button size="sm" variant={status === "OPEN" ? "primary" : "outline"} onClick={() => setStatus("OPEN")}>Ouverts</Button>
          <Button size="sm" variant={status === "FULL" ? "primary" : "outline"} onClick={() => setStatus("FULL")}>Complets</Button>
        </div>
        <Button size="sm" onClick={() => (user ? setCreating(true) : login())}><CalendarPlus className="h-3.5 w-3.5" /> Créer un match</Button>
      </div>
      {matches.loading ? <CardSkeleton rows={3} /> : matches.error ? <ErrorState description={matches.error} onRetry={matches.reload} /> :
        !matches.data?.length ? <EmptyState icon={<Users />} title="Aucun match pour l'instant" description="Lance le premier !" /> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {matches.data.map((m) => {
              const mine = user && m.organizerId === user.id;
              return (
                <Card key={m.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{sportName(m.sport)} · {m.venueName}</p>
                      <p className="text-sm text-muted">{when(m.startsAt)} · {m.durationMinutes} min · {m.level.toLowerCase()}</p>
                    </div>
                    {mine ? <Badge tone="primary">Organisé par toi</Badge> : <Badge tone={m.status === "OPEN" ? "success" : "neutral"}>{m.status === "OPEN" ? "Ouvert" : "Complet"}</Badge>}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={m.participants} max={m.maxPlayers} className="flex-1" />
                    <span className="tabular text-xs text-muted">{m.participants}/{m.maxPlayers}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {m.status === "OPEN" && !mine && <Button size="sm" loading={busy === m.id} onClick={() => join(m.id)}>Rejoindre</Button>}
                    {user && <Button size="sm" variant="outline" onClick={() => onOpenChat(m.id)}>Chat du match</Button>}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      <CreateMatch open={creating} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); setStatus("OPEN"); matches.reload(); }} />
    </div>
  );
}

function CreateMatch({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const client = useApi();
  const { celebrate } = useStore();
  const { busy, run } = useAction();
  const venues = useResource(() => client.venues(), [client]);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [form, setForm] = useState({ venueId: "", date: tomorrow, time: "19:00", durationMinutes: "90", maxPlayers: "10", level: "INTERMEDIATE" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  const venue = venues.data?.find((v) => v.id === (form.venueId || venues.data?.[0]?.id));

  const submit = async () => {
    if (!venue) return;
    const r = await run("create", () => client.createMatch({
      venueId: venue.id, sport: venue.sport, startsAt: `${form.date}T${form.time}:00Z`,
      durationMinutes: Number(form.durationMinutes), maxPlayers: Number(form.maxPlayers), level: form.level,
    }), "Match publié, les joueurs du coin sont prévenus");
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
            <option value="BEGINNER">Débutant</option><option value="INTERMEDIATE">Intermédiaire</option><option value="ADVANCED">Confirmé</option>
          </Select></Field>
        </div>
      </div>
    </Modal>
  );
}
