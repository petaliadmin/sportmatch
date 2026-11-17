"use client";
import { Building2, CalendarRange, FileText, LayoutDashboard, ListChecks, Settings, ShoppingCart, Users, Wallet, Sparkles, AlertTriangle, BarChart3, UsersRound } from "lucide-react";
import { ConsoleShell, type NavItem } from "@/components/shells/console-shell";
import { useStore } from "@/lib/store";
import { Cart, Compare, Marketplace, Quotes } from "./marketplace";
import { Budget, Documents, EventsDashboard, EventsList, EventsSettings, EventTeams, Incidents, Participants, Payments, Planning, Report } from "./ops";
import { CreateEvent, EventPlanner } from "./planner";

export const eventsRoutes: Record<string, React.ComponentType> = {
  "events-dashboard": EventsDashboard,
  "events-list": EventsList,
  "events-create": CreateEvent,
  "events-planner": EventPlanner,
  "events-venues": () => <Marketplace initialCategory="infrastructures" />,
  "events-marketplace": () => <Marketplace />,
  "events-compare": Compare,
  "events-cart": Cart,
  "events-quotes": Quotes,
  "events-planning": Planning,
  "events-participants": Participants,
  "events-teams": EventTeams,
  "events-budget": Budget,
  "events-payments": Payments,
  "events-documents": Documents,
  "events-incidents": Incidents,
  "events-report": Report,
  "events-settings": EventsSettings,
};

export function EventsSpace({ route }: { route: string }) {
  const { cart } = useStore();
  const nav: NavItem[] = [
    { route: "events-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { route: "events-list", label: "Mes événements", icon: CalendarRange, match: ["events-create", "events-report"] },
    { route: "events-planner", label: "Event Planner", icon: Sparkles },
    { route: "events-venues", label: "Infrastructures", icon: Building2 },
    { route: "events-marketplace", label: "Prestataires", icon: Users, match: ["events-compare"] },
    { route: "events-cart", label: "Panier & devis", icon: ShoppingCart, badge: cart.length || undefined, match: ["events-quotes"] },
    { route: "events-planning", label: "Planning", icon: ListChecks },
    { route: "events-participants", label: "Participants", icon: UsersRound },
    { route: "events-teams", label: "Équipes", icon: Users },
    { route: "events-budget", label: "Budget", icon: BarChart3 },
    { route: "events-payments", label: "Paiements", icon: Wallet },
    { route: "events-documents", label: "Documents", icon: FileText },
    { route: "events-incidents", label: "Incidents", icon: AlertTriangle },
  ];
  const Screen = eventsRoutes[route] ?? EventsDashboard;
  return (
    <ConsoleShell space="SportMatch Events" nav={nav} footerNav={[{ route: "events-settings", label: "Paramètres", icon: Settings }]} user={{ name: "Aminata Sow", role: "Organisatrice · Pro" }}>
      <div key={route} className="animate-fade-up"><Screen /></div>
    </ConsoleShell>
  );
}
