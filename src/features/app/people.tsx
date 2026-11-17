"use client";
import { Award, BarChart3, Bell, Calendar, CalendarCheck, ChevronRight, CreditCard, Globe, History, LogOut, MessageCircle, Moon, Search, Send, Settings as SettingsIcon, Shield, Trophy, UserPlus, Users, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { MobileHeader } from "@/components/shells/mobile-shell";
import { Avatar, Badge, Button, Card, Chip, EmptyState, Progress, ScoreRing, Segmented, Switch, Tabs } from "@/components/ui";
import { SportVisual } from "@/components/visual/sport-visual";
import { chatSeed, conversations } from "@/data/misc";
import { compatibility, ME, playerById, players } from "@/data/players";
import { useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import { cn, fcfa } from "@/lib/utils";
import { SPORTS, sportEmoji, sportLabel } from "./shared";

export function PlayerSearch() {
  const { navigate, back } = useRouter();
  const [q, setQ] = useState("");
  const [sport, setSport] = useState("football");
  const [level, setLevel] = useState<string | null>(null);
  const [tonight, setTonight] = useState(false);
  const list = useMemo(() => players.filter((p) => p.id !== ME && p.sports.includes(sport as never) && (!level || p.level === level) && (!tonight || p.availableTonight) && (!q || p.name.toLowerCase().includes(q.toLowerCase()) || p.district.toLowerCase().includes(q.toLowerCase())))
    .map((p) => ({ p, s: compatibility(p, sport, "Confirmé") })).sort((a, b) => b.s - a.s), [q, sport, level, tonight]);
  return (
    <div className="pb-8">
      <MobileHeader title="Trouver des joueurs" onBack={back} />
      <div className="space-y-3 p-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou quartier" aria-label="Rechercher un joueur" className="h-11 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm placeholder:text-muted focus:border-primary focus:outline-none" /></div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">{SPORTS.slice(0, 6).map((s) => <Chip key={s.key} active={sport === s.key} onClick={() => setSport(s.key)}>{s.emoji} {s.label}</Chip>)}</div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <Chip active={tonight} onClick={() => setTonight(!tonight)}>Dispo ce soir</Chip>
          {["Intermédiaire", "Confirmé", "Expert"].map((l) => <Chip key={l} active={level === l} onClick={() => setLevel(level === l ? null : l)}>{l}</Chip>)}
        </div>
        <p className="text-xs text-muted"><span className="tabular font-semibold text-fg">{list.length}</span> joueurs triés par compatibilité</p>
        {list.length ? list.map(({ p, s }) => (
          <Card key={p.id} interactive onClick={() => navigate("app-player", { id: p.id })} className="flex items-center gap-3 p-3">
            <Avatar name={p.name} size={44} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{p.name}</p>
              <p className="truncate text-xs text-muted">{p.level} · {p.position} · {p.district} ({p.distanceKm} km)</p>
              <div className="mt-1 flex gap-1.5">{p.availableTonight && <Badge tone="success" className="h-5">Dispo ce soir</Badge>}<Badge className="h-5">Fiabilité {p.reliability}</Badge></div>
            </div>
            <ScoreRing value={s} size={40} label="Compatibilité" />
          </Card>
        )) : <EmptyState icon={<Users />} title="Aucun joueur trouvé" description="Retire un filtre pour élargir la recherche." />}
      </div>
    </div>
  );
}

export function PlayerProfile() {
  const { params, navigate, back } = useRouter();
  const { toast, matches } = useStore();
  const p = playerById(params.id ?? "p1");
  const [following, setFollowing] = useState(false);
  const isMe = p.id === ME;
  const myOrganized = matches.filter((m) => m.organizerId === ME && m.participants.length < m.capacity);
  return (
    <div className="pb-8">
      <div className="relative">
        <MobileHeader transparent onBack={back} />
        <SportVisual sport={p.sports[0]} seed={Number(p.id.slice(1))} className="h-32" />
      </div>
      <div className="relative z-10 -mt-10 px-5">
        <Avatar name={p.name} size={84} className="ring-4 ring-bg" />
        <h1 className="mt-3 font-display text-2xl font-extrabold">{p.name}</h1>
        <p className="text-sm text-muted">{p.district} · {p.level} · {p.position}</p>
        <p className="mt-2 text-sm">{p.bio}</p>
        <div className="mt-2 flex gap-1.5">{p.sports.map((s) => <Badge key={s}>{sportEmoji(s)} {sportLabel(s)}</Badge>)}</div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Card className="p-3"><p className="tabular font-display text-xl font-bold">{p.matches}</p><p className="text-2xs text-muted">Matchs</p></Card>
          <Card className="p-3"><p className="tabular font-display text-xl font-bold">{p.rating}</p><p className="text-2xs text-muted">Note fair-play</p></Card>
          <Card className="flex flex-col items-center p-3"><ScoreRing value={p.reliability} size={36} label="Fiabilité" /><p className="mt-1 text-2xs text-muted">Fiabilité</p></Card>
        </div>
        <Card className="mt-4 p-4">
          <p className="text-sm font-semibold">Détail du score de fiabilité</p>
          {[{ l: "Présences confirmées", v: 98 }, { l: "Ponctualité", v: 91 }, { l: "Annulations tardives", v: 100 - (100 - p.reliability) * 2 }].map((x) => (
            <div key={x.l} className="mt-3"><div className="flex justify-between text-xs"><span className="text-muted">{x.l}</span><span className="tabular font-semibold">{Math.max(0, x.v)} %</span></div><Progress className="mt-1 h-1.5" value={Math.max(0, x.v)} /></div>
          ))}
          <p className="mt-3 text-2xs text-muted">Score transparent et contestable depuis les paramètres.</p>
        </Card>
        {!isMe && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant={following ? "secondary" : "outline"} onClick={() => { setFollowing(!following); toast({ title: following ? "Abonnement retiré" : `Tu suis ${p.name.split(" ")[0]}` }); }}><UserPlus className="h-4 w-4" />{following ? "Suivi" : "Suivre"}</Button>
            <Button variant="outline" onClick={() => navigate("app-chat", { id: "c2", name: p.name })}><MessageCircle className="h-4 w-4" />Message</Button>
            <Button className="col-span-2" disabled={!myOrganized.length} onClick={() => { toast({ title: `Invitation envoyée à ${p.name.split(" ")[0]}`, body: myOrganized[0]?.title }); }}><Send className="h-4 w-4" />Inviter à mon match</Button>
          </div>
        )}
      </div>
    </div>
  );
}

const weekly = [{ d: "Lun", m: 1 }, { d: "Mar", m: 2 }, { d: "Mer", m: 0 }, { d: "Jeu", m: 1 }, { d: "Ven", m: 0 }, { d: "Sam", m: 2 }, { d: "Dim", m: 1 }];

export function Stats() {
  const { back, navigate } = useRouter();
  const [scope, setScope] = useState<"quartier" | "ville">("quartier");
  const board = [...players].filter((p) => p.sports.includes("football")).sort((a, b) => b.matches * b.reliability - a.matches * a.reliability).slice(0, 8);
  return (
    <div className="pb-8">
      <MobileHeader title="Classement & statistiques" onBack={back} />
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[{ l: "Matchs joués", v: "87" }, { l: "Victoires", v: "54 %" }, { l: "Buts", v: "41" }].map((s) => <Card key={s.l} className="p-3"><p className="tabular font-display text-xl font-bold">{s.v}</p><p className="text-2xs text-muted">{s.l}</p></Card>)}
        </div>
        <Card className="p-4">
          <p className="text-sm font-semibold">Activité · 7 derniers jours</p>
          <div className="mt-3 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}><XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={11} stroke="rgb(var(--muted))" /><Tooltip cursor={{ fill: "rgb(var(--surface-2))" }} contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v} match(s)`, ""]} /><Bar dataKey="m" fill="rgb(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">Classement football</h2><Segmented size="sm" value={scope} onChange={setScope} options={[{ value: "quartier", label: "Mermoz" }, { value: "ville", label: "Dakar" }]} /></div>
        <Card className="divide-y divide-border">
          {board.map((p, i) => (
            <button key={p.id} onClick={() => navigate("app-player", { id: p.id })} className={cn("flex w-full items-center gap-3 p-3 text-left hover:bg-surface-2/50", p.id === ME && "bg-primary/5")}>
              <span className={cn("tabular w-6 text-center font-display font-bold", i < 3 ? "text-primary-ink" : "text-muted")}>{i + 1}</span>
              <Avatar name={p.name} size={32} />
              <span className="flex-1 text-sm font-semibold">{p.id === ME ? "Toi" : p.name}</span>
              <span className="tabular text-xs text-muted">{scope === "ville" ? p.matches + 12 : p.matches} matchs</span>
              {i < 3 && <Trophy className="h-4 w-4 text-warning" />}
            </button>
          ))}
        </Card>
        <h2 className="font-display text-lg font-bold">Badges</h2>
        <div className="grid grid-cols-4 gap-2">
          {[{ l: "Fiable", i: Shield }, { l: "50 matchs", i: Award }, { l: "Organisateur", i: Users }, { l: "Régulier", i: Calendar }].map((b) => <Card key={b.l} className="flex flex-col items-center gap-1 p-3"><b.i className="h-5 w-5 text-primary-ink" /><span className="text-2xs font-semibold">{b.l}</span></Card>)}
        </div>
      </div>
    </div>
  );
}

export function SportHistory() {
  const { back } = useRouter();
  const items = [
    { t: "Five du samedi", s: "football", d: "Sam. 14 nov.", r: "Victoire 7-5", rate: "4,8 fair-play" },
    { t: "Padel au coucher du soleil", s: "padel", d: "Mer. 11 nov.", r: "Défaite 4-6 6-3 5-7", rate: "5,0" },
    { t: "Run basket Ouakam", s: "basketball", d: "Lun. 9 nov.", r: "Victoire 21-17", rate: "4,6" },
    { t: "Foot à 7 · Mermoz", s: "football", d: "Jeu. 5 nov.", r: "Nul 3-3", rate: "4,9" },
  ];
  return (
    <div className="pb-8">
      <MobileHeader title="Historique sportif" onBack={back} />
      <div className="relative space-y-3 p-4 before:absolute before:bottom-6 before:left-[34px] before:top-6 before:w-px before:bg-border">
        {items.map((it) => (
          <div key={it.t + it.d} className="relative flex gap-3">
            <span className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-base">{sportEmoji(it.s)}</span>
            <Card className="flex-1 p-3"><div className="flex justify-between"><p className="text-sm font-semibold">{it.t}</p><span className="text-2xs text-muted">{it.d}</span></div><p className="mt-1 text-xs">{it.r}</p><p className="text-2xs text-muted">Note reçue : {it.rate}</p></Card>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Bookings() {
  const { navigate } = useRouter();
  const { bookings, toast } = useStore();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const list = bookings.filter((b) => (tab === "upcoming" ? b.status === "Confirmée" || b.status === "En attente" : b.status === "Terminée" || b.status === "Annulée"));
  const tone = (s: string) => (s === "Confirmée" ? "success" : s === "En attente" ? "warning" : s === "Annulée" ? "error" : "neutral") as "success";
  return (
    <div className="pb-8">
      <div className="sticky top-0 z-20 border-b border-border bg-bg/95 px-4 pt-4 backdrop-blur">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Réservations</h1>
        <Tabs className="mt-2 border-0" value={tab} onChange={setTab} tabs={[{ value: "upcoming", label: "À venir" }, { value: "past", label: "Historique" }]} />
      </div>
      <div className="space-y-3 p-4">
        {list.length ? list.map((b) => (
          <Card key={b.id} className="p-4">
            <div className="flex items-start gap-3">
              {b.sport && <span className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-2 text-lg">{sportEmoji(b.sport)}</span>}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2"><p className="truncate text-sm font-semibold">{b.title}</p><Badge tone={tone(b.status)} dot>{b.status}</Badge></div>
                <p className="text-xs text-muted">{b.subtitle}</p>
                <p className="mt-1 text-xs">{b.dateLabel}</p>
              </div>
            </div>
            <div className="mt-3 rounded-md bg-surface-2/60 p-2.5">
              <div className="flex justify-between text-xs"><span className="text-muted">Paiement {b.payment.toLowerCase()}</span><span className="tabular font-semibold">{fcfa(b.amount * b.paidRatio)} / {fcfa(b.amount)}</span></div>
              <Progress className="mt-1.5 h-1.5" tone={b.paidRatio >= 1 ? "success" : "warning"} value={b.paidRatio * 100} />
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => toast({ title: "Facture téléchargée (simulée)" })}>Facture</Button>
              {tab === "upcoming" ? <Button size="sm" variant="ghost" onClick={() => toast({ title: "Demande d’annulation envoyée", body: "Remboursement selon la politique du terrain.", tone: "info" })}>Annuler</Button>
                : <Button size="sm" variant="ghost" onClick={() => navigate("app-explore")}>Réserver à nouveau</Button>}
            </div>
          </Card>
        )) : <EmptyState icon={<CalendarCheck />} title="Aucune réservation à venir" description="Réserve un terrain en quelques clics." action={<Button size="sm" onClick={() => navigate("app-explore")}>Explorer les terrains</Button>} />}
      </div>
    </div>
  );
}

export function Notifications() {
  const { back, navigate } = useRouter();
  const { notifications, markAllRead } = useStore();
  const icons = { match: Trophy, booking: CalendarCheck, payment: Wallet, smartfill: Users, system: Bell };
  return (
    <div className="pb-8">
      <MobileHeader title="Notifications" onBack={back} right={<Button size="sm" variant="ghost" onClick={markAllRead}>Tout lire</Button>} />
      <div className="divide-y divide-border">
        {notifications.map((n) => {
          const I = icons[n.kind];
          return (
            <button key={n.id} onClick={() => navigate(n.kind === "booking" ? "app-bookings" : "app-match", { id: "m1" })} className={cn("flex w-full gap-3 px-4 py-3.5 text-left hover:bg-surface-2/50", !n.read && "bg-primary/5")}>
              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", n.read ? "bg-surface-2 text-muted" : "bg-primary text-primary-fg")}><I className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{n.title}</span><span className="block text-xs text-muted">{n.body}</span><span className="mt-1 block text-2xs text-muted">{n.time}</span></span>
              {!n.read && <span className="mt-2 h-2 w-2 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Messages() {
  const { back, navigate } = useRouter();
  return (
    <div className="pb-8">
      <MobileHeader title="Messagerie" onBack={back} />
      <div className="divide-y divide-border">
        {conversations.map((c) => (
          <button key={c.id} onClick={() => navigate("app-chat", { id: c.id, name: c.name })} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2/50">
            <Avatar name={c.name} size={44} />
            <span className="min-w-0 flex-1"><span className="flex justify-between"><span className="truncate text-sm font-semibold">{c.name}</span><span className="text-2xs text-muted">{c.time}</span></span><span className="block truncate text-xs text-muted">{c.last}</span></span>
            {c.unread > 0 && <span className="tabular flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-2xs font-bold text-primary-fg">{c.unread}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Chat() {
  const { params, back } = useRouter();
  const [msgs, setMsgs] = useState(chatSeed[params.id ?? "c1"] ?? []);
  const [text, setText] = useState("");
  const send = () => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { from: "Moi", text, time: "maintenant", me: true }]);
    setText("");
    setTimeout(() => setMsgs((m) => [...m, { from: "Awa Ndiaye", text: "Parfait, à tout à l’heure ⚽", time: "maintenant" }]), 1200);
  };
  return (
    <div className="flex min-h-full flex-col">
      <MobileHeader title={params.name ?? "Discussion"} onBack={back} />
      <div className="flex-1 space-y-3 p-4">
        {msgs.map((m, i) => (
          <div key={i} className={cn("flex flex-col", m.me ? "items-end" : "items-start")}>
            {!m.me && <span className="mb-0.5 text-2xs text-muted">{m.from}</span>}
            <span className={cn("max-w-[80%] rounded-2xl px-3.5 py-2 text-sm animate-fade-up", m.me ? "rounded-br-md bg-primary text-primary-fg" : "rounded-bl-md bg-surface-2")}>{m.text}</span>
            <span className="mt-0.5 text-[10px] text-muted">{m.time}</span>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="sticky bottom-0 flex gap-2 border-t border-border bg-bg p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrire un message…" aria-label="Message" className="h-11 flex-1 rounded-full border border-border bg-surface px-4 text-sm focus:border-primary focus:outline-none" />
        <Button type="submit" size="icon" className="rounded-full" aria-label="Envoyer"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}

export function Profile() {
  const { navigate } = useRouter();
  const me = playerById(ME);
  const links = [
    { l: "Classement & statistiques", i: BarChart3, r: "app-stats" },
    { l: "Historique sportif", i: History, r: "app-history" },
    { l: "Mes réservations", i: CalendarCheck, r: "app-bookings" },
    { l: "Messagerie", i: MessageCircle, r: "app-messages" },
    { l: "Paramètres", i: SettingsIcon, r: "app-settings" },
  ];
  return (
    <div className="pb-8">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-4">
          <Avatar name={me.name} size={72} />
          <div className="flex-1"><h1 className="font-display text-xl font-extrabold">{me.name}</h1><p className="text-sm text-muted">{me.district} · {me.level}</p><Badge tone="primary" className="mt-1.5">Membre Plus</Badge></div>
          <ScoreRing value={me.reliability} size={52} label="Fiabilité" />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          {[{ l: "Matchs", v: me.matches }, { l: "Organisés", v: 23 }, { l: "Fair-play", v: me.rating }].map((s) => <Card key={s.l} className="p-3"><p className="tabular font-display text-xl font-bold">{s.v}</p><p className="text-2xs text-muted">{s.l}</p></Card>)}
        </div>
        <Card className="mt-4 divide-y divide-border">
          {links.map((x) => <button key={x.l} onClick={() => navigate(x.r)} className="flex w-full items-center gap-3 p-3.5 text-left text-sm hover:bg-surface-2/50"><x.i className="h-4 w-4 text-muted" /><span className="flex-1 font-medium">{x.l}</span><ChevronRight className="h-4 w-4 text-muted" /></button>)}
        </Card>
        <Card className="mt-4 p-4">
          <p className="text-sm font-semibold">Espaces professionnels</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate("events-dashboard")}>Espace organisateur</Button>
            <Button variant="secondary" size="sm" onClick={() => navigate("business-dashboard")}>Espace prestataire</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function Settings() {
  const { back, navigate } = useRouter();
  const { theme, setTheme, lang, setLang, toast } = useStore();
  const [push, setPush] = useState(true);
  const [smart, setSmart] = useState(true);
  const [loc, setLoc] = useState(true);
  return (
    <div className="pb-8">
      <MobileHeader title="Paramètres" onBack={back} />
      <div className="space-y-4 p-4">
        <Card className="divide-y divide-border">
          <div className="flex items-center gap-3 p-3.5"><Moon className="h-4 w-4 text-muted" /><span className="flex-1 text-sm font-medium">Mode sombre</span><Switch label="Mode sombre" checked={theme === "dark"} onChange={(v) => setTheme(v ? "dark" : "light")} /></div>
          <div className="flex items-center gap-3 p-3.5"><Globe className="h-4 w-4 text-muted" /><span className="flex-1 text-sm font-medium">Langue</span><Segmented size="sm" value={lang} onChange={setLang} options={[{ value: "fr", label: "FR" }, { value: "en", label: "EN" }]} /></div>
          <div className="flex items-center gap-3 p-3.5"><Wallet className="h-4 w-4 text-muted" /><span className="flex-1 text-sm font-medium">Devise</span><span className="text-sm text-muted">FCFA (XOF)</span></div>
        </Card>
        <Card className="divide-y divide-border">
          <div className="flex items-center gap-3 p-3.5"><Bell className="h-4 w-4 text-muted" /><span className="flex-1 text-sm font-medium">Notifications push</span><Switch label="Notifications push" checked={push} onChange={setPush} /></div>
          <div className="flex items-center gap-3 p-3.5"><Users className="h-4 w-4 text-muted" /><span className="flex-1"><span className="block text-sm font-medium">Recevoir les invitations Smart Fill</span><span className="text-2xs text-muted">Les organisateurs proches peuvent te proposer une place</span></span><Switch label="Invitations Smart Fill" checked={smart} onChange={setSmart} /></div>
          <div className="flex items-center gap-3 p-3.5"><Shield className="h-4 w-4 text-muted" /><span className="flex-1"><span className="block text-sm font-medium">Partager ma position approximative</span><span className="text-2xs text-muted">Utilisée uniquement pour calculer les distances</span></span><Switch label="Partager la position" checked={loc} onChange={setLoc} /></div>
        </Card>
        <Card className="divide-y divide-border">
          <button onClick={() => toast({ title: "Moyens de paiement : Wave, Orange Money (démo)" })} className="flex w-full items-center gap-3 p-3.5 text-left text-sm"><CreditCard className="h-4 w-4 text-muted" /><span className="flex-1 font-medium">Moyens de paiement</span><ChevronRight className="h-4 w-4 text-muted" /></button>
          <button onClick={() => toast({ title: "Demande de révision envoyée", body: "Réponse sous 48 h (simulation)." })} className="flex w-full items-center gap-3 p-3.5 text-left text-sm"><Shield className="h-4 w-4 text-muted" /><span className="flex-1 font-medium">Contester mon score de fiabilité</span><ChevronRight className="h-4 w-4 text-muted" /></button>
        </Card>
        <Button variant="outline" block onClick={() => navigate("app-splash")}><LogOut className="h-4 w-4" />Se déconnecter (revoir l’onboarding)</Button>
      </div>
    </div>
  );
}
