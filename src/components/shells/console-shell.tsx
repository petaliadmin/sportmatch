"use client";
import { Bell, ChevronsUpDown, Menu as MenuIcon, Moon, Search, Sun, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Avatar } from "../ui";
import { DemoBadge, Logo } from "./brand";

export interface NavItem { route: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number; match?: string[] }

export const SPACES = [
  { route: "app-home", label: "SportMatch App", sub: "Sportifs" },
  { route: "events-dashboard", label: "SportMatch Events", sub: "Organisateurs" },
  { route: "business-dashboard", label: "SportMatch Business", sub: "Prestataires" },
  { route: "admin-dashboard", label: "SportMatch Admin", sub: "Back-office" },
  { route: "design-system", label: "Design System", sub: "Tokens & composants" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useStore();
  return (
    <button
      aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function SpaceSwitcher({ space }: { space: string }) {
  const { navigate } = useRouter();
  const current = SPACES.find((s) => s.label === space) ?? SPACES[1];
  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-border bg-surface-2/50 px-3 py-2 text-left [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{current.label}</p>
          <p className="truncate text-2xs text-muted">{current.sub}</p>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-muted" />
      </summary>
      <div className="absolute inset-x-0 z-50 mt-1 rounded-lg border border-border bg-surface p-1 shadow-pop">
        {SPACES.map((s) => (
          <button
            key={s.route}
            onClick={(e) => {
              (e.currentTarget.closest("details") as HTMLDetailsElement).open = false;
              navigate(s.route);
            }}
            className={cn("block w-full rounded-md px-2.5 py-2 text-left hover:bg-surface-2", s.label === current.label && "bg-surface-2")}
          >
            <span className="block text-sm font-semibold">{s.label}</span>
            <span className="block text-2xs text-muted">{s.sub}</span>
          </button>
        ))}
        <button onClick={() => navigate("hub")} className="mt-1 block w-full rounded-md border-t border-border px-2.5 py-2 text-left text-xs text-muted hover:text-fg">← Accueil du prototype</button>
      </div>
    </details>
  );
}

/** Desktop-first console layout for Events, Business and Admin. */
export function ConsoleShell({ space, nav, user, children, footerNav }: { space: string; nav: NavItem[]; footerNav?: NavItem[]; user: { name: string; role: string }; children: React.ReactNode }) {
  const { route, navigate } = useRouter();
  const [open, setOpen] = useState(false);
  const { notifications } = useStore();
  const unread = notifications.filter((n) => !n.read).length;

  const renderNav = (items: NavItem[]) =>
    items.map((n) => {
      const active = route === n.route || n.match?.includes(route);
      const Icon = n.icon;
      return (
        <button
          key={n.route + n.label}
          onClick={() => { navigate(n.route); setOpen(false); }}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
            active ? "bg-primary/10 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
          )}
        >
          <Icon className={cn("h-4 w-4", active && "text-primary-ink")} />
          <span className="flex-1 text-left">{n.label}</span>
          {n.badge !== undefined && <span className="tabular rounded-full bg-primary px-1.5 text-2xs font-bold text-primary-fg">{n.badge}</span>}
          {active && <span className="h-4 w-1 rounded-full bg-primary" />}
        </button>
      );
    });

  const sidebar = (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("hub")}><Logo /></button>
        <button className="lg:hidden" aria-label="Fermer le menu" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
      </div>
      <SpaceSwitcher space={space} />
      <nav className="scroll-thin -mx-1 flex-1 space-y-0.5 overflow-y-auto px-1">{renderNav(nav)}</nav>
      {footerNav && <div className="space-y-0.5 border-t border-border pt-3">{renderNav(footerNav)}</div>}
      <div className="flex items-center gap-3 rounded-lg bg-surface-2/60 p-2.5">
        <Avatar name={user.name} size={32} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-2xs text-muted">{user.role}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-border bg-surface lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] border-r border-border bg-surface animate-fade-up">{sidebar}</aside>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-bg/85 px-4 backdrop-blur md:px-8">
          <button className="lg:hidden" aria-label="Ouvrir le menu" onClick={() => setOpen(true)}><MenuIcon className="h-5 w-5" /></button>
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input aria-label="Recherche globale" placeholder="Rechercher un événement, un prestataire, une facture…" className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm placeholder:text-muted focus:border-primary focus:outline-none" />
          </div>
          <div className="flex-1 md:hidden" />
          <DemoBadge className="hidden sm:inline-block" />
          <ThemeToggle />
          <button aria-label="Notifications" onClick={() => navigate("app-notifications")} className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg">
            <Bell className="h-4 w-4" />
            {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />}
          </button>
        </header>
        <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: string; actions?: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary-ink">{eyebrow}</p>}
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
