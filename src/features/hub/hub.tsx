"use client";
import { ArrowUpRight, Briefcase, Radio, Building2, CalendarRange, Palette, ShieldCheck, Smartphone } from "lucide-react";
import { DemoBadge, Logo, LogoMark } from "@/components/shells/brand";
import { PlayerIllustration } from "@/components/visual/illustrations";
import { SoundToggle, ThemeToggle } from "@/components/shells/console-shell";
import { Badge, Card } from "@/components/ui";
import { SportVisual } from "@/components/visual/sport-visual";
import { useRouter } from "@/lib/router";

const spaces = [
  { route: "app-splash", title: "SportMatch App", who: "Sportifs amateurs", icon: Smartphone, desc: "Trouver un match, réserver un terrain, Smart Fill, paiement partagé.", screens: 27, tag: "Mobile · Flutter-ready", sport: "football" as const },
  { route: "events-dashboard", title: "SportMatch Events", who: "Organisateurs", icon: CalendarRange, desc: "Event Planner, marketplace de prestataires, panier, budget, planning.", screens: 19, tag: "Web · Next.js", sport: "running" as const },
  { route: "business-dashboard", title: "SportMatch Business", who: "Prestataires", icon: Briefcase, desc: "Demandes, devis, calendrier, ressources — adapté à chaque métier.", screens: 20, tag: "Web · Next.js", sport: "basketball" as const },
  { route: "admin-dashboard", title: "SportMatch Admin", who: "Back-office", icon: ShieldCheck, desc: "Validation KYB, transactions, commissions, litiges, statistiques.", screens: 15, tag: "Web · Next.js", sport: "tennis" as const },
];

const journey = [
  { r: "app-explore", l: "Découvrir un terrain" },
  { r: "app-venue", l: "Choisir un créneau", p: { id: "v1" } },
  { r: "app-create-match", l: "Créer un match" },
  { r: "app-smart-fill", l: "Compléter l’équipe", p: { id: "m1" } },
  { r: "events-planner", l: "Ajouter des services à un événement" },
];

export function Hub() {
  const { navigate } = useRouter();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <div className="flex items-center gap-2"><DemoBadge className="hidden sm:inline-block" /><SoundToggle /><ThemeToggle /></div>
      </header>
      <section className="relative mx-auto max-w-6xl px-5 pb-10 pt-6 md:pt-14">
        <div className="pointer-events-none absolute right-5 top-6 hidden w-[360px] lg:block"><div className="absolute inset-10 rounded-full bg-primary/10 blur-3xl" /><PlayerIllustration className="relative w-full animate-bounce2 [animation-duration:4s]" /></div>
        <LogoMark size={56} animated className="mb-6" />
        <Badge tone="primary">Prototype interactif · v0.1 · Dakar pilote</Badge>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
          Find your game.<br />Book your sport.<br /><span className="text-primary-ink">Manage your events.</span>
        </h1>
        <p className="mt-5 max-w-xl text-muted">Une plateforme, quatre espaces : sportifs, organisateurs, prestataires et administration. Toutes les données sont fictives, aucun paiement réel.</p>
        <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
          <span className="mr-1 font-semibold">Parcours principal :</span>
          {journey.map((j, i) => (
            <button key={j.r} onClick={() => navigate(j.r, j.p)} className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 hover:border-primary">
              <span className="tabular flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-fg">{i + 1}</span>{j.l}
            </button>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-6">
        <Card interactive onClick={() => navigate("live")} className="flex flex-wrap items-center justify-between gap-4 border-primary/40 bg-primary/5 p-5">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-fg"><Radio className="h-5 w-5" /></span>
            <div>
              <p className="font-display text-lg font-bold">Bêta live · API réelle</p>
              <p className="text-sm text-muted">Connexion Keycloak, terrains à proximité, matchs, réservations de démo, tournois, chat temps réel.</p>
            </div>
          </div>
          <Badge tone="success" dot>Microservices Spring Boot</Badge>
        </Card>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-10 md:grid-cols-2">
        {spaces.map((s) => (
          <Card key={s.route} interactive onClick={() => navigate(s.route)} className="group overflow-hidden">
            <div className="relative">
              <SportVisual sport={s.sport} seed={s.screens} className="h-36" />
              <span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-fg"><s.icon className="h-5 w-5" /></span>
              <Badge className="absolute right-4 top-4 bg-black/50 text-white backdrop-blur">{s.tag}</Badge>
            </div>
            <div className="flex items-start justify-between gap-4 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{s.who}</p>
                <h2 className="mt-1 font-display text-xl font-bold">{s.title}</h2>
                <p className="mt-1 text-sm text-muted">{s.desc}</p>
                <p className="tabular mt-3 text-xs font-semibold">{s.screens} écrans</p>
              </div>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary-ink" />
            </div>
          </Card>
        ))}
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <Card interactive onClick={() => navigate("design-system")} className="flex items-center gap-4 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-2"><Palette className="h-5 w-5" /></span>
          <div className="flex-1"><p className="font-semibold">Design system</p><p className="text-sm text-muted">Tokens, typographie, composants et états — partagés par les 4 espaces.</p></div>
          <Building2 className="hidden h-5 w-5 text-muted sm:block" />
        </Card>
      </section>
    </div>
  );
}
