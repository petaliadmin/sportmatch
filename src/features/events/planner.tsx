"use client";
import { ArrowLeft, ArrowRight, Check, RefreshCw, ShoppingCart, Sparkles, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shells/console-shell";
import { Badge, Button, Card, Field, Input, Progress, Rating, Select, Stepper, Verified } from "@/components/ui";
import { SportVisual } from "@/components/visual/sport-visual";
import { categories, categoryOf, providers } from "@/data/providers";
import type { Provider, ProviderCategory } from "@/data/types";
import { useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import { cn, fcfa } from "@/lib/utils";
import { SPORTS } from "../app/shared";
import { ProviderLogo } from "./marketplace";

/** Default quantity per service category for an event (used by the planner). */
export function plannedQty(cat: ProviderCategory, participants: number, teams: number) {
  const matches = Math.max(1, teams - 1);
  return { infrastructures: 9, arbitres: matches, transport: Math.ceil(participants / 30) * 2, medical: 2, securite: Math.max(2, Math.ceil(participants / 40)), restauration: participants, personnel: 4, materiel: 1, media: 1 }[cat];
}

export function EventPlanner() {
  const { navigate } = useRouter();
  const { event, setEvent, addToCart, toast } = useStore();
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [swap, setSwap] = useState<Record<string, number>>({});

  const selection = useMemo(() => event.services.map((cat) => {
    const options = providers.filter((p) => p.category === cat).sort((a, b) => b.rating - a.rating);
    const p = options[(swap[cat] ?? 0) % Math.max(1, options.length)];
    const qty = plannedQty(cat as ProviderCategory, event.participants, event.teams);
    return p ? { cat: cat as ProviderCategory, p, qty, total: p.price * qty * event.durationDays, alternatives: options.length } : null;
  }).filter(Boolean) as { cat: ProviderCategory; p: Provider; qty: number; total: number; alternatives: number }[], [event, swap]);

  const total = selection.reduce((s, x) => s + x.total, 0);
  const pct = (total / event.budget) * 100;

  const generate = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setGenerated(true);
  };
  const addAll = () => {
    selection.forEach((s) => addToCart(s.p, s.qty, event.durationDays));
    toast({ title: `${selection.length} services ajoutés au panier`, body: fcfa(total) });
    navigate("events-cart");
  };
  const toggleService = (k: string) => setEvent({ services: event.services.includes(k) ? event.services.filter((x) => x !== k) : [...event.services, k] });

  return (
    <div>
      <PageHeader eyebrow="Event Planner" title="Assistant de préparation" subtitle="Décris ton événement : on propose les prestataires et le budget global." />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="h-fit space-y-4 p-5 xl:sticky xl:top-24">
          <Field label="Nom de l’événement"><Input value={event.name} onChange={(e) => setEvent({ name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sport"><Select value={event.sport} onChange={(e) => setEvent({ sport: e.target.value })}>{SPORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</Select></Field>
            <Field label="Date"><Input type="date" value={event.date} onChange={(e) => setEvent({ date: e.target.value })} /></Field>
            <Field label="Durée (jours)"><Stepper value={event.durationDays} min={1} max={7} onChange={(n) => setEvent({ durationDays: n })} /></Field>
            <Field label="Équipes"><Stepper value={event.teams} min={2} max={64} step={2} onChange={(n) => setEvent({ teams: n, participants: n * 10 })} /></Field>
          </div>
          <Field label="Localisation"><Select value={event.location} onChange={(e) => setEvent({ location: e.target.value })}>{["Dakar · Yoff", "Dakar · Almadies", "Dakar · Mermoz", "Dakar · Plateau"].map((l) => <option key={l}>{l}</option>)}</Select></Field>
          <Field label={`Participants : ${event.participants}`}><input type="range" min={20} max={600} step={10} value={event.participants} onChange={(e) => setEvent({ participants: +e.target.value })} className="w-full accent-[rgb(var(--primary))]" /></Field>
          <Field label="Budget (FCFA)" hint={fcfa(event.budget)}><Input type="number" step={100000} value={event.budget} onChange={(e) => setEvent({ budget: Math.max(0, +e.target.value) })} /></Field>
          <Field label="Prestations recherchées">
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => {
                const on = event.services.includes(c.key);
                return <button key={c.key} type="button" aria-pressed={on} onClick={() => toggleService(c.key)} className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", on ? "border-primary bg-primary text-primary-fg" : "border-border")}><c.icon className="h-3.5 w-3.5" />{c.label}</button>;
              })}
            </div>
          </Field>
          <Button block size="lg" loading={loading} onClick={generate}><Sparkles className="h-4 w-4" />{generated ? "Recalculer la sélection" : "Générer ma sélection"}</Button>
        </Card>

        <div>
          {!generated ? (
            <Card className="overflow-hidden">
              <SportVisual sport={event.sport as "football"} className="h-56" />
              <div className="p-6">
                <p className="font-display text-xl font-bold">Ta sélection apparaîtra ici</p>
                <p className="mt-1 text-sm text-muted">Pour chaque prestation, l’assistant choisit le prestataire vérifié le mieux noté, calcule les quantités selon le nombre de participants et d’équipes, puis compare au budget.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[{ t: "Quantités auto", d: "Arbitres = nombre de matchs, agents ≈ 1 pour 40 pers." }, { t: "Budget en temps réel", d: "Alerte en cas de dépassement" }, { t: "Alternatives", d: "Remplace un prestataire en 1 clic" }].map((x) => <div key={x.t} className="rounded-md bg-surface-2/60 p-3"><p className="text-sm font-semibold">{x.t}</p><p className="text-xs text-muted">{x.d}</p></div>)}
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4 animate-fade-up">
              <Card className="grid gap-4 p-5 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-xs text-muted">Budget global estimé</p>
                  <p className="tabular font-display text-3xl font-extrabold">{fcfa(total)}</p>
                  <div className="mt-3 max-w-md">
                    <div className="flex justify-between text-xs"><span className="text-muted">sur {fcfa(event.budget)} prévus</span><span className={cn("tabular font-semibold", pct > 100 ? "text-error" : "text-success")}>{pct.toFixed(0)} %</span></div>
                    <Progress className="mt-1.5" value={Math.min(100, pct)} tone={pct > 100 ? "error" : pct > 85 ? "warning" : "success"} />
                  </div>
                  <p className="tabular mt-2 text-xs text-muted">≈ {fcfa(total / event.participants)} par participant · {event.teams} équipes · {event.durationDays} jours</p>
                </div>
                <div className="flex flex-col justify-end gap-2">
                  <Button size="lg" onClick={addAll}><ShoppingCart className="h-4 w-4" />Tout ajouter au panier</Button>
                  <Button variant="outline" onClick={() => navigate("events-marketplace")}>Personnaliser dans le catalogue</Button>
                </div>
              </Card>
              {pct > 100 && <Card className="border-error/40 bg-error/5 p-4 text-sm text-error">Dépassement de {fcfa(total - event.budget)}. Essaie une alternative moins chère ou réduis la durée.</Card>}
              <div className="grid gap-3 md:grid-cols-2">
                {selection.map((s) => (
                  <Card key={s.cat} className="p-4">
                    <div className="flex items-start gap-3">
                      <ProviderLogo p={s.p} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="text-2xs font-semibold uppercase tracking-wider text-muted">{categoryOf(s.cat).label}</p>
                        <p className="truncate font-semibold">{s.p.name}</p>
                        <div className="mt-0.5 flex items-center gap-2"><Rating value={s.p.rating} />{s.p.verified && <Verified />}</div>
                      </div>
                      <p className="tabular text-right font-display font-bold">{fcfa(s.total)}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted">
                      <span className="tabular">{s.qty} × {fcfa(s.p.price)}/{s.p.unit} × {event.durationDays} j</span>
                      {s.alternatives > 1 && <button onClick={() => setSwap((w) => ({ ...w, [s.cat]: (w[s.cat] ?? 0) + 1 }))} className="flex items-center gap-1 font-semibold text-primary-ink"><RefreshCw className="h-3 w-3" />Alternative ({s.alternatives - 1})</button>}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const steps = ["Informations", "Sport", "Tournoi", "Infrastructure"];

export function CreateEvent() {
  const { navigate } = useRouter();
  const { event, setEvent, addToCart, toast } = useStore();
  const [step, setStep] = useState(0);
  const [venue, setVenue] = useState("s2");
  const fields = [
    <div key={0} className="grid gap-4 md:grid-cols-2">
      <Field label="Nom de l’événement" className="md:col-span-2"><Input value={event.name} onChange={(e) => setEvent({ name: e.target.value })} /></Field>
      <Field label="Date de début"><Input type="date" value={event.date} onChange={(e) => setEvent({ date: e.target.value })} /></Field>
      <Field label="Durée"><Select value={event.durationDays} onChange={(e) => setEvent({ durationDays: +e.target.value })}>{[1, 2, 3, 4].map((d) => <option key={d} value={d}>{d} jour{d > 1 ? "s" : ""}</option>)}</Select></Field>
      <Field label="Lieu"><Input value={event.location} onChange={(e) => setEvent({ location: e.target.value })} /></Field>
      <Field label="Type d’événement"><Select><option>Tournoi amateur</option><option>Journée sportive d’entreprise</option><option>Match de gala</option><option>Stage / camp</option></Select></Field>
    </div>,
    <div key={1} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {SPORTS.map((s) => <button key={s.key} onClick={() => setEvent({ sport: s.key })} aria-pressed={event.sport === s.key} className={cn("relative overflow-hidden rounded-lg border text-left", event.sport === s.key ? "border-primary ring-1 ring-primary" : "border-border")}><SportVisual sport={s.key as "football"} className="h-20" /><span className="block p-2.5 text-sm font-semibold">{s.emoji} {s.label}</span>{event.sport === s.key && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-fg"><Check className="h-3.5 w-3.5" /></span>}</button>)}
    </div>,
    <div key={2} className="grid gap-4 md:grid-cols-2">
      <Field label="Format de compétition"><Select value={event.format} onChange={(e) => setEvent({ format: e.target.value })}><option>Poules + élimination directe</option><option>Élimination directe</option><option>Championnat (aller simple)</option></Select></Field>
      <Field label="Nombre d’équipes"><Stepper value={event.teams} min={4} max={64} step={2} onChange={(n) => setEvent({ teams: n, participants: n * 10 })} /></Field>
      <Field label="Joueurs par équipe"><Select><option>7 + 3 remplaçants</option><option>11 + 5 remplaçants</option><option>5 + 3 remplaçants</option></Select></Field>
      <Field label="Durée d’un match"><Select><option>2 × 20 min</option><option>2 × 30 min</option><option>2 × 45 min</option></Select></Field>
      <Field label="Frais d’inscription par équipe (FCFA)"><Input type="number" defaultValue={50000} /></Field>
      <Field label="Récompenses"><Input defaultValue="Trophée + 500 000 FCFA au vainqueur" /></Field>
      <Card className="flex items-center gap-3 p-4 md:col-span-2"><Trophy className="h-5 w-5 text-warning" /><p className="tabular text-sm"><b>{event.teams} équipes</b> · {event.format} → <b>{event.format.startsWith("Poules") ? event.teams * 1.5 + event.teams / 2 - 1 : event.teams - 1} matchs</b> estimés · {event.participants} participants</p></Card>
    </div>,
    <div key={3} className="grid gap-3 md:grid-cols-2">
      {providers.filter((p) => p.category === "infrastructures").map((p) => <button key={p.id} onClick={() => setVenue(p.id)} className={cn("flex gap-3 rounded-lg border p-3 text-left", venue === p.id ? "border-primary bg-primary/10" : "border-border bg-surface")}><SportVisual sport="football" seed={Number(p.id.slice(1))} className="h-20 w-24 shrink-0 rounded-md" /><span className="flex-1"><span className="block font-semibold">{p.name}</span><span className="block text-xs text-muted">{p.description}</span><span className="tabular mt-2 block text-sm font-bold">{fcfa(p.price)}/h</span></span></button>)}
    </div>,
  ];
  const finish = () => {
    const p = providers.find((x) => x.id === venue)!;
    addToCart(p, 9, event.durationDays);
    toast({ title: "Événement créé", body: `${p.name} ajouté au panier. Complète avec l’Event Planner.` });
    navigate("events-planner");
  };
  return (
    <div>
      <PageHeader eyebrow="Nouvel événement" title="Créer un événement" subtitle="4 étapes · enregistrement automatique (simulé)" />
      <div className="mb-6 grid grid-cols-4 gap-2">{steps.map((s, i) => <button key={s} onClick={() => setStep(i)} className="text-left"><div className={cn("h-1 rounded-full", i <= step ? "bg-primary" : "bg-border")} /><p className={cn("mt-2 text-xs font-semibold", i === step ? "text-fg" : "text-muted")}><span className="tabular">{i + 1}.</span> {s}</p></button>)}</div>
      <Card className="p-5 md:p-6"><div key={step} className="animate-fade-up">{fields[step]}</div></Card>
      <div className="mt-5 flex justify-between">
        <Button variant="ghost" disabled={!step} onClick={() => setStep(step - 1)}><ArrowLeft className="h-4 w-4" />Précédent</Button>
        {step < 3 ? <Button onClick={() => setStep(step + 1)}>Suivant<ArrowRight className="h-4 w-4" /></Button> : <Button onClick={finish}><Check className="h-4 w-4" />Créer et ajouter les services</Button>}
      </div>
      <Badge tone="outline" className="mt-4">Brouillon enregistré · il y a quelques secondes</Badge>
    </div>
  );
}
