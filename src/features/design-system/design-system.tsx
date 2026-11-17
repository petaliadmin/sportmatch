"use client";
import { ArrowLeft, Bell, Check, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/shells/brand";
import { ThemeToggle } from "@/components/shells/console-shell";
import { Avatar, AvatarStack, Badge, Button, Card, CardSkeleton, Checkbox, Chip, DataTable, DateStrip, Drawer, EmptyState, ErrorState, Field, Input, Menu, Modal, MonthCalendar, Progress, Rating, ScoreRing, Segmented, Select, SlotGrid, Stat, Stepper, Switch, Tabs, Textarea, Verified } from "@/components/ui";
import { useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import { fcfa } from "@/lib/utils";

const colorTokens = [
  { n: "bg", hex: "#101A17", l: "Background" }, { n: "surface", hex: "#182420", l: "Surface" }, { n: "surface-2", hex: "#202D28", l: "Secondary" },
  { n: "primary", hex: "#B7F34A", l: "Primary" }, { n: "fg", hex: "#FFFFFF", l: "Text" }, { n: "muted", hex: "#89958E", l: "Text muted" },
  { n: "success", hex: "#22C55E", l: "Success" }, { n: "warning", hex: "#F59E0B", l: "Warning" }, { n: "error", hex: "#EF4444", l: "Error" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-20 border-t border-border py-10"><h2 className="mb-5 font-display text-xl font-bold">{title}</h2>{children}</section>;
}

export function DesignSystem() {
  const { navigate } = useRouter();
  const { toast } = useStore();
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [tab, setTab] = useState<"a" | "b" | "c">("a");
  const [seg, setSeg] = useState<"d" | "w" | "m">("w");
  const [sw, setSw] = useState(true);
  const [cb, setCb] = useState(true);
  const [n, setN] = useState(4);
  const [date, setDate] = useState(new Date());
  const [slots, setSlots] = useState<string[]>(["19:00"]);
  return (
    <div className="mx-auto max-w-6xl px-5 pb-20">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-bg/90 backdrop-blur">
        <button onClick={() => navigate("hub")} className="flex items-center gap-2 text-sm text-muted hover:text-fg"><ArrowLeft className="h-4 w-4" /></button>
        <Logo />
        <span className="text-sm font-semibold text-muted">Design System v0.1</span>
        <span className="flex-1" />
        <ThemeToggle />
      </header>
      <div className="py-10">
        <Badge tone="primary">Fondations partagées · App, Events, Business, Admin</Badge>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">SportTech Premium</h1>
        <p className="mt-2 max-w-2xl text-muted">Sombre par défaut, lime électrique pour l’action. Tous les tokens sont des variables CSS : le thème clair est un simple changement de classe. Bascule le thème en haut à droite pour vérifier chaque composant.</p>
      </div>

      <Section id="colors" title="Couleurs">
        <div className="grid grid-cols-3 gap-3 md:grid-cols-5 lg:grid-cols-9">
          {colorTokens.map((c) => <div key={c.n}><div className={`h-16 rounded-lg border border-border bg-${c.n}`} style={{ background: `rgb(var(--${c.n}))` }} /><p className="mt-2 text-xs font-semibold">{c.l}</p><p className="font-mono text-2xs text-muted">--{c.n}</p><p className="font-mono text-2xs text-muted">{c.hex}</p></div>)}
        </div>
      </Section>

      <Section id="type" title="Typographie">
        <div className="space-y-4">
          <p className="font-display text-5xl font-extrabold tracking-tight">Display 52 · Manrope 800</p>
          <p className="font-display text-3xl font-bold tracking-tight">Heading 30 · Manrope 700</p>
          <p className="font-display text-xl font-bold">Title 20 · Manrope 700</p>
          <p className="text-base">Body 15 · Inter 400 — Trouve un match près de chez toi, à ton niveau.</p>
          <p className="text-sm text-muted">Small 14 · Inter 400 muted</p>
          <p className="tabular text-2xl font-bold">Chiffres tabulaires · {fcfa(1234567)}</p>
        </div>
      </Section>

      <Section id="spacing" title="Espacements, rayons, ombres">
        <div className="flex flex-wrap items-end gap-4">{[4, 8, 12, 16, 20, 24, 32, 48].map((s) => <div key={s} className="text-center"><div className="bg-primary/70" style={{ width: s, height: s }} /><p className="mt-1 font-mono text-2xs text-muted">{s}</p></div>)}</div>
        <div className="mt-6 flex flex-wrap gap-4">{[["sm", 6], ["md", 10], ["lg", 14], ["xl", 18], ["2xl", 24]].map(([k, v]) => <div key={k} className="flex h-20 w-28 flex-col items-center justify-center border border-border bg-surface text-xs" style={{ borderRadius: v as number }}><span className="font-semibold">{k}</span><span className="text-muted">{v}px</span></div>)}</div>
        <div className="mt-6 flex flex-wrap gap-6"><div className="h-20 w-36 rounded-lg bg-surface shadow-card" /><div className="h-20 w-36 rounded-lg bg-surface shadow-pop" /></div>
        <p className="mt-3 text-xs text-muted">Breakpoints : sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536</p>
      </Section>

      <Section id="buttons" title="Boutons & états interactifs">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button variant="danger"><Trash2 className="h-4 w-4" />Danger</Button><Button variant="link">Link</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3"><Button size="sm">Small</Button><Button>Medium</Button><Button size="lg">Large</Button><Button size="icon" aria-label="Ajouter"><Plus className="h-4 w-4" /></Button><Button loading>Chargement</Button><Button disabled>Désactivé</Button></div>
      </Section>

      <Section id="forms" title="Formulaires">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Input" hint="Texte d’aide"><Input placeholder="Placeholder" /></Field>
          <Field label="Avec icône"><Input icon={<Search />} placeholder="Rechercher" /></Field>
          <Field label="Erreur" error="Numéro sénégalais attendu"><Input aria-invalid defaultValue="12345" /></Field>
          <Field label="Select"><Select><option>Football</option><option>Basketball</option></Select></Field>
          <Field label="Date"><Input type="date" /></Field>
          <Field label="Heure"><Input type="time" defaultValue="19:00" /></Field>
          <Field label="Textarea" className="md:col-span-2"><Textarea placeholder="Message…" /></Field>
          <div className="space-y-3"><div className="flex items-center gap-3"><Switch label="Switch" checked={sw} onChange={setSw} /><span className="text-sm">Switch</span></div><Checkbox checked={cb} onChange={setCb} label="Checkbox" /><Stepper value={n} onChange={setN} /></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3"><Segmented value={seg} onChange={setSeg} options={[{ value: "d", label: "Jour" }, { value: "w", label: "Semaine" }, { value: "m", label: "Mois" }]} /><Chip active>Chip actif</Chip><Chip>Chip</Chip></div>
      </Section>

      <Section id="pickers" title="Date pickers, créneaux, calendrier">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4"><DateStrip value={date} onChange={setDate} /><SlotGrid slots={[{ time: "17:00", status: "free", price: 25000 }, { time: "18:00", status: "peak", price: 30000 }, { time: "19:00", status: "peak", price: 30000 }, { time: "20:00", status: "booked", price: 30000 }, { time: "21:00", status: "free", price: 25000 }, { time: "22:00", status: "free", price: 25000 }]} selected={slots} onToggle={(t) => setSlots((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))} /></div>
          <Card className="p-4"><MonthCalendar value={date} onChange={setDate} marks={{ 18: "free", 19: "busy", 20: "full", 22: "free" }} /></Card>
        </div>
      </Section>

      <Section id="data" title="Cartes, badges, données">
        <div className="flex flex-wrap gap-2"><Badge>Neutral</Badge><Badge tone="primary">Primary</Badge><Badge tone="success" dot>Confirmée</Badge><Badge tone="warning" dot>En attente</Badge><Badge tone="error" dot>Annulée</Badge><Badge tone="info">Info</Badge><Badge tone="outline">Outline</Badge><Verified /><Rating value={4.8} count={312} /></div>
        <div className="mt-5 grid gap-4 md:grid-cols-4"><Stat label="Revenus" value={fcfa(2900000)} delta={12} /><Card className="flex items-center gap-4 p-4"><ScoreRing value={94} size={56} /><div><p className="font-semibold">Fiabilité</p><p className="text-xs text-muted">ScoreRing</p></div></Card><Card className="space-y-3 p-4"><Progress value={80} /><Progress value={55} tone="warning" /><Progress value={30} tone="error" /></Card><Card className="flex items-center gap-3 p-4"><Avatar name="Awa Ndiaye" /><AvatarStack names={["A B", "C D", "E F", "G H", "I J", "K L"]} /></Card></div>
        <div className="mt-5"><DataTable columns={[{ key: "n", header: "Nom", render: (r: { id: string; n: string; v: number }) => r.n, sort: (r) => r.n }, { key: "v", header: "Montant", align: "right", render: (r) => fcfa(r.v), sort: (r) => r.v }]} rows={[{ id: "1", n: "Arena Almadies", v: 30000 }, { id: "2", n: "Padel House", v: 20000 }, { id: "3", n: "Gymnase Liberté", v: 35000 }]} /></div>
      </Section>

      <Section id="nav" title="Navigation, tabs, menus">
        <Tabs value={tab} onChange={setTab} tabs={[{ value: "a", label: "À venir", count: 3 }, { value: "b", label: "Historique" }, { value: "c", label: "Annulées" }]} />
        <div className="mt-4"><Menu trigger={<span className="inline-flex h-10 cursor-pointer items-center rounded-md border border-border px-4 text-sm font-semibold">Dropdown ▾</span>} align="left" items={[{ label: "Modifier", onClick: () => toast({ title: "Modifier" }) }, { label: "Dupliquer", onClick: () => toast({ title: "Dupliqué" }) }, { label: "Supprimer", danger: true, onClick: () => toast({ title: "Supprimé", tone: "error" }) }]} /></div>
      </Section>

      <Section id="overlays" title="Modals, drawers, toasts">
        <div className="flex flex-wrap gap-3"><Button variant="secondary" onClick={() => setModal(true)}>Ouvrir un modal</Button><Button variant="secondary" onClick={() => setDrawer(true)}>Ouvrir un drawer</Button><Button variant="secondary" onClick={() => toast({ title: "Réservation confirmée", body: "Toast success" })}><Check className="h-4 w-4" />Toast success</Button><Button variant="secondary" onClick={() => toast({ title: "Paiement refusé", body: "Toast error", tone: "error" })}>Toast error</Button><Button variant="secondary" onClick={() => toast({ title: "Nouvelle notification", tone: "info" })}><Bell className="h-4 w-4" />Toast info</Button></div>
        <Modal open={modal} onClose={() => setModal(false)} title="Confirmer la réservation" description="Modal centré sur desktop, bottom-sheet sur mobile." footer={<><Button variant="ghost" onClick={() => setModal(false)}>Annuler</Button><Button onClick={() => setModal(false)}>Confirmer</Button></>}><p className="text-sm text-muted">Échap ou clic sur le fond pour fermer. Le focus est placé dans la boîte.</p></Modal>
        <Drawer open={drawer} onClose={() => setDrawer(false)} title="Drawer"><p className="text-sm text-muted">Utilisé pour les filtres, les détails de transaction et les affectations.</p></Drawer>
      </Section>

      <Section id="states" title="États vides, chargement, erreur">
        <div className="grid gap-4 md:grid-cols-3"><EmptyState title="Aucune réservation" description="Réserve un terrain en quelques clics." action={<Button size="sm">Explorer</Button>} /><CardSkeleton rows={2} /><ErrorState onRetry={() => toast({ title: "Nouvelle tentative…", tone: "info" })} /></div>
      </Section>
    </div>
  );
}
