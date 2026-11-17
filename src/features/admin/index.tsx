"use client";
import { AlertOctagon, BarChart3, Building2, CalendarCheck, Check, CreditCard, Flag, FolderTree, LayoutDashboard, MapPinned, Percent, RotateCcw, Search, Settings, ShieldCheck, Undo2, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ConsoleShell, PageHeader, type NavItem } from "@/components/shells/console-shell";
import { Avatar, Badge, Button, Card, DataTable, Drawer, EmptyState, Field, Input, Modal, Progress, Select, Stat, Switch, Tabs, Textarea, Verified, type Column } from "@/components/ui";
import { categories, providers } from "@/data/providers";
import { players } from "@/data/players";
import { venues } from "@/data/venues";
import { useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import { cn, compact, fcfa } from "@/lib/utils";

const tt = { background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: 8, fontSize: 12, color: "rgb(var(--fg))" };
const colors = ["#B7F34A", "#60A5FA", "#F59E0B", "#F472B6", "#34D399", "#A78BFA"];
const gmv = [{ m: "Juin", gmv: 18, rev: 1.4 }, { m: "Juil.", gmv: 24, rev: 1.9 }, { m: "Août", gmv: 22, rev: 1.8 }, { m: "Sept.", gmv: 31, rev: 2.5 }, { m: "Oct.", gmv: 39, rev: 3.1 }, { m: "Nov.", gmv: 46, rev: 3.7 }];
const ax = { tickLine: false, axisLine: false, fontSize: 11, stroke: "rgb(var(--muted))" };

function AdminDashboard() {
  const { navigate } = useRouter();
  const mix = [{ n: "Terrains", v: 58 }, { n: "Matchs", v: 17 }, { n: "Services événements", v: 21 }, { n: "Abonnements", v: 4 }];
  return (
    <div>
      <PageHeader eyebrow="Vue globale · Dakar" title="Dashboard plateforme" subtitle="Données fictives · mise à jour simulée en temps réel" actions={<Select className="w-52" aria-label="Période"><option>30 derniers jours</option><option>Trimestre</option><option>Année</option></Select>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Volume d’affaires (GMV)" value="46,2 M F" delta={18} icon={<CreditCard />} />
        <Stat label="Revenus SportMatch" value="3,7 M F" delta={19} icon={<Percent />} />
        <Stat label="Utilisateurs actifs (30 j)" value="12 480" delta={11} icon={<Users />} />
        <Stat label="Taux de matchs complets" value="81 %" delta={4} hint="KPI nº 1" icon={<CalendarCheck />} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="p-5"><p className="font-semibold">GMV <span className="text-info">(axe gauche)</span> & revenus <span className="text-primary-ink">(axe droit)</span> · M FCFA</p><div className="mt-4 h-64"><ResponsiveContainer><AreaChart data={gmv}><CartesianGrid vertical={false} stroke="rgb(var(--border))" strokeDasharray="3 3" /><XAxis dataKey="m" {...ax} /><YAxis yAxisId="l" {...ax} width={30} /><YAxis yAxisId="r" orientation="right" {...ax} width={30} /><Tooltip contentStyle={tt} /><Area yAxisId="l" dataKey="gmv" name="GMV" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.1} strokeWidth={2} /><Area yAxisId="r" dataKey="rev" name="Revenus" stroke="#B7F34A" fill="#B7F34A" fillOpacity={0.2} strokeWidth={2} /></AreaChart></ResponsiveContainer></div></Card>
        <Card className="p-5"><p className="font-semibold">Répartition des revenus</p><div className="h-44"><ResponsiveContainer><PieChart><Pie data={mix} dataKey="v" innerRadius={45} outerRadius={72} stroke="none" paddingAngle={2}>{mix.map((_, i) => <Cell key={i} fill={colors[i]} />)}</Pie><Tooltip contentStyle={tt} formatter={(v) => `${v} %`} /></PieChart></ResponsiveContainer></div><div className="space-y-1.5">{mix.map((m, i) => <div key={m.n} className="flex items-center gap-2 text-xs"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors[i] }} /><span className="flex-1 text-muted">{m.n}</span><span className="tabular font-semibold">{m.v} %</span></div>)}</div></Card>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[{ l: "Prestataires à valider", v: 4, r: "admin-validation", t: "warning" }, { l: "Litiges ouverts", v: 3, r: "admin-disputes", t: "error" }, { l: "Signalements à modérer", v: 5, r: "admin-reports", t: "warning" }].map((x) => <Card key={x.l} interactive onClick={() => navigate(x.r)} className="flex items-center justify-between p-4"><div><p className="tabular font-display text-2xl font-bold">{x.v}</p><p className="text-sm text-muted">{x.l}</p></div><Badge tone={x.t as "warning"}>Action requise</Badge></Card>)}
      </div>
    </div>
  );
}

interface U { id: string; name: string; role: string; district: string; joined: string; status: "Actif" | "Suspendu"; reliability: number }
function AdminUsers() {
  const { toast } = useStore();
  const [rows, setRows] = useState<U[]>(players.map((p, i) => ({ id: p.id, name: p.name, role: i % 5 === 0 ? "Organisateur" : "Sportif", district: p.district, joined: `${(i % 12) + 1}/2026`, status: i === 6 ? "Suspendu" : "Actif", reliability: p.reliability })));
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<U | null>(null);
  const list = rows.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()));
  const cols: Column<U>[] = [
    { key: "n", header: "Utilisateur", sort: (r) => r.name, render: (r) => <span className="flex items-center gap-2"><Avatar name={r.name} size={28} />{r.name}</span> },
    { key: "r", header: "Rôle", render: (r) => <Badge>{r.role}</Badge> },
    { key: "d", header: "Quartier", render: (r) => r.district },
    { key: "f", header: "Fiabilité", align: "right", sort: (r) => r.reliability, render: (r) => <span className={cn(r.reliability < 80 && "text-warning")}>{r.reliability}</span> },
    { key: "j", header: "Inscrit", render: (r) => r.joined },
    { key: "s", header: "Statut", render: (r) => <Badge tone={r.status === "Actif" ? "success" : "error"} dot>{r.status}</Badge> },
  ];
  return (
    <div>
      <PageHeader title="Gestion des utilisateurs" subtitle={`${rows.length} comptes affichés (échantillon fictif)`} />
      <div className="mb-4 max-w-sm"><Input icon={<Search />} placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <DataTable columns={cols} rows={list} onRowClick={setSel} />
      <Drawer open={!!sel} onClose={() => setSel(null)} title="Fiche utilisateur" footer={sel && <Button block variant={sel.status === "Actif" ? "danger" : "primary"} onClick={() => { setRows((r) => r.map((x) => (x.id === sel.id ? { ...x, status: x.status === "Actif" ? "Suspendu" : "Actif" } : x))); toast({ title: sel.status === "Actif" ? "Compte suspendu" : "Compte réactivé" }); setSel(null); }}>{sel.status === "Actif" ? "Suspendre le compte" : "Réactiver le compte"}</Button>}>
        {sel && <div className="space-y-3"><div className="flex items-center gap-3"><Avatar name={sel.name} size={48} /><div><p className="font-semibold">{sel.name}</p><p className="text-xs text-muted">{sel.role} · {sel.district}</p></div></div>{[["Fiabilité", sel.reliability], ["Inscrit", sel.joined], ["Réservations", 14], ["Signalements", sel.status === "Suspendu" ? 3 : 0]].map(([k, v]) => <div key={k as string} className="flex justify-between border-b border-border pb-2 text-sm"><span className="text-muted">{k}</span><span>{v}</span></div>)}</div>}
      </Drawer>
    </div>
  );
}

function AdminCompanies() {
  const cols: Column<(typeof providers)[number]>[] = [
    { key: "n", header: "Entreprise", sort: (r) => r.name, render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "c", header: "Catégorie", render: (r) => categories.find((c) => c.key === r.category)?.label },
    { key: "d", header: "Quartier", render: (r) => r.district },
    { key: "r", header: "Note", align: "right", sort: (r) => r.rating, render: (r) => r.rating },
    { key: "v", header: "KYB", render: (r) => (r.verified ? <Verified /> : <Badge tone="warning">En attente</Badge>) },
    { key: "p", header: "Plan", render: (r) => <Badge tone="outline">{r.rating > 4.6 ? "Venue Pro" : "Free"}</Badge> },
  ];
  return <div><PageHeader title="Gestion des entreprises" subtitle={`${providers.length} entreprises (fictives)`} /><DataTable columns={cols} rows={providers} /></div>;
}

function AdminValidation() {
  const { toast } = useStore();
  const [items, setItems] = useState([
    { id: "k1", n: "Dakar Shuttle Pro", c: "Transport", docs: ["NINEA ✓", "RCCM ✓", "Assurance ✗"], risk: "Moyen", date: "il y a 2 h" },
    { id: "k2", n: "Sentinel Events", c: "Sécurité", docs: ["NINEA ✓", "RCCM ✓", "Agrément ✓"], risk: "Faible", date: "il y a 5 h" },
    { id: "k3", n: "City Court Ouakam", c: "Infrastructure", docs: ["Convention mairie ✓", "Assurance ✓"], risk: "Faible", date: "hier" },
    { id: "k4", n: "Photo Sport 221", c: "Audiovisuel", docs: ["NINEA ✗", "Pièce d’identité ✓"], risk: "Élevé", date: "hier" },
  ]);
  const [rej, setRej] = useState<string | null>(null);
  const decide = (id: string, ok: boolean) => { setItems((i) => i.filter((x) => x.id !== id)); toast({ title: ok ? "Prestataire validé — badge « Vérifié » attribué" : "Dossier refusé, motif envoyé", tone: ok ? "success" : "info" }); };
  return (
    <div>
      <PageHeader title="Validation des prestataires" subtitle="Vérification KYB avant publication sur la marketplace." />
      {items.length ? <div className="grid gap-4 md:grid-cols-2">{items.map((k) => (
        <Card key={k.id} className="p-5">
          <div className="flex items-start justify-between"><div><p className="font-semibold">{k.n}</p><p className="text-xs text-muted">{k.c} · soumis {k.date}</p></div><Badge tone={k.risk === "Faible" ? "success" : k.risk === "Moyen" ? "warning" : "error"}>Risque {k.risk.toLowerCase()}</Badge></div>
          <div className="mt-3 flex flex-wrap gap-1.5">{k.docs.map((d) => <Badge key={d} tone={d.includes("✗") ? "error" : "outline"}>{d}</Badge>)}</div>
          <div className="mt-4 flex gap-2"><Button size="sm" onClick={() => decide(k.id, true)}><Check className="h-3.5 w-3.5" />Valider</Button><Button size="sm" variant="ghost" onClick={() => setRej(k.id)}><X className="h-3.5 w-3.5" />Refuser</Button></div>
        </Card>
      ))}</div> : <EmptyState icon={<ShieldCheck />} title="File de validation vide" description="Tous les dossiers ont été traités." />}
      <Modal open={!!rej} onClose={() => setRej(null)} title="Refuser le dossier" footer={<><Button variant="ghost" onClick={() => setRej(null)}>Annuler</Button><Button variant="danger" onClick={() => { decide(rej!, false); setRej(null); }}>Refuser</Button></>}><Field label="Motif communiqué au prestataire"><Textarea defaultValue="Document manquant : attestation d’assurance RC en cours de validité." /></Field></Modal>
    </div>
  );
}

function AdminVenues() {
  const cols: Column<(typeof venues)[number]>[] = [
    { key: "n", header: "Infrastructure", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "k", header: "Type", render: (r) => r.kind },
    { key: "d", header: "Quartier", render: (r) => r.district },
    { key: "p", header: "Prix / h", align: "right", sort: (r) => r.pricePerHour, render: (r) => fcfa(r.pricePerHour) },
    { key: "o", header: "Occupation", render: (r) => <div className="w-28"><Progress className="h-1.5" value={50 + (Number(r.id.slice(1)) * 7) % 45} /></div> },
    { key: "v", header: "Statut", render: (r) => (r.verified ? <Badge tone="success" dot>Publiée</Badge> : <Badge tone="warning" dot>À vérifier</Badge>) },
  ];
  return <div><PageHeader title="Gestion des infrastructures" subtitle="Terrains, gymnases, courts et aires de jeux." /><DataTable columns={cols} rows={venues} /></div>;
}

function AdminCategories() {
  const { toast } = useStore();
  const [on, setOn] = useState<Record<string, boolean>>(Object.fromEntries(categories.map((c) => [c.key, true])));
  return (
    <div>
      <PageHeader title="Gestion des catégories" subtitle="Catégories de la marketplace et leur moteur de réservation." actions={<Button onClick={() => toast({ title: "Nouvelle catégorie (simulé)" })}>Ajouter une catégorie</Button>} />
      <Card className="divide-y divide-border">{categories.map((c) => (
        <div key={c.key} className="flex items-center gap-4 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-2"><c.icon className="h-5 w-5 text-primary-ink" /></span><div className="flex-1"><p className="font-medium">{c.label}</p><p className="text-xs text-muted">Réservation : {c.booking} · tarif {c.unitHint}</p></div><span className="tabular text-xs text-muted">{providers.filter((p) => p.category === c.key).length} prestataires</span><Switch label={`Activer ${c.label}`} checked={on[c.key]} onChange={(v) => setOn({ ...on, [c.key]: v })} /></div>
      ))}</Card>
    </div>
  );
}

const bk = Array.from({ length: 14 }, (_, i) => ({ id: "BK" + (4810 + i), who: players[i % players.length].name, what: venues[i % venues.length].name, date: `${(i % 9) + 10} nov.`, amount: venues[i % venues.length].pricePerHour * ((i % 2) + 1), status: (["Confirmée", "Confirmée", "Terminée", "Annulée", "En attente"] as const)[i % 5] }));
function AdminBookings() {
  const [tab, setTab] = useState<"all" | "Confirmée" | "En attente" | "Annulée">("all");
  const cols: Column<(typeof bk)[number]>[] = [
    { key: "id", header: "Réf.", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "w", header: "Client", render: (r) => r.who },
    { key: "x", header: "Infrastructure", render: (r) => r.what },
    { key: "d", header: "Date", render: (r) => r.date },
    { key: "a", header: "Montant", align: "right", sort: (r) => r.amount, render: (r) => fcfa(r.amount) },
    { key: "s", header: "Statut", render: (r) => <Badge tone={r.status === "Confirmée" ? "success" : r.status === "Annulée" ? "error" : r.status === "En attente" ? "warning" : "neutral"} dot>{r.status}</Badge> },
  ];
  return <div><PageHeader title="Gestion des réservations" /><Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ value: "all", label: "Toutes" }, { value: "Confirmée", label: "Confirmées" }, { value: "En attente", label: "En attente" }, { value: "Annulée", label: "Annulées" }]} /><DataTable columns={cols} rows={bk.filter((b) => tab === "all" || b.status === tab)} /></div>;
}

function AdminTransactions() {
  const tx = bk.map((b, i) => ({ id: "TX" + (9100 + i), ref: b.id, method: ["Wave", "Orange Money", "Carte", "Wave"][i % 4], amount: b.amount, fee: Math.round(b.amount * 0.08), status: b.status === "Annulée" ? "Remboursée" : b.status === "En attente" ? "En attente" : "Réussie" }));
  const cols: Column<(typeof tx)[number]>[] = [
    { key: "id", header: "Transaction", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "r", header: "Réservation", render: (r) => <span className="font-mono text-xs text-muted">{r.ref}</span> },
    { key: "m", header: "Moyen", render: (r) => r.method },
    { key: "a", header: "Montant", align: "right", sort: (r) => r.amount, render: (r) => fcfa(r.amount) },
    { key: "f", header: "Commission", align: "right", render: (r) => fcfa(r.fee) },
    { key: "s", header: "Statut", render: (r) => <Badge tone={r.status === "Réussie" ? "success" : r.status === "Remboursée" ? "info" : "warning"} dot>{r.status}</Badge> },
  ];
  const methods = [{ m: "Wave", v: 52 }, { m: "Orange Money", v: 31 }, { m: "Carte", v: 17 }];
  return (
    <div>
      <PageHeader title="Gestion des transactions" />
      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3"><Stat label="Transactions (30 j)" value="8 214" delta={14} /><Stat label="Taux de succès" value="97,8 %" /><Stat label="Montant moyen" value={fcfa(5630)} /></div>
        <Card className="p-4"><p className="text-xs font-semibold text-muted">Moyens de paiement</p>{methods.map((m, i) => <div key={m.m} className="mt-2"><div className="flex justify-between text-xs"><span>{m.m}</span><span className="tabular">{m.v} %</span></div><Progress className="mt-1 h-1.5" value={m.v} tone={i === 0 ? "primary" : "success"} /></div>)}</Card>
      </div>
      <DataTable columns={cols} rows={tx} />
    </div>
  );
}

function AdminCommissions() {
  const { toast } = useStore();
  const [rates, setRates] = useState<Record<string, number>>({ Terrains: 8, "Matchs (participation)": 5, "Services événementiels": 10, Tournois: 7 });
  return (
    <div className="max-w-3xl">
      <PageHeader title="Gestion des commissions" subtitle="Taux appliqués par type de transaction." actions={<Button onClick={() => toast({ title: "Taux enregistrés", body: "Appliqués aux nouvelles réservations." })}>Enregistrer</Button>} />
      <Card className="divide-y divide-border">{Object.entries(rates).map(([k, v]) => (
        <div key={k} className="flex items-center gap-4 p-4"><span className="flex-1 font-medium">{k}</span><input type="range" min={0} max={20} step={0.5} value={v} onChange={(e) => setRates({ ...rates, [k]: +e.target.value })} className="w-40 accent-[rgb(var(--primary))]" aria-label={`Commission ${k}`} /><span className="tabular w-14 text-right font-semibold">{v} %</span></div>
      ))}</Card>
      <Card className="mt-4 p-4 text-sm"><p className="font-semibold">Simulation</p><p className="tabular mt-1 text-muted">Réservation terrain de {fcfa(40000)} → commission {fcfa(40000 * rates.Terrains / 100)}</p></Card>
    </div>
  );
}

function AdminSubscriptions() {
  const plans = [{ n: "Free", p: 0, s: 11240, c: "neutral" }, { n: "Plus", p: 2500, s: 820, c: "primary" }, { n: "Organizer Pro", p: 6500, s: 96, c: "info" }, { n: "Venue Pro", p: 19500, s: 38, c: "warning" }];
  const trend = [{ m: "Juil.", v: 640 }, { m: "Août", v: 690 }, { m: "Sept.", v: 760 }, { m: "Oct.", v: 860 }, { m: "Nov.", v: 954 }];
  return (
    <div>
      <PageHeader title="Gestion des abonnements" subtitle="Tarifs indicatifs en FCFA / mois" />
      <div className="grid gap-4 md:grid-cols-4">{plans.map((p) => <Card key={p.n} className="p-5"><Badge tone={p.c as "primary"}>{p.n}</Badge><p className="tabular mt-3 font-display text-2xl font-bold">{p.p ? fcfa(p.p) : "Gratuit"}</p><p className="tabular text-sm text-muted">{p.s.toLocaleString("fr-FR")} abonnés</p></Card>)}</div>
      <Card className="mt-6 p-5"><p className="font-semibold">Abonnés payants</p><div className="mt-4 h-56"><ResponsiveContainer><LineChart data={trend}><XAxis dataKey="m" {...ax} /><YAxis {...ax} width={34} /><Tooltip contentStyle={tt} /><Line dataKey="v" stroke="#B7F34A" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div></Card>
    </div>
  );
}

interface Dispute { id: string; title: string; parties: string; amount: number; status: "Ouvert" | "En médiation" | "Résolu"; age: string; desc: string }
function AdminDisputes() {
  const { toast } = useStore();
  const [items, setItems] = useState<Dispute[]>([
    { id: "LT-311", title: "Terrain inutilisable (éclairage en panne)", parties: "Moussa Diop ↔ Complexe Mermoz Sport", amount: 25000, status: "Ouvert", age: "2 h", desc: "Le client demande le remboursement intégral. Le gérant propose un avoir." },
    { id: "LT-308", title: "Prestataire absent (navette)", parties: "Corporate Cup ↔ Dakar Shuttle Pro", amount: 38000, status: "En médiation", age: "1 j", desc: "Navette non présentée à 7h30. Preuve GPS demandée." },
    { id: "LT-302", title: "Double facturation", parties: "Awa Ndiaye ↔ Padel House Ngor", amount: 20000, status: "Ouvert", age: "3 j", desc: "Deux débits Wave pour la même réservation." },
  ]);
  const [sel, setSel] = useState<Dispute | null>(null);
  const resolve = (decision: string) => { if (!sel) return; setItems((all) => all.map((d) => (d.id === sel.id ? { ...d, status: "Résolu" } : d))); toast({ title: `Litige ${sel.id} résolu`, body: decision }); setSel(null); };
  return (
    <div>
      <PageHeader title="Gestion des litiges" subtitle="Délai de résolution moyen : 26 h" />
      <div className="space-y-2">{items.map((d) => (
        <Card key={d.id} interactive onClick={() => setSel(d)} className="flex flex-wrap items-center gap-4 p-4">
          <AlertOctagon className={cn("h-5 w-5", d.status === "Résolu" ? "text-success" : "text-error")} />
          <div className="min-w-[220px] flex-1"><p className="font-semibold">{d.title}</p><p className="text-xs text-muted">{d.id} · {d.parties} · ouvert il y a {d.age}</p></div>
          <span className="tabular font-semibold">{fcfa(d.amount)}</span>
          <Badge tone={d.status === "Résolu" ? "success" : d.status === "En médiation" ? "warning" : "error"} dot>{d.status}</Badge>
        </Card>
      ))}</div>
      <Drawer open={!!sel} onClose={() => setSel(null)} title={`Litige ${sel?.id ?? ""}`} footer={sel?.status !== "Résolu" && <div className="grid gap-2"><Button block onClick={() => resolve("Remboursement intégral au client")}>Rembourser le client</Button><Button block variant="secondary" onClick={() => resolve("Remboursement partiel 50 %")}>Remboursement partiel 50 %</Button><Button block variant="ghost" onClick={() => resolve("Réclamation rejetée")}>Rejeter la réclamation</Button></div>}>
        {sel && <div className="space-y-4"><p className="font-semibold">{sel.title}</p><p className="text-sm text-muted">{sel.desc}</p><div className="space-y-2 text-sm">{[["Parties", sel.parties], ["Montant en jeu", fcfa(sel.amount)], ["Statut", sel.status]].map(([k, v]) => <div key={k} className="flex justify-between border-b border-border pb-2"><span className="text-muted">{k}</span><span>{v}</span></div>)}</div><Field label="Note interne"><Textarea placeholder="Ajouter une note pour l’équipe support…" /></Field></div>}
      </Drawer>
    </div>
  );
}

function AdminReports() {
  const { toast } = useStore();
  const [items, setItems] = useState([
    { id: "s1", t: "Avis", c: "« Arnaque, ne venez pas » — langage injurieux", who: "Avis sur Arena Almadies Five", n: 3 },
    { id: "s2", t: "Profil", c: "Faux profil suspecté (photo volée)", who: "Utilisateur Ousmane Sy", n: 2 },
    { id: "s3", t: "Comportement", c: "Joueur agressif pendant le match", who: "Match « Futsal du jeudi »", n: 4 },
    { id: "s4", t: "Avis", c: "Avis promotionnel (lien externe)", who: "Avis sur Kadr Photographie", n: 1 },
    { id: "s5", t: "Annonce", c: "Prix trompeur (frais cachés)", who: "Offre Dakar Shuttle Pro", n: 2 },
  ]);
  const act = (id: string, msg: string) => { setItems((i) => i.filter((x) => x.id !== id)); toast({ title: msg }); };
  return (
    <div>
      <PageHeader title="Avis & signalements" subtitle="Modération de la communauté" />
      {items.length ? <Card className="divide-y divide-border">{items.map((s) => (
        <div key={s.id} className="flex flex-wrap items-center gap-4 p-4"><Flag className="h-4 w-4 text-warning" /><div className="min-w-[220px] flex-1"><p className="text-sm font-semibold">{s.c}</p><p className="text-xs text-muted">{s.t} · {s.who} · {s.n} signalement(s)</p></div><div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => act(s.id, "Signalement classé sans suite")}>Ignorer</Button><Button size="sm" variant="secondary" onClick={() => act(s.id, "Contenu masqué")}>Masquer</Button><Button size="sm" variant="danger" onClick={() => act(s.id, "Compte averti")}>Avertir</Button></div></div>
      ))}</Card> : <EmptyState title="Aucun signalement en attente" description="La communauté se porte bien 👌" />}
    </div>
  );
}

function AdminRefunds() {
  const { toast } = useStore();
  const [rows, setRows] = useState([
    { id: "RF-120", who: "Moussa Diop", why: "Annulation > 24 h", amount: 25000, status: "À traiter" },
    { id: "RF-119", who: "Sacré-Cœur FC", why: "Forfait tournoi", amount: 50000, status: "À traiter" },
    { id: "RF-117", who: "Khady Mbaye", why: "Match annulé par l’organisateur", amount: 1000, status: "Effectué" },
    { id: "RF-115", who: "Awa Ndiaye", why: "Double débit", amount: 20000, status: "Effectué" },
  ]);
  const cols: Column<(typeof rows)[number]>[] = [
    { key: "id", header: "Réf.", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "w", header: "Bénéficiaire", render: (r) => r.who },
    { key: "y", header: "Motif", render: (r) => <span className="text-muted">{r.why}</span> },
    { key: "a", header: "Montant", align: "right", render: (r) => fcfa(r.amount) },
    { key: "s", header: "Statut", render: (r) => r.status === "Effectué" ? <Badge tone="success" dot>Effectué</Badge> : <Button size="sm" onClick={() => { setRows((all) => all.map((x) => (x.id === r.id ? { ...x, status: "Effectué" } : x))); toast({ title: `Remboursement ${r.id} effectué (simulé)` }); }}><Undo2 className="h-3.5 w-3.5" />Rembourser</Button> },
  ];
  return <div><PageHeader title="Gestion des remboursements" subtitle="Remboursements automatiques et manuels" /><DataTable columns={cols} rows={rows} /></div>;
}

function AdminStats() {
  const cities = [{ c: "Dakar", v: 46.2 }, { c: "Thiès (pilote)", v: 4.1 }, { c: "Saint-Louis (pilote)", v: 2.3 }];
  const sports = [{ s: "Football", v: 64 }, { s: "Basket", v: 14 }, { s: "Padel", v: 9 }, { s: "Tennis", v: 7 }, { s: "Autres", v: 6 }];
  const funnel = [{ l: "Visites fiche terrain", v: 100 }, { l: "Créneau sélectionné", v: 38 }, { l: "Paiement initié", v: 24 }, { l: "Réservation confirmée", v: 21 }];
  return (
    <div>
      <PageHeader title="Statistiques commerciales" subtitle="Indicateurs de traction de la marketplace" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label="Matchs créés / semaine" value="1 240" delta={9} /><Stat label="Temps moyen de remplissage" value="3 h 40" delta={-12} hint="plus court = mieux" /><Stat label="Rétention J30" value="46 %" delta={5} /><Stat label="CAC moyen" value={fcfa(1850)} /></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5"><p className="font-semibold">GMV par ville (M FCFA)</p><div className="mt-4 h-48"><ResponsiveContainer><BarChart data={cities} layout="vertical"><XAxis type="number" hide /><YAxis type="category" dataKey="c" {...ax} width={110} /><Tooltip contentStyle={tt} cursor={{ fill: "rgb(var(--surface-2))" }} /><Bar dataKey="v" fill="#B7F34A" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card className="p-5"><p className="font-semibold">Réservations par sport</p><div className="mt-4 space-y-3">{sports.map((s) => <div key={s.s}><div className="flex justify-between text-xs"><span>{s.s}</span><span className="tabular">{s.v} %</span></div><Progress className="mt-1 h-1.5" value={s.v} /></div>)}</div></Card>
        <Card className="p-5"><p className="font-semibold">Entonnoir de réservation</p><div className="mt-4 space-y-2">{funnel.map((f) => <div key={f.l}><div className="flex justify-between text-xs"><span className="text-muted">{f.l}</span><span className="tabular font-semibold">{f.v} %</span></div><div className="mt-1 h-6 rounded bg-primary/80" style={{ width: `${f.v}%` }} /></div>)}</div></Card>
      </div>
    </div>
  );
}

function AdminSettings() {
  const { toast } = useStore();
  const [maint, setMaint] = useState(false);
  const [kyc, setKyc] = useState(true);
  return (
    <div className="max-w-2xl">
      <PageHeader title="Paramètres globaux" />
      <Card className="space-y-4 p-5">
        <div className="grid gap-3 md:grid-cols-2"><Field label="Devise par défaut"><Select><option>XOF (FCFA)</option><option>EUR</option><option>USD</option></Select></Field><Field label="Langues actives"><Select><option>Français, English</option><option>Français, English, Wolof (bêta)</option></Select></Field></div>
        <Field label="Délai d’annulation gratuite (heures)"><Input type="number" defaultValue={24} /></Field>
        <div className="flex items-center justify-between rounded-md bg-surface-2/60 p-3"><span className="text-sm">Vérification téléphone obligatoire</span><Switch label="Vérification téléphone" checked={kyc} onChange={setKyc} /></div>
        <div className="flex items-center justify-between rounded-md bg-surface-2/60 p-3"><span className="text-sm">Mode maintenance</span><Switch label="Mode maintenance" checked={maint} onChange={setMaint} /></div>
        <Button onClick={() => toast({ title: "Paramètres globaux enregistrés" })}>Enregistrer</Button>
      </Card>
    </div>
  );
}

export const adminRoutes: Record<string, React.ComponentType> = {
  "admin-dashboard": AdminDashboard, "admin-users": AdminUsers, "admin-companies": AdminCompanies, "admin-validation": AdminValidation, "admin-venues": AdminVenues, "admin-categories": AdminCategories, "admin-bookings": AdminBookings, "admin-transactions": AdminTransactions, "admin-commissions": AdminCommissions, "admin-subscriptions": AdminSubscriptions, "admin-disputes": AdminDisputes, "admin-reports": AdminReports, "admin-refunds": AdminRefunds, "admin-stats": AdminStats, "admin-settings": AdminSettings,
};

export function AdminSpace({ route }: { route: string }) {
  const nav: NavItem[] = [
    { route: "admin-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { route: "admin-users", label: "Utilisateurs", icon: Users },
    { route: "admin-companies", label: "Entreprises", icon: Building2 },
    { route: "admin-validation", label: "Validation KYB", icon: ShieldCheck, badge: 4 },
    { route: "admin-venues", label: "Infrastructures", icon: MapPinned },
    { route: "admin-categories", label: "Catégories", icon: FolderTree },
    { route: "admin-bookings", label: "Réservations", icon: CalendarCheck },
    { route: "admin-transactions", label: "Transactions", icon: CreditCard },
    { route: "admin-commissions", label: "Commissions", icon: Percent },
    { route: "admin-subscriptions", label: "Abonnements", icon: RotateCcw },
    { route: "admin-disputes", label: "Litiges", icon: AlertOctagon, badge: 3 },
    { route: "admin-reports", label: "Avis & signalements", icon: Flag },
    { route: "admin-refunds", label: "Remboursements", icon: Undo2 },
    { route: "admin-stats", label: "Statistiques", icon: BarChart3 },
  ];
  const Screen = adminRoutes[route] ?? AdminDashboard;
  return (
    <ConsoleShell space="SportMatch Admin" nav={nav} footerNav={[{ route: "admin-settings", label: "Paramètres globaux", icon: Settings }]} user={{ name: "Fatima Diallo", role: "Super admin" }}>
      <div key={route} className="animate-fade-up"><Screen /></div>
    </ConsoleShell>
  );
}
export { useMemo, compact };
