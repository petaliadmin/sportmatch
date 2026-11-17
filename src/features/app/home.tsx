"use client";
import { Bell, CalendarPlus, ChevronRight, Compass, MapPin, MessageCircle, Search, Sparkles, Swords, Users } from "lucide-react";
import { Logo } from "@/components/shells/brand";
import { Avatar, Badge, Card, ScoreRing, SectionHeader } from "@/components/ui";
import { DakarMap } from "@/components/visual/dakar-map";
import { playerById, ME } from "@/data/players";
import { venues } from "@/data/venues";
import { useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import { fcfa } from "@/lib/utils";
import { MatchCard, sportLabel } from "./shared";

export function Home() {
  const { navigate } = useRouter();
  const { matches, notifications, favoriteSports } = useStore();
  const me = playerById(ME);
  const unread = notifications.filter((n) => !n.read).length;
  const mine = matches.filter((m) => m.participants.includes(ME)).sort((a, b) => a.dayOffset - b.dayOffset);
  const next = mine[0];
  const suggestions = matches.filter((m) => !m.participants.includes(ME) && favoriteSports.includes(m.sport) && m.participants.length < m.capacity);
  const actions = [
    { label: "Trouver un match", icon: Search, route: "app-matches" },
    { label: "Créer un match", icon: CalendarPlus, route: "app-create-match" },
    { label: "Réserver un terrain", icon: Compass, route: "app-explore" },
    { label: "Trouver des joueurs", icon: Users, route: "app-players" },
  ];
  return (
    <div className="pb-8">
      <header className="flex items-center justify-between px-5 pb-2 pt-4">
        <Logo compact />
        <div className="flex gap-1">
          <button aria-label="Messagerie" onClick={() => navigate("app-messages")} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-2"><MessageCircle className="h-5 w-5" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" /></button>
          <button aria-label={`Notifications, ${unread} non lues`} onClick={() => navigate("app-notifications")} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-2">
            <Bell className="h-5 w-5" />
            {unread > 0 && <span className="tabular absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-fg">{unread}</span>}
          </button>
        </div>
      </header>

      <section className="px-5">
        <p className="text-sm text-muted">Bonsoir {me.name.split(" ")[0]} 👋</p>
        <h1 className="font-display text-[26px] font-extrabold leading-tight tracking-tight">Prêt pour ton prochain match ?</h1>
        <button onClick={() => navigate("app-matches")} className="mt-4 flex h-12 w-full items-center gap-3 rounded-lg border border-border bg-surface px-4 text-left text-sm text-muted hover:border-muted">
          <Search className="h-4 w-4" /> Sport, quartier, terrain…
          <span className="ml-auto flex items-center gap-1 text-xs"><MapPin className="h-3.5 w-3.5" />Mermoz</span>
        </button>
      </section>

      {next && (
        <section className="mt-5 px-5">
          <Card interactive onClick={() => navigate("app-match", { id: next.id })} className="overflow-hidden border-primary/40 bg-gradient-to-br from-primary/15 to-transparent p-4">
            <div className="flex items-center justify-between">
              <Badge tone="primary" dot>Ton prochain match</Badge>
              <span className="text-xs font-semibold text-muted">{next.dayOffset === 0 ? "Ce soir" : "Demain"} · {next.time}</span>
            </div>
            <p className="mt-3 font-display text-lg font-bold">{next.title}</p>
            <p className="text-sm text-muted">{sportLabel(next.sport)} {next.format} · {venues.find((v) => v.id === next.venueId)?.name}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="tabular text-sm font-semibold">{next.participants.length}/{next.capacity} joueurs · {next.paidCount} ont payé</span>
              <ChevronRight className="h-4 w-4 text-muted" />
            </div>
          </Card>
        </section>
      )}

      <section className="mt-5 grid grid-cols-4 gap-2 px-5">
        {actions.map((a) => (
          <button key={a.label} onClick={() => navigate(a.route)} className="group flex flex-col items-center gap-1.5 rounded-lg p-1 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface transition group-hover:border-primary group-hover:bg-primary group-hover:text-primary-fg"><a.icon className="h-5 w-5" /></span>
            <span className="text-[11px] font-semibold leading-tight">{a.label}</span>
          </button>
        ))}
      </section>

      <section className="mt-7">
        <div className="px-5"><SectionHeader title="Pour toi cette semaine" subtitle="Selon tes sports, ton niveau et ta zone" action={<button onClick={() => navigate("app-matches")} className="text-sm font-semibold text-primary-ink">Tout voir</button>} /></div>
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
          {suggestions.map((m) => <MatchCard key={m.id} m={m} compact />)}
        </div>
      </section>

      <section className="mt-7 px-5">
        <SectionHeader title="Terrains à proximité" action={<button onClick={() => navigate("app-explore")} className="text-sm font-semibold text-primary-ink">Carte</button>} />
        <button onClick={() => navigate("app-explore")} className="block w-full overflow-hidden rounded-lg border border-border">
          <DakarMap className="h-40" points={venues.slice(0, 6).map((v) => ({ id: v.id, x: v.map.x, y: v.map.y, label: v.name, price: `${v.pricePerHour / 1000}k` }))} />
        </button>
      </section>

      <section className="mt-7 px-5">
        <Card className="flex items-center gap-4 p-4">
          <ScoreRing value={me.reliability} size={56} label="Fiabilité" />
          <div className="flex-1">
            <p className="font-semibold">Score de fiabilité : excellent</p>
            <p className="text-xs text-muted">12 présences confirmées d’affilée. Les organisateurs te proposent en priorité.</p>
          </div>
        </Card>
        <Card interactive onClick={() => navigate("app-smart-fill", { id: "m1" })} className="mt-3 flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-fg"><Sparkles className="h-5 w-5" /></span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Il manque 2 joueurs à ton Five de ce soir</p>
            <p className="text-xs text-muted">Smart Fill a trouvé 6 joueurs compatibles.</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted" />
        </Card>
      </section>

      <section className="mt-7 px-5">
        <SectionHeader title="Joueurs actifs près de toi" action={<button onClick={() => navigate("app-players")} className="text-sm font-semibold text-primary-ink">Explorer</button>} />
        <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
          {["p1", "p2", "p5", "p8", "p10", "p12"].map((id) => {
            const p = playerById(id);
            return (
              <button key={id} onClick={() => navigate("app-player", { id })} className="flex w-20 shrink-0 flex-col items-center gap-1.5 text-center">
                <Avatar name={p.name} size={56} />
                <span className="w-full truncate text-xs font-semibold">{p.name.split(" ")[0]}</span>
                <span className="text-2xs text-muted">{p.distanceKm} km</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-7 px-5">
        <Card className="relative overflow-hidden p-4">
          <Swords className="absolute -right-3 -top-3 h-24 w-24 text-primary/10" />
          <Badge tone="warning">Organisateur ?</Badge>
          <p className="mt-2 font-display text-lg font-bold">Organise un tournoi complet</p>
          <p className="mt-1 text-sm text-muted">Terrain, arbitres, secours, traiteur : un seul panier, un seul budget.</p>
          <button onClick={() => navigate("events-planner")} className="mt-3 text-sm font-semibold text-primary-ink">Ouvrir SportMatch Events →</button>
        </Card>
        <p className="mt-4 text-center text-2xs text-muted">Prix indicatifs : {fcfa(3000)} par joueur en moyenne · données fictives</p>
      </section>
    </div>
  );
}
