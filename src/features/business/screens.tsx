"use client";
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, Check, CheckCircle2, Clock, Download, FileText, Plus, Star, Upload, Wallet, X } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/shells/console-shell";
import { Avatar, Badge, Button, Card, DataTable, Drawer, EmptyState, Field, Input, Modal, Progress, Rating, Select, Stat, Switch, Tabs, Textarea, type Column } from "@/components/ui";
import { useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import { cn, DAYS_FR, fcfa, nextDays, uid } from "@/lib/utils";
import { profiles, requestsFor, type BizKind, type BizProfile, type BizRequest } from "./profiles";

interface BizCtx { kind: BizKind; setKind: (k: BizKind) => void; profile: BizProfile; requests: BizRequest[]; setRequests: React.Dispatch<React.SetStateAction<BizRequest[]>>; services: BizProfile["services"]; setServices: React.Dispatch<React.SetStateAction<BizProfile["services"]>> }
export const BusinessContext = createContext<BizCtx | null>(null);
export const useBiz = () => useContext(BusinessContext)!;

const tooltipStyle = { background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: 8, fontSize: 12, color: "rgb(var(--fg))" };
const reqTone = (s: BizRequest["status"]) => (s === "Nouvelle" ? "info" : s === "Devis envoyé" ? "warning" : s === "Acceptée" ? "success" : "error") as "info";

export function KindSwitcher() {
  const { kind, setKind } = useBiz();
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-2">
      <span className="px-2 text-2xs font-semibold uppercase tracking-wider text-muted">Démo · voir en tant que</span>
      {(Object.keys(profiles) as BizKind[]).map((k) => { const P = profiles[k]; return (
        <button key={k} onClick={() => setKind(k)} aria-pressed={kind === k} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition", kind === k ? "bg-primary text-primary-fg" : "hover:bg-surface-2")}><P.icon className="h-3.5 w-3.5" />{P.label}</button>
      ); })}
    </div>
  );
}

const revenue = [{ m: "Juin", v: 1.2 }, { m: "Juil.", v: 1.6 }, { m: "Août", v: 1.4 }, { m: "Sept.", v: 2.1 }, { m: "Oct.", v: 2.6 }, { m: "Nov.", v: 2.9 }];

export function BizDashboard() {
  const { navigate } = useRouter();
  const { profile, requests } = useBiz();
  const pending = requests.filter((r) => r.status === "Nouvelle");
  const kpi = { stade: "78 %", arbitre: "14", transport: "42", traiteur: "1 860", securite: "96", medical: "11" }[profile.kind];
  return (
    <div>
      <KindSwitcher />
      <PageHeader eyebrow={profile.label} title={profile.company} subtitle={`Bonjour ${profile.owner.split(" ")[0]} · profil vérifié ✓`} actions={<><Button variant="outline" onClick={() => navigate("business-calendar")}><CalendarDays className="h-4 w-4" />{profile.calendarLabel}</Button><Button onClick={() => navigate("business-offer")}><Plus className="h-4 w-4" />Nouvelle offre</Button></>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Revenus du mois" value={fcfa(2900000)} delta={12} hint="vs octobre" />
        <Stat label={profile.kpiLabel} value={kpi} delta={6} />
        <Stat label="Demandes en attente" value={pending.length} hint="réponds sous 2 h" />
        <Stat label="Note moyenne" value="4,8 ★" hint="132 avis" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between"><p className="font-semibold">Revenus (millions FCFA)</p><button onClick={() => navigate("business-revenue")} className="text-sm font-semibold text-primary-ink">Détail</button></div>
          <div className="mt-4 h-56"><ResponsiveContainer><AreaChart data={revenue}><defs><linearGradient id="rv" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#B7F34A" stopOpacity={0.35} /><stop offset="1" stopColor="#B7F34A" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} stroke="rgb(var(--muted))" /><YAxis hide /><Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} M FCFA`, ""]} /><Area dataKey="v" stroke="#B7F34A" strokeWidth={2} fill="url(#rv)" /></AreaChart></ResponsiveContainer></div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between"><p className="font-semibold">Nouvelles demandes</p><button onClick={() => navigate("business-requests")} className="text-sm font-semibold text-primary-ink">Tout voir</button></div>
          <div className="mt-3 space-y-2">
            {pending.length ? pending.map((r) => (
              <button key={r.id} onClick={() => navigate("business-request", { id: r.id })} className="flex w-full items-center gap-3 rounded-md border border-border p-3 text-left hover:border-muted">
                <Avatar name={r.client} size={34} />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{r.detail}</span><span className="block truncate text-xs text-muted">{r.client} · {r.date}</span></span>
                {r.urgency && <Badge tone="error">Urgent</Badge>}
              </button>
            )) : <EmptyState title="Aucune nouvelle demande" description="Tu es à jour 👌" />}
          </div>
        </Card>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[{ l: profile.resourcesLabel, r: "business-team", v: `${profile.people.length} ressources` }, { l: profile.assetsLabel, r: "business-assets", v: `${profile.assets.length} éléments` }, { l: "Services publiés", r: "business-services", v: `${profile.services.filter((s) => s.active).length} actifs` }].map((x) => (
          <Card key={x.l} interactive onClick={() => navigate(x.r)} className="flex items-center justify-between p-4"><div><p className="font-semibold">{x.l}</p><p className="text-xs text-muted">{x.v}</p></div><ArrowRight className="h-4 w-4 text-muted" /></Card>
        ))}
      </div>
    </div>
  );
}

export function BizServices() {
  const { navigate } = useRouter();
  const { services, setServices, profile } = useBiz();
  const { toast } = useStore();
  return (
    <div>
      <PageHeader eyebrow={profile.label} title="Gestion des services" subtitle="Ce que les organisateurs voient dans la marketplace." actions={<Button onClick={() => navigate("business-offer")}><Plus className="h-4 w-4" />Créer une offre</Button>} />
      <div className="grid gap-4 md:grid-cols-2">
        {services.map((s) => (
          <Card key={s.id} className={cn("p-5", !s.active && "opacity-70")}>
            <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{s.name}</p><p className="text-sm text-muted">{s.detail}</p></div><Switch label={`Publier ${s.name}`} checked={s.active} onChange={(v) => { setServices((all) => all.map((x) => (x.id === s.id ? { ...x, active: v } : x))); toast({ title: v ? "Offre publiée" : "Offre masquée", tone: "info" }); }} /></div>
            <div className="mt-4 flex items-end justify-between"><p className="tabular font-display text-xl font-bold">{fcfa(s.price)}<span className="text-xs font-normal text-muted"> / {s.unit}</span></p><Badge tone={s.active ? "success" : "neutral"} dot>{s.active ? "En ligne" : "Masquée"}</Badge></div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function BizOffer() {
  const { navigate } = useRouter();
  const { setServices, profile } = useBiz();
  const { toast } = useStore();
  const [f, setF] = useState({ name: "", price: profile.services[0].price, unit: profile.services[0].unit, detail: "", min: 1 });
  const valid = f.name.length >= 3 && f.price > 0;
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow={profile.label} title="Créer une offre" subtitle="Elle sera visible après relecture automatique (simulée)." />
      <Card className="space-y-4 p-5">
        <Field label="Nom de l’offre" error={f.name && f.name.length < 3 ? "3 caractères minimum" : undefined}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={profile.services[0].name} /></Field>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Prix (FCFA)"><Input type="number" value={f.price} onChange={(e) => setF({ ...f, price: +e.target.value })} /></Field>
          <Field label="Unité"><Select value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })}>{Array.from(new Set(profile.services.map((s) => s.unit).concat(["heure", "jour"]))).map((u) => <option key={u}>{u}</option>)}</Select></Field>
          <Field label="Quantité minimum"><Input type="number" value={f.min} onChange={(e) => setF({ ...f, min: +e.target.value })} /></Field>
        </div>
        <Field label="Description"><Textarea value={f.detail} onChange={(e) => setF({ ...f, detail: e.target.value })} placeholder="Ce qui est inclus, conditions, zone couverte…" /></Field>
        <div className="flex items-center gap-3 rounded-md border border-dashed border-border p-4 text-sm text-muted"><Upload className="h-4 w-4" />Glisse des photos ici (optionnel)</div>
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => navigate("business-services")}>Annuler</Button><Button disabled={!valid} onClick={() => { setServices((s) => [...s, { id: uid(), name: f.name, price: f.price, unit: f.unit, active: true, detail: f.detail || "—" }]); toast({ title: "Offre publiée", body: f.name }); navigate("business-services"); }}>Publier l’offre</Button></div>
      </Card>
    </div>
  );
}

export function BizPricing() {
  const { services, setServices, profile } = useBiz();
  const { toast } = useStore();
  const [peak, setPeak] = useState(20);
  const [weekend, setWeekend] = useState(10);
  const [deposit, setDeposit] = useState(30);
  return (
    <div>
      <PageHeader eyebrow={profile.label} title="Gestion des tarifs" subtitle="Tarifs de base et règles de modulation." actions={<Button onClick={() => toast({ title: "Tarifs enregistrés" })}>Enregistrer</Button>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="divide-y divide-border">
          {services.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-[200px] flex-1"><p className="font-medium">{s.name}</p><p className="text-xs text-muted">par {s.unit}</p></div>
              <Input type="number" className="tabular w-36" value={s.price} onChange={(e) => setServices((all) => all.map((x) => (x.id === s.id ? { ...x, price: +e.target.value } : x)))} aria-label={`Prix ${s.name}`} />
              <div className="tabular w-40 text-right text-xs text-muted">Pointe : {fcfa(s.price * (1 + peak / 100))}</div>
            </div>
          ))}
        </Card>
        <Card className="space-y-5 p-5">
          <p className="font-semibold">Règles</p>
          <Field label={`Majoration heures de pointe : +${peak} %`}><input type="range" min={0} max={50} value={peak} onChange={(e) => setPeak(+e.target.value)} className="w-full accent-[rgb(var(--primary))]" /></Field>
          <Field label={`Majoration week-end : +${weekend} %`}><input type="range" min={0} max={50} value={weekend} onChange={(e) => setWeekend(+e.target.value)} className="w-full accent-[rgb(var(--primary))]" /></Field>
          <Field label={`Acompte demandé : ${deposit} %`}><input type="range" min={0} max={100} step={10} value={deposit} onChange={(e) => setDeposit(+e.target.value)} className="w-full accent-[rgb(var(--primary))]" /></Field>
          <p className="rounded-md bg-surface-2/60 p-3 text-xs text-muted">Commission SportMatch : 8 % par réservation (abonnement Venue Pro).</p>
        </Card>
      </div>
    </div>
  );
}

export function BizCalendar() {
  const { profile } = useBiz();
  const { toast } = useStore();
  const days = nextDays(7);
  const rows = profile.kind === "stade" ? profile.assets.slice(0, 3).map((a) => a.name) : profile.kind === "transport" ? profile.assets.map((a) => a.name.split(" · ")[0]) : profile.people.map((p) => p.name);
  const [blocked, setBlocked] = useState<Record<string, boolean>>({});
  const state = (r: number, d: number) => { const k = `${r}-${d}`; if (blocked[k]) return "blocked"; const v = (r * 7 + d * 3) % 5; return v === 0 ? "booked" : v === 1 ? "partial" : "free"; };
  return (
    <div>
      <PageHeader eyebrow={profile.label} title={`Calendrier · ${profile.calendarLabel}`} subtitle="Clique une case pour bloquer / débloquer une disponibilité." actions={<Button variant="outline" onClick={() => toast({ title: "Synchronisation Google Agenda simulée" })}>Synchroniser un agenda</Button>} />
      <Card className="scroll-thin overflow-x-auto p-4">
        <table className="w-full min-w-[720px] border-separate border-spacing-1.5 text-sm">
          <thead><tr><th className="w-44" />{days.map((d, i) => <th key={i} className="text-center text-xs font-semibold text-muted">{i === 0 ? "Auj." : DAYS_FR[d.getDay()]} <span className="tabular text-fg">{d.getDate()}</span></th>)}</tr></thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={r}><td className="pr-2 text-sm font-medium">{r}</td>
                {days.map((_, di) => { const s = state(ri, di); return (
                  <td key={di}><button onClick={() => { if (s === "booked") { toast({ title: "Créneau déjà réservé", body: "Ouvre la commande pour le modifier.", tone: "info" }); return; } setBlocked((b) => ({ ...b, [`${ri}-${di}`]: !b[`${ri}-${di}`] })); }} className={cn("h-14 w-full rounded-md border text-2xs font-semibold transition", s === "free" && "border-success/30 bg-success/10 text-success hover:bg-success/20", s === "partial" && "border-warning/30 bg-warning/10 text-warning", s === "booked" && "border-primary/40 bg-primary/20 text-primary-ink", s === "blocked" && "border-border bg-surface-2 text-muted line-through")}>{{ free: "Libre", partial: "Partiel", booked: "Réservé", blocked: "Bloqué" }[s]}</button></td>
                ); })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function BizTeam() {
  const { profile } = useBiz();
  const { toast } = useStore();
  const [people, setPeople] = useState(profile.people);
  return (
    <div>
      <PageHeader eyebrow={profile.label} title={profile.resourcesLabel} subtitle="Affecte tes ressources aux commandes confirmées." actions={<Button onClick={() => { setPeople((p) => [...p, { id: uid(), name: "Nouvelle ressource", role: "À compléter", status: "Disponible" }]); toast({ title: "Ressource ajoutée" }); }}><Plus className="h-4 w-4" />Ajouter</Button>} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {people.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="flex items-center gap-3"><Avatar name={p.name} size={44} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{p.name}</p><p className="truncate text-xs text-muted">{p.role}</p></div></div>
            <div className="mt-4 flex items-center justify-between">{p.cert ? <Badge tone="outline">{p.cert}</Badge> : <span />}<Select className="h-8 w-36 text-xs" value={p.status} onChange={(e) => setPeople((all) => all.map((x) => (x.id === p.id ? { ...x, status: e.target.value as "Disponible" } : x)))} aria-label="Statut"><option>Disponible</option><option>En mission</option><option>Repos</option></Select></div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function BizAssets() {
  const { profile } = useBiz();
  const { toast } = useStore();
  return (
    <div>
      <PageHeader eyebrow={profile.label} title={profile.assetsLabel} actions={<Button onClick={() => toast({ title: "Ajout simulé" })}><Plus className="h-4 w-4" />Ajouter</Button>} />
      <Card className="divide-y divide-border">
        {profile.assets.map((a) => (
          <div key={a.id} className="flex items-center gap-4 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-2"><profile.icon className="h-5 w-5 text-primary-ink" /></span>
            <div className="flex-1"><p className="font-medium">{a.name}</p><p className="text-xs text-muted">{a.meta}</p></div>
            <Badge tone={a.status === "Disponible" ? "success" : a.status === "Réservé" ? "primary" : "warning"} dot>{a.status}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function BizRequests() {
  const { navigate } = useRouter();
  const { requests } = useBiz();
  const [tab, setTab] = useState<"all" | BizRequest["status"]>("all");
  const list = requests.filter((r) => tab === "all" || r.status === tab);
  return (
    <div>
      <PageHeader title="Demandes de réservation" subtitle="Temps de réponse moyen : 1 h 12 · plus tu réponds vite, mieux tu es classé." />
      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ value: "all", label: "Toutes", count: requests.length }, { value: "Nouvelle", label: "Nouvelles", count: requests.filter((r) => r.status === "Nouvelle").length }, { value: "Devis envoyé", label: "Devis envoyés" }, { value: "Acceptée", label: "Acceptées" }, { value: "Refusée", label: "Refusées" }]} />
      {list.length ? (
        <div className="space-y-2">
          {list.map((r) => (
            <Card key={r.id} interactive onClick={() => navigate("business-request", { id: r.id })} className="flex flex-wrap items-center gap-4 p-4">
              <Avatar name={r.client} size={40} />
              <div className="min-w-[200px] flex-1"><p className="font-semibold">{r.detail}</p><p className="text-xs text-muted">{r.client} · {r.event} · {r.date}</p></div>
              <p className="tabular font-semibold">{fcfa(r.amount)}</p>
              {r.urgency && r.status === "Nouvelle" && <Badge tone="error">Urgent</Badge>}
              <Badge tone={reqTone(r.status)} dot>{r.status}</Badge>
            </Card>
          ))}
        </div>
      ) : <EmptyState title="Rien ici" description="Aucune demande avec ce statut." />}
    </div>
  );
}

export function BizRequestDetail() {
  const { params, navigate } = useRouter();
  const { requests, setRequests, profile } = useBiz();
  const { toast } = useStore();
  const r = requests.find((x) => x.id === params.id) ?? requests[0];
  const [refuse, setRefuse] = useState(false);
  const [reason, setReason] = useState("Indisponible à cette date");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quote, setQuote] = useState(r.amount);
  const update = (status: BizRequest["status"]) => setRequests((all) => all.map((x) => (x.id === r.id ? { ...x, status } : x)));
  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate("business-requests")} className="mb-4 flex items-center gap-1 text-sm text-muted hover:text-fg"><ArrowLeft className="h-4 w-4" />Demandes</button>
      <PageHeader eyebrow={`Demande #${r.id.toUpperCase()}`} title={r.detail} subtitle={`${r.event} · ${r.date}`} actions={<Badge tone={reqTone(r.status)} dot>{r.status}</Badge>} />
      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <Card className="space-y-4 p-5">
          <div className="flex items-center gap-3"><Avatar name={r.client} size={44} /><div><p className="font-semibold">{r.client}</p><p className="flex items-center gap-1 text-xs text-muted"><BadgeCheck className="h-3.5 w-3.5 text-primary-ink" />Organisateur vérifié · 12 événements · 4,9 ★</p></div></div>
          {[["Prestation", profile.label], ["Détail", r.detail], ["Date", r.date], ["Lieu", "Stade Municipal de Yoff (fictif)"], ["Participants", "160 personnes"], ["Message", "Bonjour, nous organisons un tournoi de 16 équipes. Pouvez-vous confirmer la disponibilité ? Merci."]].map(([k, v]) => <div key={k} className="grid grid-cols-[120px_1fr] gap-3 border-b border-border pb-3 text-sm last:border-0"><span className="text-muted">{k}</span><span>{v}</span></div>)}
        </Card>
        <Card className="h-fit space-y-3 p-5">
          <p className="text-xs text-muted">Montant estimé</p>
          <p className="tabular font-display text-2xl font-bold">{fcfa(r.amount)}</p>
          <p className="tabular text-xs text-muted">Net après commission 8 % : {fcfa(r.amount * 0.92)}</p>
          {r.status === "Nouvelle" && <p className="flex items-center gap-1.5 text-xs text-warning"><Clock className="h-3.5 w-3.5" />Réponds avant 1 h 48</p>}
          {(r.status === "Nouvelle" || r.status === "Devis envoyé") && (
            <div className="space-y-2 pt-2">
              <Button block onClick={() => { update("Acceptée"); toast({ title: "Demande acceptée", body: "La commande est confirmée. Le client est notifié." }); }}><Check className="h-4 w-4" />Accepter</Button>
              <Button block variant="secondary" onClick={() => setQuoteOpen(true)}><FileText className="h-4 w-4" />Envoyer un devis</Button>
              <Button block variant="ghost" onClick={() => setRefuse(true)}><X className="h-4 w-4" />Refuser</Button>
            </div>
          )}
          {r.status === "Acceptée" && <Button block variant="secondary" onClick={() => navigate("business-orders")}>Voir la commande</Button>}
        </Card>
      </div>
      <Modal open={refuse} onClose={() => setRefuse(false)} title="Refuser la demande" description="Le client verra le motif. Un refus fréquent réduit ton classement." footer={<><Button variant="ghost" onClick={() => setRefuse(false)}>Annuler</Button><Button variant="danger" onClick={() => { update("Refusée"); setRefuse(false); toast({ title: "Demande refusée", tone: "info" }); }}>Confirmer le refus</Button></>}>
        <Field label="Motif"><Select value={reason} onChange={(e) => setReason(e.target.value)}><option>Indisponible à cette date</option><option>Capacité insuffisante</option><option>Hors zone de service</option><option>Autre</option></Select></Field>
      </Modal>
      <Modal open={quoteOpen} onClose={() => setQuoteOpen(false)} title="Envoyer un devis" footer={<><Button variant="ghost" onClick={() => setQuoteOpen(false)}>Annuler</Button><Button onClick={() => { update("Devis envoyé"); setQuoteOpen(false); toast({ title: "Devis envoyé", body: fcfa(quote) }); }}>Envoyer</Button></>}>
        <div className="space-y-3"><Field label="Montant TTC (FCFA)"><Input type="number" value={quote} onChange={(e) => setQuote(+e.target.value)} /></Field><Field label="Validité"><Select><option>7 jours</option><option>15 jours</option></Select></Field><Field label="Conditions"><Textarea defaultValue="Acompte 30 % à la validation, solde J-2." /></Field></div>
      </Modal>
    </div>
  );
}

export function BizQuotes() {
  const { requests } = useBiz();
  const { toast } = useStore();
  const quotes = requests.map((r, i) => ({ id: r.id, client: r.client, ref: `DV-2026-${210 + i}`, amount: r.amount, status: r.status === "Acceptée" ? "Accepté" : r.status === "Devis envoyé" ? "Envoyé" : r.status === "Refusée" ? "Refusé" : "Brouillon", valid: "7 j" }));
  const cols: Column<(typeof quotes)[number]>[] = [
    { key: "ref", header: "Référence", render: (q) => <span className="font-mono text-xs">{q.ref}</span> },
    { key: "client", header: "Client", render: (q) => q.client },
    { key: "amount", header: "Montant", align: "right", sort: (q) => q.amount, render: (q) => fcfa(q.amount) },
    { key: "valid", header: "Validité", render: (q) => q.valid },
    { key: "status", header: "Statut", render: (q) => <Badge tone={q.status === "Accepté" ? "success" : q.status === "Envoyé" ? "warning" : q.status === "Refusé" ? "error" : "neutral"} dot>{q.status}</Badge> },
    { key: "a", header: "", render: () => <Button size="sm" variant="ghost" onClick={() => toast({ title: "Devis téléchargé (simulé)" })}><Download className="h-4 w-4" /></Button> },
  ];
  return <div><PageHeader title="Gestion des devis" /><DataTable columns={cols} rows={quotes} /></div>;
}

export function BizOrders() {
  const { requests, profile } = useBiz();
  const { toast } = useStore();
  const [assign, setAssign] = useState<BizRequest | null>(null);
  const orders = requests.filter((r) => r.status === "Acceptée");
  return (
    <div>
      <PageHeader title="Commandes confirmées" subtitle="Affecte les ressources et suis l’exécution." />
      {orders.length ? <div className="space-y-2">{orders.map((o) => (
        <Card key={o.id} className="flex flex-wrap items-center gap-4 p-4">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <div className="min-w-[200px] flex-1"><p className="font-semibold">{o.detail}</p><p className="text-xs text-muted">{o.client} · {o.date}</p></div>
          <p className="tabular font-semibold">{fcfa(o.amount)}</p>
          <Button size="sm" variant="secondary" onClick={() => setAssign(o)}>Affecter des ressources</Button>
        </Card>
      ))}</div> : <EmptyState title="Aucune commande confirmée" description="Accepte une demande pour la voir ici." />}
      <Drawer open={!!assign} onClose={() => setAssign(null)} title="Affectation" footer={<Button block onClick={() => { setAssign(null); toast({ title: "Ressources affectées", body: "Feuille de route envoyée (simulé)." }); }}>Confirmer l’affectation</Button>}>
        <p className="mb-3 text-sm text-muted">{assign?.detail}</p>
        <div className="space-y-2">{[...profile.people, ...profile.assets.map((a) => ({ id: a.id, name: a.name, role: a.meta, status: a.status }))].map((p) => <label key={p.id} className="flex items-center gap-3 rounded-md border border-border p-3 text-sm"><input type="checkbox" defaultChecked={p.status === "Disponible"} className="accent-[rgb(var(--primary))]" /><span className="flex-1"><span className="block font-medium">{p.name}</span><span className="text-xs text-muted">{p.role}</span></span><Badge tone={p.status === "Disponible" ? "success" : "neutral"}>{p.status}</Badge></label>)}</div>
      </Drawer>
    </div>
  );
}

export function BizInvoices() {
  const { toast } = useStore();
  const inv = [{ id: "FA-0412", c: "Dakar Sport Ensemble", a: 810000, s: "Payée", d: "10 nov." }, { id: "FA-0415", c: "Moussa Diop", a: 60000, s: "Payée", d: "14 nov." }, { id: "FA-0418", c: "Corporate Cup Plateau", a: 180000, s: "En attente", d: "15 nov." }, { id: "FA-0421", c: "Lycée Seydina Limamou", a: 120000, s: "En retard", d: "2 nov." }].map((x) => ({ ...x, id: x.id }));
  const cols: Column<(typeof inv)[number]>[] = [
    { key: "id", header: "N°", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "c", header: "Client", render: (r) => r.c },
    { key: "d", header: "Émise le", render: (r) => r.d },
    { key: "a", header: "Montant", align: "right", sort: (r) => r.a, render: (r) => fcfa(r.a) },
    { key: "s", header: "Statut", render: (r) => <Badge tone={r.s === "Payée" ? "success" : r.s === "En retard" ? "error" : "warning"} dot>{r.s}</Badge> },
    { key: "x", header: "", render: (r) => r.s === "Payée" ? <Button size="sm" variant="ghost" onClick={() => toast({ title: "PDF téléchargé (simulé)" })}><Download className="h-4 w-4" /></Button> : <Button size="sm" variant="secondary" onClick={() => toast({ title: "Relance envoyée", body: r.c })}>Relancer</Button> },
  ];
  return <div><PageHeader title="Factures" subtitle="Générées automatiquement à chaque commande." actions={<Button variant="outline" onClick={() => toast({ title: "Facture manuelle créée (simulé)" })}><Plus className="h-4 w-4" />Facture manuelle</Button>} /><DataTable columns={cols} rows={inv} /></div>;
}

export function BizRevenue() {
  const { toast } = useStore();
  return (
    <div>
      <PageHeader title="Paiements & revenus" actions={<Button onClick={() => toast({ title: "Virement de 1 840 000 FCFA demandé", body: "Réception sous 24–48 h (simulé)." })}><Wallet className="h-4 w-4" />Demander un virement</Button>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Solde disponible" value={fcfa(1840000)} />
        <Stat label="En attente (J+2)" value={fcfa(420000)} />
        <Stat label="Revenus 2026" value={fcfa(18600000)} delta={34} />
        <Stat label="Commissions payées" value={fcfa(1488000)} hint="8 %" />
      </div>
      <Card className="mt-6 p-5"><p className="font-semibold">Évolution (millions FCFA)</p><div className="mt-4 h-64"><ResponsiveContainer><AreaChart data={revenue}><XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} stroke="rgb(var(--muted))" /><YAxis tickLine={false} axisLine={false} fontSize={11} stroke="rgb(var(--muted))" width={30} /><Tooltip contentStyle={tooltipStyle} /><Area dataKey="v" stroke="#B7F34A" strokeWidth={2} fill="#B7F34A" fillOpacity={0.15} /></AreaChart></ResponsiveContainer></div></Card>
      <Card className="mt-6 divide-y divide-border">{[["Virement Wave Business", "12 nov.", 1200000], ["Virement bancaire CBAO (fictif)", "28 oct.", 2350000], ["Virement Wave Business", "14 oct.", 980000]].map(([l, d, a]) => <div key={d as string} className="flex justify-between p-4 text-sm"><span>{l}<span className="block text-xs text-muted">{d}</span></span><span className="tabular font-semibold">{fcfa(a as number)}</span></div>)}</Card>
    </div>
  );
}

export function BizReviews() {
  const { toast } = useStore();
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const reviews = [{ id: "rv1", n: "Aminata Sow", r: 5, t: "Ponctuels et très professionnels. Je recommande.", d: "il y a 2 j" }, { id: "rv2", n: "Moussa Diop", r: 4, t: "Bon service, petit retard au démarrage.", d: "il y a 1 sem." }, { id: "rv3", n: "Khady Mbaye", r: 5, t: "Parfait du début à la fin.", d: "il y a 3 sem." }];
  return (
    <div className="max-w-3xl">
      <PageHeader title="Avis clients" subtitle="4,8 ★ · 132 avis vérifiés" />
      <Card className="mb-5 grid grid-cols-[auto_1fr] items-center gap-6 p-5"><div className="text-center"><p className="font-display text-4xl font-extrabold">4,8</p><Rating value={4.8} /></div><div className="space-y-1.5">{[5, 4, 3, 2, 1].map((s, i) => <div key={s} className="flex items-center gap-2 text-xs"><span className="w-3">{s}</span><Progress className="h-1.5 flex-1" value={[78, 15, 5, 1, 1][i]} /><span className="tabular w-8 text-right text-muted">{[78, 15, 5, 1, 1][i]} %</span></div>)}</div></Card>
      <div className="space-y-3">
        {reviews.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-center gap-2"><Avatar name={r.n} size={30} /><span className="text-sm font-semibold">{r.n}</span><span className="flex">{Array.from({ length: r.r }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />)}</span><span className="ml-auto text-2xs text-muted">{r.d}</span></div>
            <p className="mt-2 text-sm">{r.t}</p>
            {replies[r.id] ? <p className="mt-3 rounded-md bg-surface-2/60 p-3 text-sm"><span className="font-semibold">Ta réponse : </span>{replies[r.id]}</p> : (
              <div className="mt-3 flex gap-2"><Input placeholder="Répondre publiquement…" value={draft[r.id] ?? ""} onChange={(e) => setDraft({ ...draft, [r.id]: e.target.value })} /><Button variant="secondary" disabled={!draft[r.id]} onClick={() => { setReplies({ ...replies, [r.id]: draft[r.id] }); toast({ title: "Réponse publiée" }); }}>Publier</Button></div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

export function BizSettings() {
  const { profile } = useBiz();
  const { toast } = useStore();
  const [instant, setInstant] = useState(false);
  return (
    <div className="max-w-2xl">
      <PageHeader title="Paramètres de l’entreprise" />
      <Card className="space-y-4 p-5">
        <Field label="Raison sociale"><Input defaultValue={profile.company} /></Field>
        <div className="grid gap-3 md:grid-cols-2"><Field label="NINEA (fictif)"><Input defaultValue="00987654 3A1" /></Field><Field label="RCCM (fictif)"><Input defaultValue="SN-DKR-2021-B-01234" /></Field></div>
        <Field label="Zone de service"><Select><option>Dakar et banlieue</option><option>Région de Dakar + Thiès</option><option>National</option></Select></Field>
        <div className="flex items-center justify-between rounded-md bg-surface-2/60 p-3"><span className="text-sm"><span className="block font-medium">Réservation instantanée</span><span className="text-xs text-muted">Accepter automatiquement les créneaux libres</span></span><Switch label="Réservation instantanée" checked={instant} onChange={setInstant} /></div>
        <Field label="Compte de versement"><Select><option>Wave Business · 77 ••• 12 34</option><option>Compte bancaire</option></Select></Field>
        <Button onClick={() => toast({ title: "Paramètres enregistrés" })}>Enregistrer</Button>
      </Card>
    </div>
  );
}

const obSteps = ["Compte", "Vérification", "Catégorie", "Profil"];
export function BizOnboarding() {
  const { navigate } = useRouter();
  const { setKind } = useBiz();
  const { toast } = useStore();
  const [step, setStep] = useState(0);
  const [cat, setCat] = useState<BizKind>("stade");
  const [docs, setDocs] = useState<string[]>([]);
  const [verifying, setVerifying] = useState(false);
  const verify = async () => { setVerifying(true); await new Promise((r) => setTimeout(r, 1400)); setVerifying(false); toast({ title: "Entreprise vérifiée (simulation)", body: "NINEA et RCCM conformes." }); setStep(2); };
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Devenir prestataire" title="Inscription professionnelle" subtitle="Rejoins la marketplace SportMatch en 4 étapes." />
      <div className="mb-6 grid grid-cols-4 gap-2">{obSteps.map((s, i) => <div key={s}><div className={cn("h-1 rounded-full", i <= step ? "bg-primary" : "bg-border")} /><p className={cn("mt-2 text-xs font-semibold", i === step ? "text-fg" : "text-muted")}>{i + 1}. {s}</p></div>)}</div>
      <Card className="p-6">
        <div key={step} className="animate-fade-up">
          {step === 0 && <div className="space-y-4"><Field label="Raison sociale"><Input defaultValue="Arena Almadies Five" /></Field><div className="grid gap-3 md:grid-cols-2"><Field label="Nom du responsable"><Input defaultValue="Ousmane Ndiaye" /></Field><Field label="Téléphone"><Input defaultValue="77 555 12 34" /></Field></div><Field label="E-mail professionnel"><Input defaultValue="contact@arena-almadies.example" /></Field></div>}
          {step === 1 && <div className="space-y-4"><p className="text-sm text-muted">Dépose tes justificatifs. Ils sont vérifiés par l’équipe SportMatch sous 24 h (instantané dans la démo).</p>{["NINEA", "Registre du commerce (RCCM)", "Attestation d’assurance RC", "Pièce d’identité du gérant"].map((d) => <button key={d} onClick={() => setDocs(docs.includes(d) ? docs : [...docs, d])} className={cn("flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm", docs.includes(d) ? "border-success/40 bg-success/5" : "border-dashed border-border")}>{docs.includes(d) ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Upload className="h-4 w-4 text-muted" />}<span className="flex-1">{d}</span><span className="text-xs text-muted">{docs.includes(d) ? "document.pdf" : "Déposer"}</span></button>)}</div>}
          {step === 2 && <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{(Object.keys(profiles) as BizKind[]).map((k) => { const P = profiles[k]; return <button key={k} onClick={() => setCat(k)} aria-pressed={cat === k} className={cn("flex flex-col gap-2 rounded-lg border p-4 text-left", cat === k ? "border-primary bg-primary/10" : "border-border")}><P.icon className="h-5 w-5 text-primary-ink" /><span className="text-sm font-semibold">{P.label}</span></button>; })}</div>}
          {step === 3 && <div className="space-y-4"><Field label="Présentation"><Textarea defaultValue={`${profiles[cat].label} professionnel à Dakar. Service fiable et réactif.`} /></Field><Field label="Zone d’intervention"><Select><option>Dakar et banlieue</option><option>Région de Dakar + Thiès</option></Select></Field><div className="flex items-center gap-3 rounded-md border border-dashed border-border p-4 text-sm text-muted"><Upload className="h-4 w-4" />Logo et photos</div></div>}
        </div>
        <div className="mt-6 flex justify-between">
          <Button variant="ghost" disabled={!step} onClick={() => setStep(step - 1)}>Précédent</Button>
          {step === 1 ? <Button loading={verifying} disabled={docs.length < 2} onClick={verify}>Vérifier l’entreprise ({docs.length}/4)</Button>
            : step < 3 ? <Button onClick={() => setStep(step + 1)}>Suivant</Button>
            : <Button onClick={() => { setKind(cat); toast({ title: "Profil professionnel créé 🎉" }); navigate("business-dashboard"); }}>Accéder à mon espace</Button>}
        </div>
      </Card>
    </div>
  );
}
