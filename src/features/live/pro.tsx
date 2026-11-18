"use client";
import { Ban, Building2, CalendarClock, Coins, Gauge } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, CardSkeleton, EmptyState, ErrorState, Field, Input, Modal } from "@/components/ui";
import type { ProCourt } from "@/lib/api/client";
import { fcfa } from "@/lib/utils";
import { hour, isoDay, sportName, useAction, useApi, useResource, when } from "./hooks";

/** Espace prestataire : tableau de bord, terrains (tarif, horaires), planning, blocage de créneaux. */
export function ProPanel() {
  const client = useApi();
  const { busy, run } = useAction();
  const dashboard = useResource(() => client.proDashboard(), [client]);
  const courts = useResource(() => client.proCourts(), [client]);
  const today = new Date();
  const inAWeek = new Date(Date.now() + 6 * 86400000);
  const bookings = useResource(() => client.proBookings(isoDay(today), isoDay(inAWeek)), [client]);
  const [editing, setEditing] = useState<ProCourt | null>(null);
  const [blocking, setBlocking] = useState<ProCourt | null>(null);

  const refresh = () => { dashboard.reload(); courts.reload(); bookings.reload(); };
  const release = async (id: string) => {
    if (await run(id, async () => { await client.proRelease(id); return true; }, "Créneau libéré")) refresh();
  };

  return (
    <div className="space-y-6">
      {dashboard.loading && !dashboard.data ? <CardSkeleton rows={1} /> : dashboard.error ? <ErrorState description={dashboard.error} onRetry={dashboard.reload} /> : dashboard.data && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi icon={<Building2 />} label="Terrains" value={String(dashboard.data.courts)} />
          <Kpi icon={<CalendarClock />} label="Réservations à 7 jours" value={String(dashboard.data.bookingsNext7Days)} />
          <Kpi icon={<Coins />} label="Revenu à 7 jours (démo)" value={fcfa(dashboard.data.revenueNext7DaysFcfa)} />
          <Kpi icon={<Gauge />} label="Occupation aujourd'hui" value={`${dashboard.data.occupancyTodayPercent} %`} />
        </div>
      )}

      <section className="space-y-3">
        <h3 className="font-display text-lg font-bold">Mes terrains</h3>
        {courts.loading && !courts.data ? <CardSkeleton rows={2} /> : courts.error ? <ErrorState description={courts.error} onRetry={courts.reload} /> :
          !courts.data?.length ? <EmptyState icon={<Building2 />} title="Aucun terrain rattaché" description="Contacte l'équipe SportMatch pour rattacher ton complexe." /> : (
            <div className="grid gap-3 sm:grid-cols-2">
              {courts.data.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{c.name} · {c.venueName}</p>
                      <p className="text-sm text-muted">{sportName(c.sport)} · {c.openHour} h – {c.closeHour} h · {fcfa(c.pricePerHourFcfa)} / h</p>
                    </div>
                    <Badge tone="primary">{c.upcomingBookings} à venir</Badge>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(c)}>Tarif et horaires</Button>
                    <Button size="sm" variant="ghost" onClick={() => setBlocking(c)}><Ban className="h-3.5 w-3.5" /> Bloquer un créneau</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-lg font-bold">Planning des 7 prochains jours</h3>
        {bookings.loading && !bookings.data ? <CardSkeleton rows={3} /> : bookings.error ? <ErrorState description={bookings.error} onRetry={bookings.reload} /> :
          !bookings.data?.length ? <EmptyState icon={<CalendarClock />} title="Planning vide" description="Les réservations de tes terrains s'afficheront ici." /> : (
            <div className="space-y-2">
              {bookings.data.map((b) => (
                <Card key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                  <div>
                    <p className="font-semibold">{when(b.startsAt)} → {hour(b.endsAt)} · {b.courtName}</p>
                    <p className="text-muted">{b.status === "BLOCKED" ? "Créneau bloqué" : b.customerEmail ?? "Client"} · {fcfa(b.priceFcfa)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={b.status === "CONFIRMED" ? "success" : b.status === "BLOCKED" ? "warning" : "neutral"}>
                      {b.status === "CONFIRMED" ? "Confirmée" : b.status === "BLOCKED" ? "Bloqué" : "Annulée"}
                    </Badge>
                    {b.status === "BLOCKED" && <Button size="sm" variant="outline" loading={busy === b.id} onClick={() => release(b.id)}>Libérer</Button>}
                  </div>
                </Card>
              ))}
            </div>
          )}
      </section>

      <EditCourt court={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />
      <BlockSlot court={blocking} onClose={() => setBlocking(null)} onSaved={() => { setBlocking(null); refresh(); }} />
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted [&_svg]:h-4 [&_svg]:w-4">{icon}<span className="text-xs">{label}</span></div>
      <p className="mt-2 font-display text-xl font-bold tabular">{value}</p>
    </Card>
  );
}

function EditCourt({ court, onClose, onSaved }: { court: ProCourt | null; onClose: () => void; onSaved: () => void }) {
  const client = useApi();
  const { busy, run } = useAction();
  const [form, setForm] = useState({ price: "", open: "", close: "" });
  const current = court && { price: form.price || String(court.pricePerHourFcfa), open: form.open || String(court.openHour), close: form.close || String(court.closeHour) };
  const save = async () => {
    if (!court || !current) return;
    const r = await run("edit", () => client.proUpdateCourt(court.id, {
      pricePerHourFcfa: Number(current.price), openHour: Number(current.open), closeHour: Number(current.close),
    }), "Terrain mis à jour");
    if (r) { setForm({ price: "", open: "", close: "" }); onSaved(); }
  };
  return (
    <Modal open={!!court} onClose={onClose} title={court ? `${court.name} · ${court.venueName}` : ""} footer={<Button loading={busy === "edit"} onClick={save}>Enregistrer</Button>}>
      {current && (
        <div className="grid grid-cols-3 gap-3">
          <Field label="Tarif (FCFA / h)"><Input type="number" min={0} step={500} value={current.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
          <Field label="Ouverture"><Input type="number" min={0} max={23} value={current.open} onChange={(e) => setForm({ ...form, open: e.target.value })} /></Field>
          <Field label="Fermeture"><Input type="number" min={1} max={24} value={current.close} onChange={(e) => setForm({ ...form, close: e.target.value })} /></Field>
        </div>
      )}
    </Modal>
  );
}

function BlockSlot({ court, onClose, onSaved }: { court: ProCourt | null; onClose: () => void; onSaved: () => void }) {
  const client = useApi();
  const { busy, run } = useAction();
  const tomorrow = isoDay(new Date(Date.now() + 86400000));
  const [form, setForm] = useState({ date: tomorrow, hour: "10", hours: "2" });
  const save = async () => {
    if (!court) return;
    const startsAt = `${form.date}T${form.hour.padStart(2, "0")}:00:00Z`;
    if (await run("block", () => client.proBlock(court.id, startsAt, Number(form.hours)), "Créneau bloqué : il n'est plus réservable")) onSaved();
  };
  return (
    <Modal open={!!court} onClose={onClose} title="Bloquer un créneau" description="Entretien, événement privé… Le créneau disparaît des disponibilités publiques."
      footer={<Button loading={busy === "block"} onClick={save}>Bloquer</Button>}>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Date"><Input type="date" min={isoDay(new Date())} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="Heure (Dakar)"><Input type="number" min={0} max={23} value={form.hour} onChange={(e) => setForm({ ...form, hour: e.target.value })} /></Field>
        <Field label="Durée (h)"><Input type="number" min={1} max={12} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}
