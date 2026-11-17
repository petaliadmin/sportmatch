"use client";
import { CalendarCheck, Compass, Home, Swords, UserRound } from "lucide-react";
import { useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { play } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { DemoBadge, Logo } from "./brand";
import { SoundToggle, ThemeToggle } from "./console-shell";

const tabs = [
  { route: "app-home", key: "home", icon: Home, match: ["app-home", "app-notifications", "app-messages"] },
  { route: "app-explore", key: "explore", icon: Compass, match: ["app-explore", "app-venue", "app-booking", "app-payment", "app-confirmation", "app-catalog"] },
  { route: "app-matches", key: "matches", icon: Swords, match: ["app-matches", "app-match", "app-create-match", "app-smart-fill", "app-players", "app-player", "app-teams"] },
  { route: "app-bookings", key: "bookings", icon: CalendarCheck, match: ["app-bookings"] },
  { route: "app-profile", key: "profile", icon: UserRound, match: ["app-profile", "app-settings", "app-stats", "app-history"] },
] as const;

const guide: { route: string; label: string }[] = [
  { route: "app-splash", label: "Splash & onboarding" },
  { route: "app-home", label: "Accueil personnalisé" },
  { route: "app-explore", label: "Carte & recherche de terrains" },
  { route: "app-venue", label: "Détail terrain + créneaux" },
  { route: "app-matches", label: "Liste des matchs" },
  { route: "app-create-match", label: "Créer un match" },
  { route: "app-smart-fill", label: "Smart Fill" },
  { route: "app-players", label: "Recherche de joueurs" },
  { route: "app-bookings", label: "Mes réservations" },
  { route: "app-stats", label: "Classement & stats" },
  { route: "app-messages", label: "Messagerie" },
  { route: "app-notifications", label: "Notifications" },
  { route: "app-settings", label: "Paramètres" },
];

/**
 * Mobile app frame. Full-bleed under 1024px; on desktop it renders a device
 * frame plus a guided-tour rail. The `transform` on the frame makes it the
 * containing block for `position: fixed` children (modals, sheets), so overlays
 * stay inside the phone.
 */
export function MobileShell({ children, hideNav }: { children: React.ReactNode; hideNav?: boolean }) {
  const { route, navigate } = useRouter();
  const { lang } = useStore();
  return (
    <div className="min-h-screen lg:flex lg:items-center lg:justify-center lg:gap-14 lg:p-8">
      <aside className="hidden w-72 shrink-0 lg:block">
        <button onClick={() => navigate("hub")} className="mb-6"><Logo /></button>
        <p className="text-xs font-bold uppercase tracking-widest text-muted">SportMatch App · Sportifs</p>
        <h1 className="mt-2 font-display text-2xl font-bold leading-tight">Parcours guidé du prototype</h1>
        <p className="mt-2 text-sm text-muted">Chaque écran est interactif. Clique un écran pour y aller directement, ou utilise l’app comme sur mobile.</p>
        <nav className="mt-6 space-y-0.5">
          {guide.map((g, i) => (
            <button
              key={g.route}
              onClick={() => navigate(g.route, g.route === "app-venue" ? { id: "v1" } : {})}
              className={cn("flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition hover:bg-surface-2", route === g.route && "bg-surface-2 font-semibold")}
            >
              <span className={cn("tabular flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold", route === g.route ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted")}>{i + 1}</span>
              {g.label}
            </button>
          ))}
        </nav>
        <div className="mt-6 flex items-center gap-2"><DemoBadge /><SoundToggle /><ThemeToggle /></div>
        <p className="mt-2 text-2xs text-muted">🔊 Active le son : sifflet, célébrations, XP.</p>
      </aside>

      <div
        className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-bg lg:h-[844px] lg:w-[400px] lg:rounded-[44px] lg:border-[10px] lg:border-[#060B09] lg:shadow-pop lg:ring-1 lg:ring-border"
        style={{ transform: "translateZ(0)" }}
      >
        <div className="hidden h-7 shrink-0 items-center justify-between px-7 pt-1 text-[11px] font-semibold lg:flex">
          <span className="tabular">9:41</span>
          <span className="h-5 w-24 rounded-full bg-[#060B09]" />
          <span>5G ▪▪▪</span>
        </div>
        <main data-scroll-root className="scroll-thin relative flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
        {!hideNav && (
          <nav aria-label="Navigation principale" className="shrink-0 border-t border-border bg-surface/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 backdrop-blur">
            <ul className="grid grid-cols-5">
              {tabs.map((tab) => {
                const active = (tab.match as readonly string[]).includes(route);
                const Icon = tab.icon;
                return (
                  <li key={tab.route}>
                    <button
                      onClick={() => { if (!active) play("tap"); navigate(tab.route); }}
                      aria-current={active ? "page" : undefined}
                      className={cn("flex w-full flex-col items-center gap-0.5 rounded-md py-1.5 text-[10.5px] font-semibold transition", active ? "text-fg" : "text-muted hover:text-fg")}
                    >
                      <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-all duration-300", active ? "scale-100 bg-primary text-primary-fg" : "scale-90")}>
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      {t(lang, tab.key)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}

/** Sticky top bar used inside mobile screens. */
export function MobileHeader({ title, onBack, right, transparent }: { title?: string; onBack?: () => void; right?: React.ReactNode; transparent?: boolean }) {
  return (
    <header className={cn("sticky top-0 z-20 flex h-14 items-center gap-2 px-3", transparent ? "absolute inset-x-0 bg-transparent" : "border-b border-border bg-bg/90 backdrop-blur")}>
      {onBack && (
        <button aria-label="Retour" onClick={onBack} className={cn("flex h-9 w-9 items-center justify-center rounded-full", transparent ? "bg-black/40 text-white backdrop-blur" : "hover:bg-surface-2")}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
        </button>
      )}
      {title && <h1 className="flex-1 truncate font-display text-[17px] font-bold">{title}</h1>}
      {!title && <span className="flex-1" />}
      {right}
    </header>
  );
}
