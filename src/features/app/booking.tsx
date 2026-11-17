"use client";
import { CalendarDays, Check, CheckCircle2, Clock, CreditCard, Download, Heart, Info, MapPin, Share2, ShieldCheck, Smartphone, Users, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { MobileHeader } from "@/components/shells/mobile-shell";
import { Avatar, Badge, Button, Card, DateStrip, Divider, Field, Input, Modal, MonthCalendar, Rating, Segmented, SlotGrid, Stepper, Verified, type Slot } from "@/components/ui";
import { SportVisual } from "@/components/visual/sport-visual";
import { playerById } from "@/data/players";
import { venueById } from "@/data/venues";
import { useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import { cn, dayLabel, fcfa } from "@/lib/utils";
import { sportLabel } from "./shared";

/** Deterministic mock availability for a venue/day/court. */
function slotsFor(venueId: string, date: Date, court: number, base: number, open: [number, number]): Slot[] {
  const seed = Number(venueId.slice(1)) * 7 + date.getDate() * 3 + court * 11;
  return Array.from({ length: open[1] - open[0] }, (_, i) => {
    const h = open[0] + i;
    const peak = h >= 18 && h <= 21;
    const now = new Date();
    const past = date.toDateString() === now.toDateString() && h <= now.getHours();
    const booked = past || (seed + h * 5) % 7 === 0 || (peak && (seed + h) % 3 === 0);
    return { time: `${String(h).padStart(2, "0")}:00`, status: booked ? "booked" : peak ? "peak" : "free", price: peak ? Math.round(base * 1.2) : base };
  });
}

export function VenueDetail() {
  const { params, navigate, back } = useRouter();
  const { toast } = useStore();
  const v = venueById(params.id ?? "v1");
  const [date, setDate] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [court, setCourt] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [fav, setFav] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const slots = useMemo(() => slotsFor(v.id, date, court, v.pricePerHour, v.openHours), [v, date, court]);
  const total = selected.reduce((s, t) => s + (slots.find((x) => x.time === t)?.price ?? 0), 0);

  const toggle = (t: string) => {
    setSelected((cur) => {
      if (cur.includes(t)) return cur.filter((x) => x !== t);
      const next = [...cur, t].sort();
      // keep selection contiguous: a booking is one continuous block
      const hours = next.map((x) => parseInt(x));
      const contiguous = hours.every((h, i) => i === 0 || h === hours[i - 1] + 1);
      if (!contiguous) {
        toast({ title: "Créneaux non consécutifs", body: "Une réservation doit être un bloc continu. Nouvelle sélection démarrée.", tone: "info" });
        return [t];
      }
      return next;
    });
  };

  const marks = Object.fromEntries(Array.from({ length: 31 }, (_, i) => [i + 1, (i * 7 + Number(v.id.slice(1))) % 5 === 0 ? "full" : (i % 3 === 0 ? "busy" : "free")])) as Record<number, "busy" | "free" | "full">;

  return (
    <div className="pb-28">
      <div className="relative">
        <MobileHeader transparent onBack={back} right={
          <div className="flex gap-2">
            <button aria-label="Partager" onClick={() => toast({ title: "Lien copié", body: "Partage-le sur WhatsApp." })} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"><Share2 className="h-4 w-4" /></button>
            <button aria-label="Ajouter aux favoris" aria-pressed={fav} onClick={() => setFav(!fav)} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"><Heart className={cn("h-4 w-4", fav && "fill-[#B7F34A] text-[#B7F34A]")} /></button>
          </div>
        } />
        <SportVisual sport={v.sports[0]} seed={Number(v.id.slice(1))} className="h-60" label={`Photo de ${v.name}`} />
        <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2 py-0.5 text-2xs text-white">1 / 8 photos</div>
      </div>

      <div className="px-5 pt-4">
        <div className="flex items-center gap-2">{v.verified && <Verified />}<Badge>{v.kind}</Badge></div>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight">{v.name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <Rating value={v.rating} count={v.reviews} className="text-fg" />
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{v.district} · {v.distanceKm} km</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[{ l: "Surface", v: v.surface }, { l: "Format", v: v.capacity }, { l: "Horaires", v: `${v.openHours[0]}h – ${v.openHours[1]}h` }].map((x) => (
            <div key={x.l} className="rounded-md bg-surface-2/70 p-2.5"><p className="text-2xs text-muted">{x.l}</p><p className="mt-0.5 text-xs font-semibold leading-tight">{x.v}</p></div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">{v.amenities.map((a) => <Badge key={a} tone="outline">{a}</Badge>)}</div>

        <Divider className="my-5" />

        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Disponibilités</h2>
          <button onClick={() => setCalOpen(true)} className="flex items-center gap-1 text-sm font-semibold text-primary-ink"><CalendarDays className="h-4 w-4" />Calendrier</button>
        </div>
        <div className="mt-3"><DateStrip value={date} onChange={(d) => { setDate(d); setSelected([]); }} /></div>
        {v.courts.length > 1 && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {v.courts.map((c, i) => <button key={c} onClick={() => { setCourt(i); setSelected([]); }} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold", court === i ? "border-fg bg-fg text-bg" : "border-border")}>{c}</button>)}
          </div>
        )}
        <div className="mt-4"><SlotGrid slots={slots} selected={selected} onToggle={toggle} /></div>
        <div className="mt-3 flex items-center gap-4 text-2xs text-muted">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" />Heure de pointe +20 %</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-border" />Réservé</span>
        </div>

        <Divider className="my-5" />
        <h2 className="font-display text-lg font-bold">Avis récents</h2>
        <div className="mt-3 space-y-3">
          {[{ n: "Awa Ndiaye", t: "Terrain impeccable, éclairage top pour les matchs du soir.", r: 5 }, { n: "Cheikh Ba", t: "Bon accueil, vestiaires propres. Parking un peu juste le week-end.", r: 4 }].map((r) => (
            <Card key={r.n} className="p-3">
              <div className="flex items-center gap-2"><Avatar name={r.n} size={28} /><span className="text-sm font-semibold">{r.n}</span><span className="ml-auto text-xs text-warning">{"★".repeat(r.r)}</span></div>
              <p className="mt-2 text-sm text-muted">{r.t}</p>
            </Card>
          ))}
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-md bg-surface-2/60 p-3 text-xs text-muted"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Annulation gratuite jusqu’à 24 h avant. Au-delà, l’acompte est conservé par l’établissement.</p>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 p-4 backdrop-blur" style={{ position: "sticky" }}>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            {selected.length ? (
              <>
                <p className="tabular font-display text-lg font-bold">{fcfa(total)}</p>
                <p className="text-xs text-muted">{dayLabel(date)} · {selected[0]} – {String(parseInt(selected[selected.length - 1]) + 1).padStart(2, "0")}:00</p>
              </>
            ) : (
              <>
                <p className="tabular font-display text-lg font-bold">{fcfa(v.pricePerHour)}<span className="text-xs font-normal text-muted"> /h</span></p>
                <p className="text-xs text-muted">Choisis un ou plusieurs créneaux</p>
              </>
            )}
          </div>
          <Button size="lg" disabled={!selected.length} onClick={() => navigate("app-booking", { id: v.id, date: date.toISOString(), slots: selected.join(","), court: v.courts[court], total: String(total) })}>Réserver</Button>
        </div>
      </div>

      <Modal open={calOpen} onClose={() => setCalOpen(false)} title="Calendrier des disponibilités" description="Point vert : créneaux libres · orange : chargé · rouge : complet">
        <MonthCalendar value={date} marks={marks} onChange={(d) => { setDate(d); setSelected([]); setCalOpen(false); }} />
      </Modal>
    </div>
  );
}

export function BookingSummary() {
  const { params, navigate, back } = useRouter();
  const v = venueById(params.id ?? "v1");
  const slots = (params.slots ?? "19:00").split(",");
  const date = params.date ? new Date(params.date) : new Date();
  const base = Number(params.total ?? v.pricePerHour);
  const [players, setPlayers] = useState(10);
  const [extras, setExtras] = useState<string[]>([]);
  const extraList = [{ k: "ballons", l: "Location de ballons", p: 2000 }, { k: "chasubles", l: "Chasubles (2 couleurs)", p: 3000 }, { k: "arbitre", l: "Arbitre (via SportMatch)", p: 15000 }, { k: "video", l: "Captation vidéo du match", p: 10000 }];
  const extrasTotal = extraList.filter((e) => extras.includes(e.k)).reduce((s, e) => s + e.p, 0);
  const fees = Math.round((base + extrasTotal) * 0.03);
  const total = base + extrasTotal + fees;
  return (
    <div className="pb-6">
      <MobileHeader title="Récapitulatif" onBack={back} />
      <div className="space-y-4 p-4">
        <Card className="flex gap-3 p-3">
          <SportVisual sport={v.sports[0]} seed={Number(v.id.slice(1))} className="h-16 w-16 shrink-0 rounded-md" />
          <div>
            <p className="font-semibold">{v.name}</p>
            <p className="text-xs text-muted">{params.court} · {sportLabel(v.sports[0])}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs"><Clock className="h-3.5 w-3.5 text-muted" />{dayLabel(date)} · {slots[0]} – {String(parseInt(slots[slots.length - 1]) + 1).padStart(2, "0")}:00 ({slots.length} h)</p>
          </div>
        </Card>

        <Card className="flex items-center justify-between p-4">
          <div><p className="text-sm font-semibold">Nombre de joueurs</p><p className="text-xs text-muted">Pour calculer la part de chacun</p></div>
          <Stepper value={players} onChange={setPlayers} min={2} max={22} />
        </Card>

        <Card className="p-4">
          <p className="text-sm font-semibold">Options</p>
          <div className="mt-3 space-y-2">
            {extraList.map((e) => {
              const on = extras.includes(e.k);
              return (
                <button key={e.k} aria-pressed={on} onClick={() => setExtras(on ? extras.filter((x) => x !== e.k) : [...extras, e.k])} className={cn("flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition", on ? "border-primary bg-primary/10" : "border-border")}>
                  <span className={cn("flex h-5 w-5 items-center justify-center rounded border", on ? "border-primary bg-primary text-primary-fg" : "border-border")}>{on && <Check className="h-3 w-3" />}</span>
                  <span className="flex-1">{e.l}</span>
                  <span className="tabular font-semibold">+{fcfa(e.p)}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-2 p-4 text-sm">
          <div className="flex justify-between"><span className="text-muted">Terrain ({slots.length} h)</span><span className="tabular">{fcfa(base)}</span></div>
          {extrasTotal > 0 && <div className="flex justify-between"><span className="text-muted">Options</span><span className="tabular">{fcfa(extrasTotal)}</span></div>}
          <div className="flex justify-between"><span className="text-muted">Frais de service (3 %)</span><span className="tabular">{fcfa(fees)}</span></div>
          <Divider />
          <div className="flex justify-between font-display text-lg font-bold"><span>Total</span><span className="tabular">{fcfa(total)}</span></div>
          <p className="tabular text-right text-xs text-primary-ink">soit {fcfa(Math.ceil(total / players))} par joueur</p>
        </Card>

        <Button block size="lg" onClick={() => navigate("app-payment", { ...params, total: String(total), players: String(players) })}>Continuer vers le paiement</Button>
      </div>
    </div>
  );
}

type PayMode = "full" | "deposit" | "split";
type Method = "wave" | "om" | "card";

export function Payment() {
  const { params, navigate, back } = useRouter();
  const { addBooking, pushNotification, toast } = useStore();
  const v = venueById(params.id ?? "v1");
  const total = Number(params.total ?? 30000);
  const players = Number(params.players ?? 10);
  const [mode, setMode] = useState<PayMode>("split");
  const [method, setMethod] = useState<Method>("wave");
  const [phone, setPhone] = useState("77 123 45 67");
  const [processing, setProcessing] = useState(false);
  const [failed, setFailed] = useState(false);
  const due = mode === "full" ? total : mode === "deposit" ? Math.round(total * 0.3) : Math.ceil(total / players);

  const pay = async (simulateFailure = false) => {
    setFailed(false);
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1400));
    setProcessing(false);
    if (simulateFailure) { setFailed(true); return; }
    const rec = addBooking({ kind: "terrain", title: `${v.name} · ${params.court ?? "Terrain A"}`, subtitle: `${sportLabel(v.sports[0])} · ${(params.slots ?? "").split(",").length} h`, dateLabel: `${dayLabel(new Date(params.date ?? Date.now()))} · ${(params.slots ?? "19:00").split(",")[0]}`, amount: total, status: "Confirmée", payment: mode === "full" ? "Intégral" : mode === "deposit" ? "Acompte" : "Partagé", paidRatio: due / total, sport: v.sports[0] });
    pushNotification({ kind: "booking", title: "Réservation confirmée", body: `${v.name} · ${rec.dateLabel}` });
    toast({ title: "Paiement simulé accepté", body: "Aucun débit réel n’a été effectué." });
    navigate("app-confirmation", { ...params, bookingId: rec.id, mode, due: String(due) });
  };

  const methods: { k: Method; l: string; d: string; icon: typeof Wallet }[] = [
    { k: "wave", l: "Wave", d: "Mobile Money", icon: Smartphone },
    { k: "om", l: "Orange Money", d: "Mobile Money", icon: Smartphone },
    { k: "card", l: "Carte bancaire", d: "Visa · Mastercard", icon: CreditCard },
  ];

  return (
    <div className="pb-6">
      <MobileHeader title="Paiement" onBack={back} />
      <div className="space-y-5 p-4">
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">Mode démonstration : aucun paiement réel ne sera effectué.</div>
        <section>
          <p className="mb-2 text-sm font-semibold">Comment veux-tu payer ?</p>
          <div className="space-y-2">
            {([
              { k: "split", l: "Paiement partagé", d: `Tu paies ta part, chaque joueur reçoit un lien · ${players} joueurs`, a: Math.ceil(total / players) },
              { k: "deposit", l: "Acompte 30 %", d: "Le solde est réglé sur place le jour J", a: Math.round(total * 0.3) },
              { k: "full", l: "Paiement intégral", d: "Tu règles la totalité maintenant", a: total },
            ] as const).map((o) => (
              <button key={o.k} role="radio" aria-checked={mode === o.k} onClick={() => setMode(o.k)} className={cn("flex w-full items-start gap-3 rounded-lg border p-3.5 text-left transition", mode === o.k ? "border-primary bg-primary/10" : "border-border bg-surface")}>
                <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", mode === o.k ? "border-primary" : "border-border")}>{mode === o.k && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}</span>
                <span className="flex-1"><span className="block text-sm font-semibold">{o.l}</span><span className="block text-xs text-muted">{o.d}</span></span>
                <span className="tabular text-sm font-bold">{fcfa(o.a)}</span>
              </button>
            ))}
          </div>
        </section>

        {mode === "split" && (
          <Card className="p-4">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold">Répartition</p><Badge tone="primary"><Users />{players} parts</Badge></div>
            <div className="mt-3 flex -space-x-2">{["p0", "p1", "p2", "p3", "p10", "p12", "p8", "p6"].slice(0, Math.min(players, 8)).map((id) => <Avatar key={id} name={playerById(id).name} size={30} ring />)}</div>
            <p className="mt-2 text-xs text-muted">Les joueurs ont 24 h pour régler. Tu es notifié à chaque paiement reçu.</p>
          </Card>
        )}

        <section>
          <p className="mb-2 text-sm font-semibold">Moyen de paiement</p>
          <div className="grid grid-cols-3 gap-2">
            {methods.map((m) => (
              <button key={m.k} aria-pressed={method === m.k} onClick={() => setMethod(m.k)} className={cn("flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition", method === m.k ? "border-primary bg-primary/10" : "border-border bg-surface")}>
                <m.icon className="h-5 w-5" />
                <span className="text-xs font-semibold">{m.l}</span>
                <span className="text-[10px] text-muted">{m.d}</span>
              </button>
            ))}
          </div>
          <div className="mt-3">
            {method === "card" ? (
              <div className="grid grid-cols-2 gap-2">
                <Field label="Numéro de carte" className="col-span-2"><Input placeholder="4242 4242 4242 4242" inputMode="numeric" /></Field>
                <Field label="Expiration"><Input placeholder="MM/AA" /></Field>
                <Field label="CVC"><Input placeholder="123" /></Field>
              </div>
            ) : (
              <Field label={`Numéro ${method === "wave" ? "Wave" : "Orange Money"}`}><Input value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Smartphone />} /></Field>
            )}
          </div>
        </section>

        {failed && <div role="alert" className="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">Le paiement a été refusé (simulation). Vérifie ton solde ou choisis un autre moyen.</div>}

        <Card className="flex items-center justify-between p-4">
          <div><p className="text-xs text-muted">À payer maintenant</p><p className="tabular font-display text-xl font-bold">{fcfa(due)}</p></div>
          <p className="flex items-center gap-1 text-2xs text-muted"><ShieldCheck className="h-3.5 w-3.5 text-success" />Paiement sécurisé</p>
        </Card>
        <Button block size="lg" loading={processing} onClick={() => pay(false)}>{processing ? "Traitement…" : `Payer ${fcfa(due)}`}</Button>
        <button onClick={() => pay(true)} className="block w-full text-center text-xs text-muted underline-offset-2 hover:underline">Simuler un échec de paiement</button>
      </div>
    </div>
  );
}

export function Confirmation() {
  const { params, navigate } = useRouter();
  const { toast } = useStore();
  const v = venueById(params.id ?? "v1");
  // Fallbacks keep the screen meaningful when opened directly from the guided tour.
  const total = Number(params.total ?? Math.round(v.pricePerHour * 1.03));
  const due = Number(params.due ?? Math.ceil(total / Number(params.players ?? 10)));
  const ref = `SM-${(params.bookingId ?? "demo").toUpperCase()}`;
  const message = `⚽ Match réservé !\n📍 ${v.name} (${v.district})\n🕖 ${dayLabel(new Date(params.date ?? Date.now()))} · ${(params.slots ?? "19:00").split(",")[0]}\n💰 ${fcfa(Math.ceil(total / Number(params.players ?? 10)))} par joueur\nPaie ta part sur SPORTMATCH (lien démo)`;
  return (
    <div className="flex min-h-full flex-col px-5 pb-8 pt-10">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 animate-fade-up">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-fg"><CheckCircle2 className="h-8 w-8" /></span>
      </div>
      <h1 className="mt-6 text-center font-display text-2xl font-extrabold">Réservation confirmée</h1>
      <p className="mt-1 text-center text-sm text-muted">Simulation · aucune réservation réelle</p>

      <Card className="mt-6 p-4">
        <div className="flex items-center justify-between"><p className="font-semibold">{v.name}</p><Badge tone="success" dot>Confirmée</Badge></div>
        <p className="mt-1 text-sm text-muted">{params.court ?? v.courts[0]} · {dayLabel(new Date(params.date ?? Date.now()))} · {(params.slots ?? "19:00").split(",")[0]}</p>
        <Divider className="my-3 border-dashed" />
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-2xs text-muted">Référence</p><p className="font-mono font-semibold">{ref}</p></div>
          <div><p className="text-2xs text-muted">Payé</p><p className="tabular font-semibold">{fcfa(due)} <span className="text-muted">/ {fcfa(total)}</span></p></div>
        </div>
        {(params.mode ?? "split") === "split" && (
          <div className="mt-4 rounded-md bg-surface-2/70 p-3">
            <div className="flex justify-between text-xs"><span className="font-semibold">Collecte des parts</span><span className="tabular text-muted">1 / {params.players ?? 10} payés</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"><div className="h-full bg-primary" style={{ width: `${100 / Number(params.players ?? 10)}%` }} /></div>
          </div>
        )}
      </Card>

      <Card className="mt-3 p-4">
        <p className="text-xs font-semibold text-muted">Message d’invitation WhatsApp</p>
        <pre className="mt-2 whitespace-pre-wrap font-sans text-sm">{message}</pre>
        <Button variant="secondary" size="sm" className="mt-3" onClick={async () => { try { await navigator.clipboard.writeText(message); toast({ title: "Message copié" }); } catch { toast({ title: "Copie impossible ici", body: "Sélectionne le texte manuellement.", tone: "error" }); } }}>Copier le message</Button>
      </Card>

      <div className="mt-auto grid gap-2 pt-6">
        <Button size="lg" onClick={() => { const d = new Date(params.date ?? Date.now()); d.setHours(0, 0, 0, 0); const t = new Date(); t.setHours(0, 0, 0, 0); navigate("app-create-match", { venueId: v.id, time: (params.slots ?? "19:00").split(",")[0], dayOffset: String(Math.max(0, Math.round((d.getTime() - t.getTime()) / 864e5))) }); }}>Créer le match sur ce créneau</Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => toast({ title: "Facture générée (PDF simulé)" })}><Download className="h-4 w-4" />Facture</Button>
          <Button variant="outline" onClick={() => navigate("app-bookings")}>Mes réservations</Button>
        </div>
      </div>
    </div>
  );
}
