"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Calendar, Check, ChevronRight, Clock, Copy, Crown, Lock, MapPin, MessageCircle, Plus, Search, Send, Shuffle, Sparkles, Trophy, UserMinus, Users, Wallet } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { MobileHeader } from "@/components/shells/mobile-shell";
import { Avatar, AvatarStack, Badge, Button, Card, Chip, EmptyState, Field, Input, Modal, Progress, ScoreRing, Segmented, Select, Stepper, Tabs, Textarea } from "@/components/ui";
import { SportVisual } from "@/components/visual/sport-visual";
import { Photo } from "@/components/visual/photo";
import { play } from "@/lib/sound";
import { compatibility, ME, playerById, players } from "@/data/players";
import type { Level, Match, Player } from "@/data/types";
import { venueById, venues } from "@/data/venues";
import { useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import { cn, fcfa, uid } from "@/lib/utils";
import { dayText, MatchCard, SPORTS, sportEmoji, sportLabel } from "./shared";

export function MatchesList() {
  const { navigate } = useRouter();
  const { matches } = useStore();
  const [tab, setTab] = useState<"discover" | "mine" | "organized">("discover");
  const [sport, setSport] = useState<string | null>(null);
  const [when, setWhen] = useState<"all" | "today" | "tomorrow" | "week">("all");
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [q, setQ] = useState("");
  const list = useMemo(() => matches.filter((m) => {
    if (tab === "mine" && !m.participants.includes(ME)) return false;
    if (tab === "organized" && m.organizerId !== ME) return false;
    if (sport && m.sport !== sport) return false;
    if (when === "today" && m.dayOffset !== 0) return false;
    if (when === "tomorrow" && m.dayOffset !== 1) return false;
    if (tab === "discover" && onlyOpen && m.participants.length >= m.capacity) return false;
    if (q && !`${m.title} ${venueById(m.venueId).district}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a, b) => a.dayOffset - b.dayOffset || a.time.localeCompare(b.time)), [matches, tab, sport, when, onlyOpen, q]);

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-20 border-b border-border bg-bg/95 px-4 pt-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Matchs</h1>
          <Button size="sm" onClick={() => navigate("app-create-match")}><Plus className="h-4 w-4" />Créer</Button>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un match ou un quartier" aria-label="Rechercher un match" className="h-11 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm placeholder:text-muted focus:border-primary focus:outline-none" />
        </div>
        <Tabs className="mt-2 border-0" value={tab} onChange={setTab} tabs={[{ value: "discover", label: "Découvrir" }, { value: "mine", label: "Mes matchs", count: matches.filter((m) => m.participants.includes(ME)).length }, { value: "organized", label: "Organisés", count: matches.filter((m) => m.organizerId === ME).length }]} />
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        {(["all", "today", "tomorrow"] as const).map((w) => <Chip key={w} active={when === w} onClick={() => setWhen(w)}>{{ all: "Toutes dates", today: "Aujourd'hui", tomorrow: "Demain", week: "" }[w]}</Chip>)}
        <span className="mx-1 w-px shrink-0 bg-border" />
        {SPORTS.slice(0, 5).map((s) => <Chip key={s.key} active={sport === s.key} onClick={() => setSport(sport === s.key ? null : s.key)}>{s.emoji} {s.label}</Chip>)}
      </div>
      {tab === "discover" && (
        <label className="flex items-center gap-2 px-4 pb-2 text-xs text-muted"><input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} className="accent-[rgb(var(--primary))]" />Masquer les matchs complets</label>
      )}
      <div className="space-y-3 px-4">
        {list.length ? list.map((m) => <MatchCard key={m.id} m={m} />) : (
          <EmptyState icon={<Trophy />} title={tab === "organized" ? "Tu n’as encore rien organisé" : "Aucun match trouvé"} description={tab === "organized" ? "Publie un match en moins d’une minute." : "Change de date ou de sport, ou crée le tien."} action={<Button size="sm" onClick={() => navigate("app-create-match")}>Créer un match</Button>} />
        )}
      </div>
    </div>
  );
}

export function MatchDetail() {
  const { params, navigate, back } = useRouter();
  const { matches, joinMatch, leaveMatch, toast, pushNotification, celebrate, awardXp } = useStore();
  const m = matches.find((x) => x.id === params.id) ?? matches[0];
  const v = venueById(m.venueId);
  const joined = m.participants.includes(ME);
  const isOrg = m.organizerId === ME;
  const left = m.capacity - m.participants.length;
  const [confirm, setConfirm] = useState<null | "join" | "leave">(null);
  const [loading, setLoading] = useState(false);
  const share = `${sportEmoji(m.sport)} ${m.title}\n📍 ${v.name}\n🕖 ${dayText(m.dayOffset)} · ${m.time}\n👥 ${m.participants.length}/${m.capacity} joueurs\n💰 ${m.pricePerPlayer ? fcfa(m.pricePerPlayer) : "Gratuit"} par joueur\nIl reste ${left} place${left > 1 ? "s" : ""} ! Rejoins-nous sur SPORTMATCH.`;

  const doConfirm = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    if (confirm === "join") {
      joinMatch(m.id);
      celebrate("whistle");
      awardXp(50, "Match rejoint", "first-match");
      if (parseInt(m.time) >= 21) setTimeout(() => awardXp(20, "Match nocturne", "night-owl"), 900);
      toast({ title: "Place réservée 🎉", body: m.pricePerPlayer ? `Paiement de ${fcfa(m.pricePerPlayer)} simulé.` : "Match gratuit." });
      pushNotification({ kind: "match", title: "Tu participes à " + m.title, body: `${dayText(m.dayOffset)} · ${m.time}` });
    } else {
      leaveMatch(m.id);
      toast({ title: "Tu as quitté le match", body: "Ta place est proposée au 1er joueur de la liste d’attente.", tone: "info" });
    }
    setLoading(false);
    setConfirm(null);
  };

  return (
    <div className="pb-8">
      <div className="relative">
        <MobileHeader transparent onBack={back} />
        <Photo slot={`venue-${m.venueId}`} sport={m.sport} seed={Number(m.id.slice(1)) + 3} className="h-52" kenBurns />
        <div className="absolute bottom-4 left-5 right-5 text-white">
          <Badge className="bg-black/50 text-white backdrop-blur">{sportEmoji(m.sport)} {sportLabel(m.sport)} · {m.format}</Badge>
          <h1 className="mt-2 font-display text-2xl font-extrabold drop-shadow">{m.title}</h1>
        </div>
      </div>
      <div className="space-y-4 px-5 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3"><p className="flex items-center gap-1.5 text-2xs text-muted"><Calendar className="h-3.5 w-3.5" />Date</p><p className="mt-1 text-sm font-semibold capitalize">{dayText(m.dayOffset)} · {m.time}</p></Card>
          <Card className="p-3"><p className="flex items-center gap-1.5 text-2xs text-muted"><Clock className="h-3.5 w-3.5" />Durée</p><p className="mt-1 text-sm font-semibold">{m.durationMin} min</p></Card>
          <Card className="p-3"><p className="flex items-center gap-1.5 text-2xs text-muted"><Trophy className="h-3.5 w-3.5" />Niveau</p><p className="mt-1 text-sm font-semibold">{m.level}</p></Card>
          <Card className="p-3"><p className="flex items-center gap-1.5 text-2xs text-muted"><Wallet className="h-3.5 w-3.5" />Participation</p><p className="tabular mt-1 text-sm font-semibold">{m.pricePerPlayer ? fcfa(m.pricePerPlayer) : "Gratuit"}</p></Card>
        </div>

        <Card interactive onClick={() => navigate("app-venue", { id: v.id })} className="flex items-center gap-3 p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-2"><MapPin className="h-5 w-5 text-primary-ink" /></span>
          <div className="flex-1"><p className="text-sm font-semibold">{v.name}</p><p className="text-xs text-muted">{v.district} · {v.distanceKm} km · terrain réservé ✓</p></div>
          <ChevronRight className="h-4 w-4 text-muted" />
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Participants</p>
            <span className="tabular text-sm font-bold">{m.participants.length}<span className="text-muted">/{m.capacity}</span></span>
          </div>
          <Progress className="mt-3" value={m.participants.length} max={m.capacity} />
          <div className="mt-4 grid grid-cols-5 gap-y-3">
            {m.participants.map((id) => {
              const p = playerById(id);
              return (
                <button key={id} onClick={() => navigate("app-player", { id })} className="flex flex-col items-center gap-1">
                  <span className="relative"><Avatar name={p.name} size={40} />{id === m.organizerId && <Crown className="absolute -right-1 -top-1 h-4 w-4 fill-warning text-warning" />}</span>
                  <span className="w-full truncate text-center text-2xs">{id === ME ? "Toi" : p.name.split(" ")[0]}</span>
                </button>
              );
            })}
            {Array.from({ length: Math.max(0, left) }).map((_, i) => (
              <span key={i} className="flex flex-col items-center gap-1"><span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-border text-muted"><Plus className="h-4 w-4" /></span><span className="text-2xs text-muted">Libre</span></span>
            ))}
          </div>
          {m.pricePerPlayer > 0 && (
            <div className="mt-4 rounded-md bg-surface-2/70 p-3 text-xs">
              <div className="flex justify-between"><span className="font-semibold">Paiements collectés</span><span className="tabular">{m.paidCount}/{m.participants.length} · {fcfa(m.paidCount * m.pricePerPlayer)}</span></div>
              <Progress className="mt-2 h-1.5" tone="success" value={m.paidCount} max={m.participants.length} />
            </div>
          )}
        </Card>

        {m.description && <p className="text-sm text-muted">{m.description}</p>}

        {isOrg && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => navigate("app-smart-fill", { id: m.id })}><Sparkles className="h-4 w-4" />Smart Fill</Button>
            <Button variant="secondary" onClick={() => navigate("app-teams", { id: m.id })}><Shuffle className="h-4 w-4" />Équipes</Button>
          </div>
        )}

        <Card className="p-4">
          <p className="text-xs font-semibold text-muted">Partager sur WhatsApp</p>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-sm">{share}</pre>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="secondary" onClick={async () => { try { await navigator.clipboard.writeText(share); toast({ title: "Message copié" }); } catch { toast({ title: "Copie indisponible ici", tone: "error" }); } }}><Copy className="h-3.5 w-3.5" />Copier</Button>
            <Button size="sm" variant="ghost" onClick={() => navigate("app-messages")}><MessageCircle className="h-3.5 w-3.5" />Discussion du match</Button>
          </div>
        </Card>

        <div className="sticky bottom-3 pt-2">
          {joined ? (
            isOrg ? <Button block size="lg" variant="secondary" onClick={() => navigate("app-smart-fill", { id: m.id })}>Compléter l’équipe ({left} place{left > 1 ? "s" : ""})</Button>
              : <Button block size="lg" variant="outline" onClick={() => setConfirm("leave")}><UserMinus className="h-4 w-4" />Quitter le match</Button>
          ) : left > 0 ? (
            <Button block size="lg" onClick={() => setConfirm("join")}>Rejoindre · {m.pricePerPlayer ? fcfa(m.pricePerPlayer) : "Gratuit"}</Button>
          ) : (
            <Button block size="lg" variant="secondary" onClick={() => toast({ title: "Ajouté à la liste d’attente", body: "Tu seras prévenu si une place se libère." })}>Rejoindre la liste d’attente</Button>
          )}
        </div>
      </div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm === "join" ? "Confirmer ta participation" : "Quitter ce match ?"}
        description={confirm === "join" ? `${m.title} · ${dayText(m.dayOffset)} ${m.time}` : "Une annulation moins de 3 h avant le match réduit ton score de fiabilité."}
        footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Annuler</Button><Button variant={confirm === "leave" ? "danger" : "primary"} loading={loading} onClick={doConfirm}>{confirm === "join" ? `Payer ${m.pricePerPlayer ? fcfa(m.pricePerPlayer) : ""} et rejoindre` : "Quitter"}</Button></>}
      >
        {confirm === "join" && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Participation</span><span className="tabular">{fcfa(m.pricePerPlayer)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Moyen</span><span>Wave · 77 ••• 45 67</span></div>
            <p className="pt-2 text-xs text-muted">Simulation : aucun débit réel. Remboursement automatique si le match est annulé.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

const matchSchema = z.object({
  title: z.string().min(3, "Donne un nom à ton match (3 caractères min.)"),
  sport: z.string(),
  format: z.string(),
  venueId: z.string().min(1, "Choisis un terrain"),
  dayOffset: z.coerce.number(),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Heure invalide"),
  durationMin: z.coerce.number().min(30),
  level: z.string(),
  capacity: z.coerce.number().min(2).max(30),
  pricePerPlayer: z.coerce.number().min(0, "Montant invalide").max(50000, "Maximum 50 000 FCFA"),
  visibility: z.enum(["Public", "Privé"]),
  description: z.string().max(280).optional(),
});
type MatchForm = z.input<typeof matchSchema>;

const formats: Record<string, { label: string; capacity: number }[]> = {
  football: [{ label: "5 contre 5", capacity: 10 }, { label: "7 contre 7", capacity: 14 }, { label: "11 contre 11", capacity: 22 }],
  basketball: [{ label: "3 contre 3", capacity: 6 }, { label: "5 contre 5", capacity: 10 }],
  tennis: [{ label: "Simple", capacity: 2 }, { label: "Double", capacity: 4 }],
  padel: [{ label: "Double", capacity: 4 }],
  volley: [{ label: "6 contre 6", capacity: 12 }, { label: "Beach 2v2", capacity: 4 }],
  handball: [{ label: "7 contre 7", capacity: 14 }],
  running: [{ label: "Sortie 5 km", capacity: 20 }, { label: "Sortie 10 km", capacity: 30 }],
};

export function CreateMatch() {
  const { params, navigate, back } = useRouter();
  const { upsertMatch, toast, pushNotification, celebrate, awardXp } = useStore();
  const [step, setStep] = useState(0);
  const { register, handleSubmit, watch, setValue, trigger, formState: { errors, isSubmitting } } = useForm<MatchForm>({
    resolver: zodResolver(matchSchema),
    defaultValues: { title: "Five entre collègues", sport: "football", format: "5 contre 5", venueId: params.venueId ?? "v1", dayOffset: Number(params.dayOffset ?? 0), time: params.time ?? "19:00", durationMin: 60, level: "Intermédiaire", capacity: 10, pricePerPlayer: 3000, visibility: "Public", description: "" },
  });
  const w = watch();
  const venueOptions = venues.filter((v) => v.sports.includes(w.sport as never));
  const steps = ["Sport", "Quand & où", "Joueurs", "Publier"];

  const nextStep = async () => {
    const fields: (keyof MatchForm)[][] = [["sport", "format", "title"], ["venueId", "time", "durationMin"], ["capacity", "level", "pricePerPlayer"], []];
    if (await trigger(fields[step])) { play("kick"); setStep((s) => Math.min(3, s + 1)); } else play("error");
  };

  const onSubmit = async (data: MatchForm) => {
    await new Promise((r) => setTimeout(r, 800));
    const parsed = matchSchema.parse(data);
    const m: Match = { id: "m" + uid(), ...parsed, level: parsed.level as Level, sport: parsed.sport as Match["sport"], date: "", participants: [ME], organizerId: ME, paidCount: 1 };
    upsertMatch(m);
    pushNotification({ kind: "smartfill", title: "Smart Fill activé", body: `On cherche ${m.capacity - 1} joueurs pour ${m.title}.` });
    celebrate("whistle");
    awardXp(120, "Match publié", "organizer");
    toast({ title: "Match publié 🎉", body: "Partage-le ou laisse Smart Fill compléter l’équipe." });
    navigate("app-smart-fill", { id: m.id });
  };

  return (
    <div className="pb-8">
      <MobileHeader title="Créer un match" onBack={() => (step ? setStep(step - 1) : back())} />
      <div className="px-5 pt-4">
        <div className="flex gap-1.5">{steps.map((s, i) => <div key={s} className="flex-1"><div className={cn("h-1 rounded-full", i <= step ? "bg-primary" : "bg-border")} /><p className={cn("mt-1.5 text-2xs font-semibold", i === step ? "text-fg" : "text-muted")}>{s}</p></div>)}</div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 px-5 pt-5">
        {step === 0 && (
          <div className="space-y-5 animate-fade-up">
            <Field label="Sport">
              <div className="grid grid-cols-4 gap-2">
                {SPORTS.map((s) => (
                  <button type="button" key={s.key} aria-pressed={w.sport === s.key} onClick={() => { setValue("sport", s.key); setValue("format", formats[s.key][0].label); setValue("capacity", formats[s.key][0].capacity); const vv = venues.find((v) => v.sports.includes(s.key as never)); if (vv) setValue("venueId", vv.id); }} className={cn("flex flex-col items-center gap-1 rounded-lg border py-2.5 text-2xs font-semibold", w.sport === s.key ? "border-primary bg-primary/10" : "border-border bg-surface")}>
                    <span className="text-xl">{s.emoji}</span>{s.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Format">
              <div className="flex flex-wrap gap-2">{formats[w.sport ?? "football"].map((f) => <Chip key={f.label} active={w.format === f.label} onClick={() => { setValue("format", f.label); setValue("capacity", f.capacity); }}>{f.label}</Chip>)}</div>
            </Field>
            <Field label="Nom du match" error={errors.title?.message}><Input aria-invalid={!!errors.title} {...register("title")} /></Field>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-5 animate-fade-up">
            <Field label="Jour">
              <div className="grid grid-cols-4 gap-2">{Array.from(new Set([0, 1, 2, 3, Number(params.dayOffset ?? 0)])).sort((a, b) => a - b).slice(-4).map((d) => <button type="button" key={d} onClick={() => setValue("dayOffset", d)} className={cn("rounded-md border px-2 py-2.5 text-xs font-semibold capitalize", Number(w.dayOffset) === d ? "border-primary bg-primary/10" : "border-border")}>{dayText(d).split(" ").slice(0, 2).join(" ")}</button>)}</div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Heure" error={errors.time?.message}><Input type="time" step={1800} {...register("time")} /></Field>
              <Field label="Durée"><Select {...register("durationMin")}>{[60, 90, 120].map((d) => <option key={d} value={d}>{d} min</option>)}</Select></Field>
            </div>
            <Field label="Terrain" error={errors.venueId?.message}>
              <div className="space-y-2">
                {venueOptions.map((v) => (
                  <button type="button" key={v.id} onClick={() => setValue("venueId", v.id)} className={cn("flex w-full items-center gap-3 rounded-lg border p-3 text-left", w.venueId === v.id ? "border-primary bg-primary/10" : "border-border bg-surface")}>
                    <MapPin className="h-4 w-4 text-muted" />
                    <span className="flex-1"><span className="block text-sm font-semibold">{v.name}</span><span className="text-xs text-muted">{v.district} · {v.distanceKm} km</span></span>
                    <span className="tabular text-xs font-semibold">{fcfa(v.pricePerHour)}/h</span>
                  </button>
                ))}
                {!venueOptions.length && <p className="text-sm text-muted">Aucun terrain pour ce sport dans la démo.</p>}
              </div>
            </Field>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-5 animate-fade-up">
            <Card className="flex items-center justify-between p-4"><div><p className="text-sm font-semibold">Nombre de joueurs</p><p className="text-xs text-muted">Toi inclus</p></div><Stepper value={Number(w.capacity)} min={2} max={30} onChange={(n) => setValue("capacity", n)} /></Card>
            <Field label="Niveau requis"><Segmented className="flex w-full [&>button]:flex-1" size="sm" value={w.level as string} onChange={(l) => setValue("level", l)} options={["Débutant", "Intermédiaire", "Confirmé", "Expert"].map((l) => ({ value: l, label: l }))} /></Field>
            <Field label="Participation par joueur (FCFA)" error={errors.pricePerPlayer?.message} hint={`Coût terrain estimé : ${fcfa(venueById(w.venueId as string).pricePerHour * (Number(w.durationMin) / 60))} → ${fcfa(Math.ceil((venueById(w.venueId as string).pricePerHour * (Number(w.durationMin) / 60)) / Number(w.capacity)))} / joueur conseillé`}>
              <Input type="number" inputMode="numeric" aria-invalid={!!errors.pricePerPlayer} {...register("pricePerPlayer")} />
            </Field>
            <Field label="Visibilité"><Segmented value={w.visibility as "Public" | "Privé"} onChange={(v) => setValue("visibility", v)} options={[{ value: "Public", label: "Public" }, { value: "Privé", label: <span className="flex items-center gap-1"><Lock className="h-3 w-3" />Privé</span> }]} /></Field>
            <Field label="Message aux joueurs (optionnel)"><Textarea placeholder="Chasubles fournies, arrivée 15 min avant…" {...register("description")} /></Field>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4 animate-fade-up">
            <Card className="overflow-hidden">
              <SportVisual sport={w.sport as Match["sport"]} className="h-28" />
              <div className="space-y-2 p-4 text-sm">
                <p className="font-display text-lg font-bold">{w.title}</p>
                <p className="text-muted">{sportLabel(w.sport as string)} · {w.format} · {w.level}</p>
                <p><span className="capitalize">{dayText(Number(w.dayOffset))}</span> · {w.time} · {String(w.durationMin)} min</p>
                <p>{venueById(w.venueId as string).name}</p>
                <p className="tabular font-semibold">{String(w.capacity)} joueurs · {fcfa(Number(w.pricePerPlayer))} / joueur · {w.visibility}</p>
              </div>
            </Card>
            <Card className="flex items-start gap-3 border-primary/40 bg-primary/5 p-4">
              <Sparkles className="mt-0.5 h-5 w-5 text-primary-ink" />
              <div><p className="text-sm font-semibold">Smart Fill sera activé</p><p className="text-xs text-muted">Dès la publication, nous proposons ton match aux joueurs disponibles, proches et de niveau compatible.</p></div>
            </Card>
          </div>
        )}
        <div className="pt-2">
          {/* distinct keys: never reuse the "Continuer" DOM node as the submit button (prevents accidental double-submit) */}
          {step < 3 ? <Button key="next" type="button" block size="lg" onClick={nextStep}>Continuer <ArrowRight className="h-4 w-4" /></Button>
            : <Button key="submit" type="submit" block size="lg" loading={isSubmitting}>Publier le match</Button>}
        </div>
      </form>
    </div>
  );
}

export function SmartFill() {
  const { params, navigate, back } = useRouter();
  const { matches, joinMatch, toast, pushNotification, celebrate, awardXp } = useStore();
  const m = matches.find((x) => x.id === params.id) ?? matches[0];
  const left = m.capacity - m.participants.length;
  const [maxDist, setMaxDist] = useState(5);
  const wasOpen = useRef(left > 0);
  useEffect(() => {
    if (wasOpen.current && left === 0) {
      wasOpen.current = false;
      setTimeout(() => { celebrate("cheer"); awardXp(150, "Équipe complète", "full-house"); }, 400);
    }
  }, [left, celebrate, awardXp]);
  const [invited, setInvited] = useState<Record<string, "pending" | "accepted">>({});
  const [scanning, setScanning] = useState(true);
  useEffect(() => { const t = setTimeout(() => setScanning(false), 2200); return () => clearTimeout(t); }, []);

  const candidates = useMemo(() => players
    .filter((p) => !m.participants.includes(p.id) && p.distanceKm <= maxDist)
    .map((p) => ({ p, score: compatibility(p, m.sport, m.level) }))
    .sort((a, b) => b.score - a.score), [m, maxDist]);

  const invite = (p: Player) => {
    setInvited((s) => ({ ...s, [p.id]: "pending" }));
    play("kick");
    toast({ title: `Invitation envoyée à ${p.name.split(" ")[0]}`, tone: "info" });
    setTimeout(() => {
      play("notify");
      setInvited((s) => ({ ...s, [p.id]: "accepted" }));
      joinMatch(m.id, p.id);
      pushNotification({ kind: "smartfill", title: `${p.name} a accepté`, body: m.title });
      toast({ title: `${p.name.split(" ")[0]} a accepté ✅`, body: m.title });
    }, 1600 + Math.random() * 1200);
  };
  const autoFill = () => candidates.slice(0, left).forEach(({ p }, i) => setTimeout(() => invite(p), i * 250));

  return (
    <div className="pb-8">
      <MobileHeader title="Smart Fill" onBack={back} />
      <div className="space-y-4 p-4">
        <Card className="p-4">
          <p className="text-xs text-muted">{m.title} · {dayText(m.dayOffset)} {m.time}</p>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="tabular font-display text-4xl font-extrabold">{m.participants.length}<span className="text-xl text-muted">/{m.capacity}</span></p>
              <p className="text-sm text-muted">joueurs présents</p>
            </div>
            <div className="text-right">
              {left > 0 ? <Badge tone="warning">{left} place{left > 1 ? "s" : ""} restante{left > 1 ? "s" : ""}</Badge> : <Badge tone="success">Match complet ✓</Badge>}
              <div className="mt-2"><AvatarStack names={m.participants.map((id) => playerById(id).name)} max={6} /></div>
            </div>
          </div>
          <Progress className="mt-4" value={m.participants.length} max={m.capacity} tone={left ? "primary" : "success"} />
        </Card>

        <div className="flex items-center gap-3">
          <label className="flex-1 text-xs text-muted">Rayon : <span className="font-semibold text-fg">{maxDist} km</span><input type="range" min={1} max={6} value={maxDist} onChange={(e) => setMaxDist(+e.target.value)} className="mt-1 w-full accent-[rgb(var(--primary))]" /></label>
          <Button disabled={!left} onClick={autoFill}><Sparkles className="h-4 w-4" />Inviter les {Math.min(left, candidates.length)} meilleurs</Button>
        </div>

        <p className="text-2xs text-muted">Score = disponibilité 30 % · distance 25 % · niveau 20 % · sport & poste 15 % · fiabilité 10 %</p>

        {scanning ? (
          <Card className="flex flex-col items-center gap-4 overflow-hidden p-6">
            <div className="relative h-44 w-44">
              {[0, 1, 2].map((r) => <span key={r} className="absolute inset-0 rounded-full border border-primary/40" style={{ transform: `scale(${0.4 + r * 0.3})` }} />)}
              <span className="absolute inset-0 animate-ripple rounded-full border-2 border-primary/60" />
              <span className="absolute inset-0 animate-radar rounded-full bg-[conic-gradient(from_0deg,rgb(var(--primary)/.45),transparent_28%)]" />
              {[[22, 30], [70, 18], [80, 64], [30, 74], [56, 46], [14, 52]].map(([x, y], i) => (
                <span key={i} className="absolute h-2.5 w-2.5 animate-pop rounded-full bg-primary shadow-[0_0_12px_rgb(var(--primary))]" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${300 + i * 260}ms` }} />
              ))}
              <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-4 ring-primary/40" />
            </div>
            <p className="text-center text-sm">Recherche de joueurs compatibles autour de <b>{venueById(m.venueId).district}</b>…</p>
          </Card>
        ) : candidates.length === 0 ? (
          <EmptyState title="Aucun joueur dans ce rayon" description="Augmente le rayon de recherche." />
        ) : (
          <div className="space-y-2">
            {candidates.map(({ p, score }) => {
              const st = invited[p.id];
              return (
                <Card key={p.id} className="flex items-center gap-3 p-3">
                  <ScoreRing value={score} size={44} label="Compatibilité" />
                  <button onClick={() => navigate("app-player", { id: p.id })} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="truncate text-xs text-muted">{p.level} · {p.position} · {p.distanceKm} km</p>
                    <div className="mt-1 flex gap-1.5">
                      <Badge tone={p.availableTonight ? "success" : "neutral"} className="h-5">{p.availableTonight ? "Dispo" : "Peut-être"}</Badge>
                      <Badge tone={p.reliability >= 90 ? "primary" : "warning"} className="h-5">Fiabilité {p.reliability}</Badge>
                    </div>
                  </button>
                  {st === "accepted" ? <Badge tone="success"><Check />Accepté</Badge>
                    : st === "pending" ? <Badge tone="info" className="animate-pulse2">En attente</Badge>
                    : <Button size="sm" variant="secondary" disabled={!left} onClick={() => invite(p)}><Send className="h-3.5 w-3.5" />Inviter</Button>}
                </Card>
              );
            })}
          </div>
        )}
        {left === 0 && <Button block size="lg" onClick={() => navigate("app-teams", { id: m.id })}>Composer les équipes</Button>}
      </div>
    </div>
  );
}

export function Teams() {
  const { params, back } = useRouter();
  const { matches, toast } = useStore();
  const m = matches.find((x) => x.id === params.id) ?? matches[0];
  const [teams, setTeams] = useState<[string[], string[]]>(() => {
    const ids = [...m.participants];
    return [ids.filter((_, i) => i % 2 === 0), ids.filter((_, i) => i % 2 === 1)];
  });
  const levelScore = (ids: string[]) => Math.round(ids.reduce((s, id) => s + ["Débutant", "Intermédiaire", "Confirmé", "Expert"].indexOf(playerById(id).level) + 1, 0) / Math.max(1, ids.length) * 25);
  const balance = () => {
    const sorted = [...m.participants].sort((a, b) => levelScore([b]) - levelScore([a]));
    const A: string[] = [], B: string[] = [];
    sorted.forEach((id, i) => ((i % 4 === 0 || i % 4 === 3) ? A : B).push(id));
    setTeams([A, B]);
    toast({ title: "Équipes équilibrées par niveau" });
  };
  const move = (id: string, from: 0 | 1) => setTeams((t) => {
    const n: [string[], string[]] = [[...t[0]], [...t[1]]];
    n[from] = n[from].filter((x) => x !== id);
    n[from === 0 ? 1 : 0].push(id);
    return n;
  });
  return (
    <div className="pb-8">
      <MobileHeader title="Gestion des équipes" onBack={back} right={<Button size="sm" variant="secondary" onClick={balance}><Shuffle className="h-3.5 w-3.5" />Équilibrer</Button>} />
      <p className="px-4 pt-3 text-xs text-muted">Touche un joueur pour le changer d’équipe.</p>
      <div className="grid grid-cols-2 gap-3 p-4">
        {teams.map((team, ti) => (
          <Card key={ti} className={cn("p-3", ti === 0 ? "border-primary/40" : "border-info/40")}>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display font-bold">{ti === 0 ? "Chasubles" : "Maillots"}</p>
              <span className={cn("h-3 w-3 rounded-full", ti === 0 ? "bg-primary" : "bg-info")} />
            </div>
            <p className="mb-2 text-2xs text-muted">Niveau moyen <span className="tabular font-semibold text-fg">{levelScore(team)}</span> · {team.length} joueurs</p>
            <div className="space-y-1.5">
              {team.map((id) => {
                const p = playerById(id);
                return (
                  <button key={id} onClick={() => move(id, ti as 0 | 1)} className="flex w-full items-center gap-2 rounded-md p-1.5 text-left hover:bg-surface-2">
                    <Avatar name={p.name} size={26} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{id === ME ? "Toi" : p.name}</span><span className="block truncate text-2xs text-muted">{p.position}</span></span>
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
      <div className="px-4"><Button block onClick={() => toast({ title: "Équipes partagées aux joueurs" })}><Users className="h-4 w-4" />Valider et notifier</Button></div>
    </div>
  );
}
