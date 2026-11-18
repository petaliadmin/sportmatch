"use client";
import { LocateFixed, MapPin } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, CardSkeleton, Chip, EmptyState, ErrorState, Segmented } from "@/components/ui";
import { DAKAR_CENTER } from "@/lib/api/config";
import { useSession } from "@/lib/api/auth";
import type { ApiCourt, ApiVenue } from "@/lib/api/client";
import { cn, fcfa, nextDays, dayLabel } from "@/lib/utils";
import { hour, isoDay, sportName, useAction, useApi, useResource } from "./hooks";

const SPORTS = ["", "FOOTBALL", "BASKETBALL", "TENNIS", "PADEL"];

/** Terrains à proximité (PostGIS) puis réservation de démonstration d'un créneau. */
export function VenuesPanel() {
  const client = useApi();
  const [origin, setOrigin] = useState(DAKAR_CENTER);
  const [locating, setLocating] = useState(false);
  const [radius, setRadius] = useState("10");
  const [sport, setSport] = useState("");
  const [venue, setVenue] = useState<ApiVenue | null>(null);
  const venues = useResource(() => client.nearby(origin.lat, origin.lng, Number(radius), sport || undefined), [origin, radius, sport, client]);

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setOrigin({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocating(false); },
      () => setLocating(false),
      { timeout: 8000 },
    );
  };

  if (venue) return <VenueBooking venue={venue} onBack={() => setVenue(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" loading={locating} onClick={locate}><LocateFixed className="h-3.5 w-3.5" /> Me localiser</Button>
        <span className="text-xs text-muted">Depuis {origin === DAKAR_CENTER ? "Dakar Plateau" : `${origin.lat.toFixed(3)}, ${origin.lng.toFixed(3)}`}</span>
        <Segmented size="sm" value={radius} onChange={setRadius} options={[{ value: "2", label: "2 km" }, { value: "5", label: "5 km" }, { value: "10", label: "10 km" }, { value: "25", label: "25 km" }]} />
      </div>
      <div className="flex flex-wrap gap-2">
        {SPORTS.map((s) => <Chip key={s || "all"} active={sport === s} onClick={() => setSport(s)}>{s ? sportName(s) : "Tous"}</Chip>)}
      </div>
      {venues.loading ? <CardSkeleton rows={3} /> : venues.error ? <ErrorState description={venues.error} onRetry={venues.reload} /> :
        !venues.data?.length ? <EmptyState icon={<MapPin />} title="Aucun terrain dans ce rayon" description="Élargis la zone de recherche." /> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {venues.data.map((v) => (
              <Card key={v.id} interactive onClick={() => setVenue(v)} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{v.name}</p>
                    <p className="text-sm text-muted">{v.district} · {sportName(v.sport)}</p>
                  </div>
                  <Badge tone="primary">{v.distanceKm?.toLocaleString("fr-FR")} km</Badge>
                </div>
                <p className="mt-3 text-sm"><span className="font-semibold">{fcfa(v.pricePerHourFcfa)}</span> <span className="text-muted">/ heure</span></p>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}

function VenueBooking({ venue, onBack }: { venue: ApiVenue; onBack: () => void }) {
  const client = useApi();
  const { user, login } = useSession();
  const { busy, run } = useAction();
  const courts = useResource(() => client.courts(venue.id), [venue.id, client]);
  const [court, setCourt] = useState<ApiCourt | null>(null);
  const [day, setDay] = useState(nextDays(1)[0]);
  const [hours, setHours] = useState("1");
  const current = court ?? courts.data?.[0] ?? null;
  const slots = useResource(() => (current ? client.availability(current.id, isoDay(day)) : Promise.resolve([])), [current?.id, day.getTime(), client]);

  const book = async (startsAt: string) => {
    if (!user) return login();
    if (!current) return;
    const r = await run(startsAt, () => client.book({ courtId: current.id, startsAt, hours: Number(hours) }), "Créneau réservé (démo, sans paiement)");
    if (r) slots.reload();
  };

  return (
    <div className="space-y-4">
      <Button variant="link" onClick={onBack}>← Tous les terrains</Button>
      <div>
        <h2 className="font-display text-xl font-bold">{venue.name}</h2>
        <p className="text-sm text-muted">{venue.district} · {sportName(venue.sport)} · {fcfa(venue.pricePerHourFcfa)} / h</p>
      </div>
      {courts.loading ? <CardSkeleton rows={1} /> : courts.error ? <ErrorState description={courts.error} onRetry={courts.reload} /> : (
        <div className="flex flex-wrap gap-2">
          {courts.data?.map((c) => <Chip key={c.id} active={current?.id === c.id} onClick={() => setCourt(c)}>{c.name}</Chip>)}
        </div>
      )}
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {nextDays(10).map((d) => (
          <button key={d.getTime()} onClick={() => setDay(d)} className={cn("shrink-0 rounded-md border px-3 py-2 text-xs font-semibold", isoDay(d) === isoDay(day) ? "border-primary bg-primary/10" : "border-border")}>{dayLabel(d)}</button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm">Durée <Segmented size="sm" value={hours} onChange={setHours} options={[{ value: "1", label: "1 h" }, { value: "2", label: "2 h" }, { value: "3", label: "3 h" }]} /></div>
      {slots.loading ? <CardSkeleton rows={2} /> : slots.error ? <ErrorState description={slots.error} onRetry={slots.reload} /> : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {slots.data?.map((s) => (
            <Button key={s.startsAt} variant={s.available ? "outline" : "secondary"} disabled={!s.available} loading={busy === s.startsAt} onClick={() => book(s.startsAt)}>
              {hour(s.startsAt)}
            </Button>
          ))}
        </div>
      )}
      <p className="text-xs text-muted">Réservation de démonstration : aucun paiement n'est demandé. Heures affichées à l'heure de Dakar.</p>
    </div>
  );
}
