"use client";
import { AlertTriangle, CalendarRange, Check, CheckCircle2, Clock, Download, FileText, Mail, Plus, Search, ShoppingCart, Sparkles, Upload, UserPlus, Users, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/shells/console-shell";
import { Avatar, Badge, Button, Card, DataTable, Drawer, EmptyState, Field, Input, Modal, Progress, Select, Stat, Switch, Tabs, Textarea, type Column } from "@/components/ui";
import { SportVisual } from "@/components/visual/sport-visual";
import { categories, categoryOf } from "@/data/providers";
import { useRouter } from "@/lib/router";
import { cartLineTotal, useStore } from "@/lib/store";
import { cn, compact, fcfa, uid } from "@/lib/utils";

const tooltipStyle = { background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: 8, fontSize: 12, color: "rgb(var(--fg))" };
const chartColors = ["#B7F34A", "#60A5FA", "#F59E0B", "#F472B6", "#34D399", "#A78BFA", "#FB7185", "#22D3EE", "#E5E7EB"];

const myEvents = [
  { id: "e1", name: "Tournoi Inter-Quartiers Dakar 2026", sport: "football" as const, date: "12–13 déc.", place: "Stade de Yoff", teams: 16, status: "Préparation", progress: 62 },
  { id: "e2", name: "Corporate Cup Plateau", sport: "football" as const, date: "24 janv.", place: "Complexe Mermoz", teams: 8, status: "Inscriptions", progress: 35 },
  { id: "e3", name: "Open Padel Ngor", sport: "padel" as const, date: "7 févr.", place: "Padel House Ngor", teams: 24, status: "Brouillon", progress: 10 },
  { id: "e4", name: "Dakar 3x3 Summer Jam", sport: "basketball" as const, date: "14 sept.", place: "City Court Ouakam", teams: 20, status: "Terminé", progress: 100 },
];

const registrations = [{ w: "S-6", v: 2 }, { w: "S-5", v: 5 }, { w: "S-4", v: 7 }, { w: "S-3", v: 10 }, { w: "S-2", v: 13 }, { w: "S-1", v: 15 }, { w: "Auj.", v: 16 }];

export function EventsDashboard() {
  const { navigate } = useRouter();
  const { cart, event } = useStore();
  const committed = cart.filter((c) => c.status === "Validé").reduce((s, c) => s + cartLineTotal(c), 0);
  const tasks = [
    { t: "Valider le devis sécurité", d: "Avant le 1er déc.", done: false, r: "events-quotes" },
    { t: "Confirmer 4 arbitres supplémentaires", d: "Avant le 5 déc.", done: false, r: "events-marketplace" },
    { t: "Publier le calendrier des poules", d: "Fait", done: true, r: "events-planning" },
    { t: "Relancer 3 équipes non payées", d: "Urgent", done: false, r: "events-payments" },
  ];
  return (
    <div>
      <PageHeader eyebrow="Bonjour Aminata" title="Dashboard organisateur" subtitle="Tout ce qui compte pour tes prochains événements." actions={<><Button variant="outline" onClick={() => navigate("events-planner")}><Sparkles className="h-4 w-4" />Event Planner</Button><Button onClick={() => navigate("events-create")}><Plus className="h-4 w-4" />Nouvel événement</Button></>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Événements actifs" value="3" hint="1 ce mois-ci" icon={<CalendarRange />} />
        <Stat label="Participants inscrits" value="412" delta={18} hint="vs mois dernier" icon={<Users />} />
        <Stat label="Budget engagé" value={compact(committed || 2140000) + " F"} hint={`sur ${compact(event.budget)} F`} icon={<Wallet />} />
        <Stat label="Paiements à collecter" value="3" hint="équipes en retard" icon={<AlertTriangle />} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-[260px_1fr]">
            <SportVisual sport="football" className="h-48 md:h-full" />
            <div className="p-5">
              <Badge tone="warning" dot>Dans 25 jours</Badge>
              <h2 className="mt-2 font-display text-xl font-bold">{event.name}</h2>
              <p className="text-sm text-muted">{event.location} · {event.teams} équipes · {event.participants} participants</p>
              <div className="mt-4 space-y-2">
                {[{ l: "Infrastructures", v: 100 }, { l: "Prestataires", v: cart.length ? Math.round((cart.filter((c) => c.status === "Validé").length / cart.length) * 100) : 40 }, { l: "Inscriptions", v: 100 }, { l: "Paiements équipes", v: 81 }].map((x) => (
                  <div key={x.l}><div className="flex justify-between text-xs"><span className="text-muted">{x.l}</span><span className="tabular font-semibold">{x.v} %</span></div><Progress className="mt-1 h-1.5" value={x.v} tone={x.v === 100 ? "success" : "primary"} /></div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => navigate("events-planning")}>Planning</Button><Button size="sm" variant="secondary" onClick={() => navigate("events-cart")}><ShoppingCart className="h-3.5 w-3.5" />Panier ({cart.length})</Button><Button size="sm" variant="ghost" onClick={() => navigate("events-budget")}>Budget</Button></div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <p className="font-semibold">À faire</p>
          <div className="mt-3 space-y-1">
            {tasks.map((t) => (
              <button key={t.t} onClick={() => navigate(t.r)} className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-surface-2">
                <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border", t.done ? "border-success bg-success text-white" : "border-border")}>{t.done && <Check className="h-3 w-3" />}</span>
                <span className={cn("flex-1 text-sm", t.done && "text-muted line-through")}>{t.t}</span>
                <span className={cn("text-2xs", t.d === "Urgent" ? "font-semibold text-error" : "text-muted")}>{t.d}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <p className="font-semibold">Inscriptions d’équipes</p>
          <p className="text-xs text-muted">Tournoi Inter-Quartiers · cumul hebdomadaire</p>
          <div className="mt-4 h-48"><ResponsiveContainer><AreaChart data={registrations}><defs><linearGradient id="reg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#B7F34A" stopOpacity={0.35} /><stop offset="1" stopColor="#B7F34A" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="w" tickLine={false} axisLine={false} fontSize={11} stroke="rgb(var(--muted))" /><YAxis hide /><Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} équipes`, ""]} /><Area dataKey="v" stroke="#B7F34A" strokeWidth={2} fill="url(#reg)" /></AreaChart></ResponsiveContainer></div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between"><p className="font-semibold">Mes événements</p><button onClick={() => navigate("events-list")} className="text-sm font-semibold text-primary-ink">Tout voir</button></div>
          <div className="mt-3 divide-y divide-border">
            {myEvents.map((e) => <button key={e.id} onClick={() => navigate("events-list")} className="flex w-full items-center gap-3 py-2.5 text-left"><SportVisual sport={e.sport} className="h-10 w-10 shrink-0 rounded-md" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{e.name}</span><span className="text-xs text-muted">{e.date} · {e.place}</span></span><Badge tone={e.status === "Terminé" ? "neutral" : e.status === "Brouillon" ? "outline" : "primary"}>{e.status}</Badge></button>)}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function EventsList() {
  const { navigate } = useRouter();
  const [tab, setTab] = useState<"active" | "past">("active");
  const list = myEvents.filter((e) => (tab === "active" ? e.status !== "Terminé" : e.status === "Terminé"));
  return (
    <div>
      <PageHeader title="Mes événements" actions={<Button onClick={() => navigate("events-create")}><Plus className="h-4 w-4" />Nouvel événement</Button>} />
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ value: "active", label: "En cours", count: 3 }, { value: "past", label: "Terminés", count: 1 }]} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((e) => (
          <Card key={e.id} interactive onClick={() => navigate(e.status === "Terminé" ? "events-report" : "events-dashboard")} className="overflow-hidden">
            <SportVisual sport={e.sport} seed={Number(e.id.slice(1))} className="h-32" />
            <div className="p-4">
              <div className="flex items-center justify-between"><Badge tone={e.status === "Terminé" ? "neutral" : "primary"}>{e.status}</Badge><span className="text-xs text-muted">{e.date}</span></div>
              <p className="mt-2 font-semibold">{e.name}</p>
              <p className="text-xs text-muted">{e.place} · {e.teams} équipes</p>
              <Progress className="mt-3 h-1.5" value={e.progress} tone={e.progress === 100 ? "success" : "primary"} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

const planning = [
  { time: "07:00", t: "Arrivée équipe sécurité & montage", who: "Garde Atlantique", cat: "securite", day: 1 },
  { time: "07:30", t: "Navettes aller (Parcelles → Yoff)", who: "Teranga Minibus", cat: "transport", day: 1 },
  { time: "08:00", t: "Ouverture poste médical", who: "SOS Secours Sport", cat: "medical", day: 1 },
  { time: "08:30", t: "Cérémonie d’ouverture", who: "Organisation", cat: "personnel", day: 1 },
  { time: "09:00", t: "Phase de poules · Matchs 1–8", who: "Arbitres Ligue Cap-Vert", cat: "arbitres", day: 1 },
  { time: "12:30", t: "Déjeuner participants (160 couverts)", who: "Saveurs de la Teranga", cat: "restauration", day: 1 },
  { time: "14:00", t: "Phase de poules · Matchs 9–16", who: "Arbitres Ligue Cap-Vert", cat: "arbitres", day: 1 },
  { time: "18:00", t: "Navettes retour", who: "Teranga Minibus", cat: "transport", day: 1 },
  { time: "09:00", t: "Quarts de finale", who: "Arbitres Ligue Cap-Vert", cat: "arbitres", day: 2 },
  { time: "13:00", t: "Demi-finales", who: "Arbitres Ligue Cap-Vert", cat: "arbitres", day: 2 },
  { time: "16:30", t: "Finale (captation vidéo + drone)", who: "Studio Lumière Sport", cat: "media", day: 2 },
  { time: "18:00", t: "Remise des trophées", who: "Organisation", cat: "personnel", day: 2 },
];

export function Planning() {
  const [day, setDay] = useState<"1" | "2">("1");
  const { toast } = useStore();
  return (
    <div>
      <PageHeader eyebrow="Tournoi Inter-Quartiers" title="Planning opérationnel" subtitle="Qui fait quoi, quand. Les prestataires reçoivent leur feuille de route." actions={<><Button variant="outline" onClick={() => toast({ title: "Feuilles de route envoyées à 7 prestataires (simulé)" })}><Mail className="h-4 w-4" />Envoyer aux prestataires</Button><Button variant="secondary" onClick={() => toast({ title: "Planning exporté (PDF simulé)" })}><Download className="h-4 w-4" />Exporter</Button></>} />
      <Tabs className="mb-5" value={day} onChange={setDay} tabs={[{ value: "1", label: "Samedi 12 déc." }, { value: "2", label: "Dimanche 13 déc." }]} />
      <div className="relative space-y-2 before:absolute before:bottom-4 before:left-[68px] before:top-4 before:w-px before:bg-border">
        {planning.filter((p) => String(p.day) === day).map((p, i) => {
          const c = categoryOf(p.cat as "securite");
          return (
            <div key={i} className="relative flex items-center gap-4">
              <span className="tabular w-12 shrink-0 text-right text-sm font-semibold">{p.time}</span>
              <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface"><c.icon className="h-4 w-4 text-primary-ink" /></span>
              <Card className="flex flex-1 items-center justify-between gap-3 p-3"><div><p className="text-sm font-semibold">{p.t}</p><p className="text-xs text-muted">{p.who}</p></div><Badge tone="success" dot>Confirmé</Badge></Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface Participant { id: string; name: string; team: string; role: string; paid: boolean; license: boolean; phone: string }
const teamsList = ["ASC Mermoz", "Ouakam United", "Almadies FC", "Yoff Stars", "Liberté 6 Lions", "Point E Juniors", "Ngor Surfers FC", "Plateau City"];
const firstNames = ["Mamadou", "Aliou", "Fatou", "Saliou", "Awa", "Babacar", "Ndeye", "Modou", "Khadija", "Omar", "Rokhaya", "Serigne"];
const lastNames = ["Diop", "Ndiaye", "Fall", "Sarr", "Ba", "Sow", "Gueye", "Faye", "Cissé", "Kane", "Mbaye", "Thiam"];
const seedParticipants: Participant[] = Array.from({ length: 48 }, (_, i) => ({ id: "x" + i, name: `${firstNames[i % 12]} ${lastNames[(i * 5) % 12]}`, team: teamsList[i % 8], role: i % 8 === 0 ? "Capitaine" : "Joueur", paid: i % 7 !== 3, license: i % 9 !== 4, phone: `77 ${100 + i} ${10 + (i % 80)} ${20 + (i % 70)}` }));

export function Participants() {
  const { toast } = useStore();
  const [rows, setRows] = useState(seedParticipants);
  const [q, setQ] = useState("");
  const [team, setTeam] = useState("all");
  const [status, setStatus] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", team: teamsList[0], phone: "" });
  const filtered = useMemo(() => rows.filter((r) => (team === "all" || r.team === team) && (status === "all" || (status === "unpaid" ? !r.paid : !r.license)) && (!q || r.name.toLowerCase().includes(q.toLowerCase()))), [rows, q, team, status]);
  const cols: Column<Participant>[] = [
    { key: "name", header: "Participant", sort: (r) => r.name, render: (r) => <span className="flex items-center gap-2.5"><Avatar name={r.name} size={28} /><span className="font-medium">{r.name}</span></span> },
    { key: "team", header: "Équipe", sort: (r) => r.team, render: (r) => r.team },
    { key: "role", header: "Rôle", render: (r) => <Badge tone={r.role === "Capitaine" ? "warning" : "neutral"}>{r.role}</Badge> },
    { key: "phone", header: "Téléphone", render: (r) => <span className="tabular text-muted">{r.phone}</span> },
    { key: "license", header: "Licence", render: (r) => (r.license ? <Badge tone="success" dot>Valide</Badge> : <Badge tone="error" dot>Manquante</Badge>) },
    { key: "paid", header: "Paiement", sort: (r) => Number(r.paid), render: (r) => (r.paid ? <Badge tone="success">Payé</Badge> : <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setRows((all) => all.map((x) => (x.id === r.id ? { ...x, paid: true } : x))); toast({ title: `Paiement de ${r.name} marqué reçu` }); }}>Marquer payé</Button>) },
  ];
  return (
    <div>
      <PageHeader eyebrow="Tournoi Inter-Quartiers" title="Gestion des participants" subtitle={`${rows.length} inscrits · ${rows.filter((r) => !r.paid).length} paiements en attente · ${rows.filter((r) => !r.license).length} licences manquantes`} actions={<><Button variant="outline" onClick={() => toast({ title: "Import CSV simulé : 0 doublon" })}><Upload className="h-4 w-4" />Importer</Button><Button variant="outline" onClick={() => toast({ title: `Relance envoyée à ${rows.filter((r) => !r.paid).length} participants` })}><Mail className="h-4 w-4" />Relancer les impayés</Button><Button onClick={() => setAddOpen(true)}><UserPlus className="h-4 w-4" />Ajouter</Button></>} />
      <div className="mb-4 flex flex-col gap-2 md:flex-row">
        <div className="flex-1"><Input icon={<Search />} placeholder="Rechercher un participant" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select className="md:w-52" value={team} onChange={(e) => setTeam(e.target.value)} aria-label="Équipe"><option value="all">Toutes les équipes</option>{teamsList.map((t) => <option key={t}>{t}</option>)}</Select>
        <Select className="md:w-52" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Statut"><option value="all">Tous les statuts</option><option value="unpaid">Paiement en attente</option><option value="license">Licence manquante</option></Select>
      </div>
      <DataTable columns={cols} rows={filtered} empty={<EmptyState title="Aucun participant" description="Modifie les filtres." />} />
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Ajouter un participant" footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Annuler</Button><Button disabled={form.name.length < 2} onClick={() => { setRows((r) => [{ id: uid(), name: form.name, team: form.team, role: "Joueur", paid: false, license: false, phone: form.phone || "—" }, ...r]); setAddOpen(false); setForm({ name: "", team: teamsList[0], phone: "" }); toast({ title: "Participant ajouté", body: "Lien de paiement envoyé (simulé)." }); }}>Ajouter</Button></>}>
        <div className="space-y-3">
          <Field label="Nom complet"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex. Aliou Sarr" /></Field>
          <Field label="Équipe"><Select value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })}>{teamsList.map((t) => <option key={t}>{t}</option>)}</Select></Field>
          <Field label="Téléphone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="77 000 00 00" /></Field>
        </div>
      </Modal>
    </div>
  );
}

export function EventTeams() {
  const { toast } = useStore();
  const [groups, setGroups] = useState<string[][]>([teamsList.slice(0, 4), teamsList.slice(4, 8)]);
  const shuffle = () => { const all = [...teamsList].sort(() => Math.random() - 0.5); setGroups([all.slice(0, 4), all.slice(4)]); toast({ title: "Tirage au sort effectué" }); };
  return (
    <div>
      <PageHeader eyebrow="Tournoi Inter-Quartiers" title="Gestion des équipes" subtitle="8 équipes affichées (démo) · tirage des poules" actions={<Button onClick={shuffle}><Sparkles className="h-4 w-4" />Tirer au sort les poules</Button>} />
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((g, gi) => (
          <Card key={gi} className="p-5">
            <p className="font-display text-lg font-bold">Poule {String.fromCharCode(65 + gi)}</p>
            <div className="mt-3 space-y-2">
              {g.map((t, i) => <div key={t} className="flex items-center gap-3 rounded-md bg-surface-2/60 p-2.5 animate-fade-up"><span className="tabular w-5 text-center text-xs font-bold text-muted">{i + 1}</span><Avatar name={t} size={30} /><span className="flex-1 text-sm font-semibold">{t}</span><span className="text-xs text-muted">10 joueurs</span><Badge tone={i === 2 && gi === 1 ? "warning" : "success"} dot>{i === 2 && gi === 1 ? "2 impayés" : "Complet"}</Badge></div>)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function Budget() {
  const { navigate } = useRouter();
  const { cart, event, setEvent } = useStore();
  const lines = categories.map((c) => {
    const items = cart.filter((x) => x.provider.category === c.key);
    const planned = { infrastructures: 810000, arbitres: 750000, transport: 360000, medical: 480000, securite: 320000, restauration: 560000, personnel: 80000, materiel: 50000, media: 150000 }[c.key];
    const committed = items.filter((x) => x.status === "Validé").reduce((s, x) => s + cartLineTotal(x), 0);
    const pending = items.filter((x) => x.status !== "Validé").reduce((s, x) => s + cartLineTotal(x), 0);
    return { ...c, planned, committed, pending };
  });
  const totPlanned = lines.reduce((s, l) => s + l.planned, 0);
  const totCommitted = lines.reduce((s, l) => s + l.committed, 0);
  const totPending = lines.reduce((s, l) => s + l.pending, 0);
  const revenue = event.teams * 50000;
  const pie = lines.filter((l) => l.committed + l.pending > 0).map((l) => ({ name: l.label, value: l.committed + l.pending }));
  return (
    <div>
      <PageHeader eyebrow={event.name} title="Gestion du budget" subtitle="Prévu, engagé (devis validés) et en attente — mis à jour depuis le panier." actions={<Button variant="outline" onClick={() => navigate("events-cart")}>Ouvrir le panier</Button>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4"><p className="text-xs text-muted">Budget total</p><Input className="mt-2 tabular font-display text-lg font-bold" type="number" step={100000} value={event.budget} onChange={(e) => setEvent({ budget: +e.target.value })} aria-label="Budget total" /></Card>
        <Stat label="Prévu par poste" value={fcfa(totPlanned)} />
        <Stat label="Engagé" value={fcfa(totCommitted)} hint={`${((totCommitted / event.budget) * 100).toFixed(0)} % du budget`} />
        <Stat label="Recettes inscriptions" value={fcfa(revenue)} hint={`${event.teams} × 50 000`} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b border-border text-left text-xs text-muted"><th className="p-4">Poste</th><th className="p-4 text-right">Prévu</th><th className="p-4 text-right">Engagé</th><th className="p-4 text-right">En attente</th><th className="w-40 p-4">Consommation</th></tr></thead>
            <tbody>
              {lines.map((l) => { const used = ((l.committed + l.pending) / l.planned) * 100; return (
                <tr key={l.key} className="border-b border-border last:border-0">
                  <td className="p-4"><span className="flex items-center gap-2"><l.icon className="h-4 w-4 text-muted" />{l.label}</span></td>
                  <td className="tabular p-4 text-right">{fcfa(l.planned)}</td>
                  <td className="tabular p-4 text-right font-semibold">{l.committed ? fcfa(l.committed) : "—"}</td>
                  <td className="tabular p-4 text-right text-muted">{l.pending ? fcfa(l.pending) : "—"}</td>
                  <td className="p-4"><Progress className="h-1.5" value={Math.min(100, used)} tone={used > 100 ? "error" : used > 85 ? "warning" : "primary"} /><span className="tabular text-2xs text-muted">{used.toFixed(0)} %</span></td>
                </tr>
              ); })}
              <tr className="font-semibold"><td className="p-4">Total</td><td className="tabular p-4 text-right">{fcfa(totPlanned)}</td><td className="tabular p-4 text-right">{fcfa(totCommitted)}</td><td className="tabular p-4 text-right">{fcfa(totPending)}</td><td className="p-4" /></tr>
            </tbody>
          </table>
        </Card>
        <Card className="p-5">
          <p className="font-semibold">Répartition des dépenses</p>
          {pie.length ? (
            <>
              <div className="h-52"><ResponsiveContainer><PieChart><Pie data={pie} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none">{pie.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} formatter={(v) => fcfa(Number(v))} /></PieChart></ResponsiveContainer></div>
              <div className="space-y-1.5">{pie.map((p, i) => <div key={p.name} className="flex items-center gap-2 text-xs"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: chartColors[i % chartColors.length] }} /><span className="flex-1 text-muted">{p.name}</span><span className="tabular font-semibold">{fcfa(p.value)}</span></div>)}</div>
            </>
          ) : <EmptyState className="mt-4" title="Aucune dépense" description="Ajoute des services au panier." action={<Button size="sm" onClick={() => navigate("events-planner")}>Event Planner</Button>} />}
        </Card>
      </div>
    </div>
  );
}

interface Txn { id: string; label: string; party: string; type: "Acompte" | "Solde" | "Inscription" | "Remboursement"; amount: number; status: "Payé" | "En attente" | "Échoué"; date: string; method: string }
const txns: Txn[] = [
  { id: "t1", label: "Acompte 30 % · Stade de Yoff", party: "Stade Municipal de Yoff", type: "Acompte", amount: 243000, status: "Payé", date: "10 nov.", method: "Virement" },
  { id: "t2", label: "Inscription · ASC Mermoz", party: "ASC Mermoz", type: "Inscription", amount: 50000, status: "Payé", date: "8 nov.", method: "Wave" },
  { id: "t3", label: "Inscription · Ouakam United", party: "Ouakam United", type: "Inscription", amount: 50000, status: "Payé", date: "8 nov.", method: "Orange Money" },
  { id: "t4", label: "Acompte · Saveurs de la Teranga", party: "Saveurs de la Teranga", type: "Acompte", amount: 168000, status: "En attente", date: "15 nov.", method: "Wave" },
  { id: "t5", label: "Inscription · Plateau City", party: "Plateau City", type: "Inscription", amount: 50000, status: "Échoué", date: "14 nov.", method: "Carte" },
  { id: "t6", label: "Inscription · Ngor Surfers FC", party: "Ngor Surfers FC", type: "Inscription", amount: 50000, status: "En attente", date: "16 nov.", method: "Wave" },
  { id: "t7", label: "Remboursement · équipe forfait", party: "Sacré-Cœur FC", type: "Remboursement", amount: -50000, status: "Payé", date: "5 nov.", method: "Wave" },
];

export function Payments() {
  const { toast } = useStore();
  const [rows, setRows] = useState(txns);
  const [sel, setSel] = useState<Txn | null>(null);
  const cols: Column<Txn>[] = [
    { key: "label", header: "Transaction", render: (r) => <div><p className="font-medium">{r.label}</p><p className="text-2xs text-muted">{r.party}</p></div> },
    { key: "type", header: "Type", render: (r) => <Badge tone={r.type === "Remboursement" ? "info" : "neutral"}>{r.type}</Badge> },
    { key: "date", header: "Date", render: (r) => r.date },
    { key: "method", header: "Moyen", render: (r) => <span className="text-muted">{r.method}</span> },
    { key: "amount", header: "Montant", align: "right", sort: (r) => r.amount, render: (r) => <span className={cn("font-semibold", r.amount < 0 && "text-info")}>{fcfa(r.amount)}</span> },
    { key: "status", header: "Statut", render: (r) => <Badge tone={r.status === "Payé" ? "success" : r.status === "En attente" ? "warning" : "error"} dot>{r.status}</Badge> },
  ];
  const paidIn = rows.filter((r) => r.status === "Payé" && r.type === "Inscription").reduce((s, r) => s + r.amount, 0);
  return (
    <div>
      <PageHeader eyebrow="Payment Experience" title="Suivi des paiements" subtitle="Acomptes prestataires, inscriptions d’équipes, remboursements." actions={<Button variant="outline" onClick={() => toast({ title: "Export CSV simulé" })}><Download className="h-4 w-4" />Exporter</Button>} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Encaissé (inscriptions)" value={fcfa(paidIn)} hint="sur 800 000" />
        <Stat label="Versé aux prestataires" value={fcfa(243000)} />
        <Stat label="En attente" value={rows.filter((r) => r.status === "En attente").length} hint="transactions" />
        <Stat label="Échecs" value={rows.filter((r) => r.status === "Échoué").length} hint="à relancer" />
      </div>
      <DataTable columns={cols} rows={rows} onRowClick={setSel} />
      <Drawer open={!!sel} onClose={() => setSel(null)} title="Détail de la transaction" footer={sel && sel.status !== "Payé" ? <div className="flex gap-2"><Button variant="outline" block onClick={() => { toast({ title: "Relance envoyée", body: sel.party }); }}>Relancer</Button><Button block onClick={() => { setRows((r) => r.map((x) => (x.id === sel.id ? { ...x, status: "Payé" } : x))); setSel(null); toast({ title: "Paiement simulé effectué" }); }}>{sel.type === "Acompte" ? "Payer l’acompte" : "Marquer payé"}</Button></div> : undefined}>
        {sel && (
          <div className="space-y-4">
            <div><p className="tabular font-display text-3xl font-bold">{fcfa(sel.amount)}</p><Badge className="mt-2" tone={sel.status === "Payé" ? "success" : sel.status === "En attente" ? "warning" : "error"} dot>{sel.status}</Badge></div>
            {[["Libellé", sel.label], ["Contrepartie", sel.party], ["Type", sel.type], ["Date", sel.date + " 2026"], ["Moyen", sel.method], ["Référence", "TX-" + sel.id.toUpperCase() + "-2026"]].map(([k, v]) => <div key={k} className="flex justify-between border-b border-border pb-2 text-sm"><span className="text-muted">{k}</span><span className="font-medium">{v}</span></div>)}
            {sel.status === "Échoué" && <p className="rounded-md bg-error/10 p-3 text-xs text-error">Motif : carte refusée par l’émetteur (simulation).</p>}
          </div>
        )}
      </Drawer>
    </div>
  );
}

export function Documents() {
  const { toast } = useStore();
  const [tab, setTab] = useState<"all" | "invoices" | "contracts" | "admin">("all");
  const docs = [
    { n: "Facture FA-2026-0412 · Stade de Yoff", t: "invoices", d: "10 nov.", s: "Payée", size: "184 Ko" },
    { n: "Devis DV-SECU-0091 · Garde Atlantique", t: "contracts", d: "12 nov.", s: "À signer", size: "96 Ko" },
    { n: "Contrat de location · Stade de Yoff", t: "contracts", d: "9 nov.", s: "Signé", size: "312 Ko" },
    { n: "Autorisation préfectorale (modèle)", t: "admin", d: "2 nov.", s: "Déposée", size: "1,2 Mo" },
    { n: "Attestation d’assurance RC", t: "admin", d: "1 nov.", s: "Valide", size: "220 Ko" },
    { n: "Facture FA-2026-0418 · Saveurs de la Teranga", t: "invoices", d: "15 nov.", s: "En attente", size: "140 Ko" },
    { n: "Règlement du tournoi v2", t: "admin", d: "28 oct.", s: "Publié", size: "88 Ko" },
  ];
  const list = docs.filter((d) => tab === "all" || d.t === tab);
  return (
    <div>
      <PageHeader title="Documents & factures" subtitle="Tous les documents de l’événement, générés ou déposés." actions={<Button onClick={() => toast({ title: "Document ajouté (simulé)" })}><Upload className="h-4 w-4" />Déposer un document</Button>} />
      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ value: "all", label: "Tous", count: docs.length }, { value: "invoices", label: "Factures" }, { value: "contracts", label: "Devis & contrats" }, { value: "admin", label: "Administratif" }]} />
      <Card className="divide-y divide-border">
        {list.map((d) => (
          <div key={d.n} className="flex items-center gap-4 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-2"><FileText className="h-5 w-5 text-muted" /></span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{d.n}</p><p className="text-xs text-muted">{d.d} · PDF · {d.size}</p></div>
            <Badge tone={d.s === "À signer" || d.s === "En attente" ? "warning" : "success"} dot>{d.s}</Badge>
            {d.s === "À signer" ? <Button size="sm" onClick={() => toast({ title: "Document signé électroniquement (simulé)" })}>Signer</Button> : <Button size="sm" variant="ghost" aria-label={`Télécharger ${d.n}`} onClick={() => toast({ title: "Téléchargement simulé" })}><Download className="h-4 w-4" /></Button>}
          </div>
        ))}
      </Card>
    </div>
  );
}

interface Incident { id: string; title: string; sev: "Critique" | "Majeur" | "Mineur"; status: "Ouvert" | "En cours" | "Résolu"; who: string; time: string; desc: string }
export function Incidents() {
  const { toast } = useStore();
  const [items, setItems] = useState<Incident[]>([
    { id: "i1", title: "Retard navette Parcelles (20 min)", sev: "Majeur", status: "En cours", who: "Teranga Minibus", time: "J1 · 07:45", desc: "Embouteillage VDN. Deuxième bus envoyé." },
    { id: "i2", title: "Joueur blessé (cheville) · Match 6", sev: "Mineur", status: "Résolu", who: "SOS Secours Sport", time: "J1 · 10:20", desc: "Pris en charge au poste médical, pas d’évacuation." },
    { id: "i3", title: "Coupure éclairage terrain B", sev: "Critique", status: "Ouvert", who: "Stade de Yoff", time: "J1 · 17:55", desc: "Match 16 suspendu. Technicien appelé." },
  ]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", sev: "Mineur" as Incident["sev"], desc: "" });
  const advance = (id: string) => setItems((all) => all.map((i) => (i.id === id ? { ...i, status: i.status === "Ouvert" ? "En cours" : "Résolu" } : i)));
  return (
    <div>
      <PageHeader eyebrow="Jour J" title="Gestion des incidents" subtitle="Signale, assigne et suis chaque incident en temps réel." actions={<Button onClick={() => setOpen(true)}><AlertTriangle className="h-4 w-4" />Signaler un incident</Button>} />
      <div className="grid gap-4 lg:grid-cols-3">
        {(["Ouvert", "En cours", "Résolu"] as const).map((col) => (
          <div key={col}>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold">{col}<span className="tabular rounded-full bg-surface-2 px-1.5 text-2xs">{items.filter((i) => i.status === col).length}</span></p>
            <div className="space-y-2">
              {items.filter((i) => i.status === col).map((i) => (
                <Card key={i.id} className="p-4 animate-fade-up">
                  <div className="flex items-center justify-between"><Badge tone={i.sev === "Critique" ? "error" : i.sev === "Majeur" ? "warning" : "neutral"}>{i.sev}</Badge><span className="text-2xs text-muted">{i.time}</span></div>
                  <p className="mt-2 text-sm font-semibold">{i.title}</p>
                  <p className="mt-1 text-xs text-muted">{i.desc}</p>
                  <div className="mt-3 flex items-center justify-between"><span className="text-2xs text-muted">{i.who}</span>{i.status !== "Résolu" && <Button size="sm" variant="secondary" onClick={() => { advance(i.id); toast({ title: i.status === "Ouvert" ? "Incident pris en charge" : "Incident résolu" }); }}>{i.status === "Ouvert" ? "Prendre en charge" : <><CheckCircle2 className="h-3.5 w-3.5" />Résoudre</>}</Button>}</div>
                </Card>
              ))}
              {!items.some((i) => i.status === col) && <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted">Aucun incident</p>}
            </div>
          </div>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Signaler un incident" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button><Button disabled={draft.title.length < 3} onClick={() => { setItems((a) => [{ id: uid(), ...draft, status: "Ouvert", who: "Organisation", time: "maintenant" }, ...a]); setOpen(false); setDraft({ title: "", sev: "Mineur", desc: "" }); toast({ title: "Incident signalé", body: "Les prestataires concernés sont notifiés." }); }}>Signaler</Button></>}>
        <div className="space-y-3">
          <Field label="Titre"><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Ex. Ballons manquants terrain A" /></Field>
          <Field label="Gravité"><Select value={draft.sev} onChange={(e) => setDraft({ ...draft, sev: e.target.value as Incident["sev"] })}><option>Mineur</option><option>Majeur</option><option>Critique</option></Select></Field>
          <Field label="Description"><Textarea value={draft.desc} onChange={(e) => setDraft({ ...draft, desc: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  );
}

export function Report() {
  const { toast } = useStore();
  const kpis = [{ l: "Participants", v: "198" }, { l: "Matchs joués", v: "31" }, { l: "Taux de présence", v: "96 %" }, { l: "Satisfaction", v: "4,7 / 5" }];
  const spend = [{ c: "Infra.", v: 810 }, { c: "Arbitres", v: 620 }, { c: "Médical", v: 240 }, { c: "Sécurité", v: 300 }, { c: "Restau.", v: 690 }, { c: "Transport", v: 270 }, { c: "Média", v: 150 }];
  return (
    <div>
      <PageHeader eyebrow="Dakar 3x3 Summer Jam · 14 sept." title="Rapport final de l’événement" subtitle="Bilan généré automatiquement à la clôture." actions={<Button onClick={() => toast({ title: "Rapport exporté (PDF simulé)" })}><Download className="h-4 w-4" />Exporter le rapport</Button>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{kpis.map((k) => <Stat key={k.l} label={k.l} value={k.v} />)}</div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5"><p className="font-semibold">Dépenses par poste (k FCFA)</p><div className="mt-4 h-56"><ResponsiveContainer><BarChart data={spend}><XAxis dataKey="c" tickLine={false} axisLine={false} fontSize={11} stroke="rgb(var(--muted))" /><YAxis hide /><Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgb(var(--surface-2))" }} /><Bar dataKey="v" fill="#B7F34A" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card className="space-y-3 p-5">
          <p className="font-semibold">Bilan financier</p>
          {[["Recettes (inscriptions + sponsors)", 3600000], ["Dépenses prestataires", -3080000], ["Frais SportMatch", -154000]].map(([l, v]) => <div key={l as string} className="flex justify-between text-sm"><span className="text-muted">{l}</span><span className={cn("tabular font-semibold", (v as number) < 0 && "text-error")}>{fcfa(v as number)}</span></div>)}
          <div className="flex justify-between border-t border-border pt-3 font-display text-lg font-bold"><span>Résultat</span><span className="tabular text-success">{fcfa(366000)}</span></div>
          <p className="pt-2 text-sm font-semibold">Prestataires les mieux notés</p>
          {["SOS Secours Sport · 5,0", "Saveurs de la Teranga · 4,9", "Arbitre Mamadou K. · 4,9"].map((x) => <p key={x} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-success" />{x}</p>)}
          <p className="pt-2 text-sm font-semibold">Incidents</p><p className="text-sm text-muted">4 signalés · 4 résolus · délai moyen 14 min</p>
        </Card>
      </div>
    </div>
  );
}

export function EventsSettings() {
  const { toast } = useStore();
  const [auto, setAuto] = useState(true);
  return (
    <div className="max-w-2xl">
      <PageHeader title="Paramètres organisateur" />
      <Card className="space-y-4 p-5">
        <Field label="Structure organisatrice"><Input defaultValue="Association Dakar Sport Ensemble (fictive)" /></Field>
        <div className="grid gap-3 md:grid-cols-2"><Field label="NINEA (fictif)"><Input defaultValue="00123456 7G2" /></Field><Field label="Devise"><Select><option>FCFA (XOF)</option><option>EUR</option><option>USD</option></Select></Field></div>
        <div className="flex items-center justify-between rounded-md bg-surface-2/60 p-3"><span className="text-sm">Relances automatiques des impayés (J-7, J-3)</span><Switch label="Relances automatiques" checked={auto} onChange={setAuto} /></div>
        <Button onClick={() => toast({ title: "Paramètres enregistrés" })}>Enregistrer</Button>
      </Card>
    </div>
  );
}
export { Clock };
