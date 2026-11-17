"use client";
import { CalendarDays, ClipboardList, FileText, Inbox, LayoutDashboard, Package, Receipt, Settings, Star, Tag, Truck, UserPlus, Users, Wallet, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { ConsoleShell, type NavItem } from "@/components/shells/console-shell";
import { profiles, requestsFor, type BizKind } from "./profiles";
import { BizAssets, BizCalendar, BizDashboard, BizInvoices, BizOffer, BizOnboarding, BizOrders, BizPricing, BizQuotes, BizRequestDetail, BizRequests, BizRevenue, BizReviews, BizServices, BizSettings, BizTeam, BusinessContext } from "./screens";

export const businessRoutes: Record<string, React.ComponentType> = {
  "business-onboarding": BizOnboarding,
  "business-dashboard": BizDashboard,
  "business-services": BizServices,
  "business-offer": BizOffer,
  "business-pricing": BizPricing,
  "business-calendar": BizCalendar,
  "business-team": BizTeam,
  "business-assets": BizAssets,
  "business-requests": BizRequests,
  "business-request": BizRequestDetail,
  "business-quotes": BizQuotes,
  "business-orders": BizOrders,
  "business-invoices": BizInvoices,
  "business-revenue": BizRevenue,
  "business-reviews": BizReviews,
  "business-settings": BizSettings,
};

export function BusinessSpace({ route }: { route: string }) {
  const [kind, setKindState] = useState<BizKind>("stade");
  const [requests, setRequests] = useState(() => requestsFor("stade"));
  const [services, setServices] = useState(() => profiles.stade.services);
  const setKind = (k: BizKind) => { setKindState(k); setRequests(requestsFor(k)); setServices(profiles[k].services); };
  const profile = profiles[kind];
  const nav: NavItem[] = [
    { route: "business-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { route: "business-requests", label: "Demandes", icon: Inbox, badge: requests.filter((r) => r.status === "Nouvelle").length || undefined, match: ["business-request"] },
    { route: "business-quotes", label: "Devis", icon: ClipboardList },
    { route: "business-orders", label: "Commandes", icon: CheckCircle2 },
    { route: "business-calendar", label: "Calendrier", icon: CalendarDays },
    { route: "business-services", label: "Services", icon: Package, match: ["business-offer"] },
    { route: "business-pricing", label: "Tarifs", icon: Tag },
    { route: "business-team", label: profile.resourcesLabel, icon: Users },
    { route: "business-assets", label: profile.assetsLabel, icon: Truck },
    { route: "business-invoices", label: "Factures", icon: Receipt },
    { route: "business-revenue", label: "Revenus", icon: Wallet },
    { route: "business-reviews", label: "Avis clients", icon: Star },
  ];
  const Screen = businessRoutes[route] ?? BizDashboard;
  return (
    <BusinessContext.Provider value={{ kind, setKind, profile, requests, setRequests, services, setServices }}>
      <ConsoleShell space="SportMatch Business" nav={nav} footerNav={[{ route: "business-onboarding", label: "Inscription pro (démo)", icon: UserPlus }, { route: "business-settings", label: "Paramètres", icon: Settings }]} user={{ name: profile.owner, role: profile.company }}>
        <div key={route + kind} className="animate-fade-up"><Screen /></div>
      </ConsoleShell>
    </BusinessContext.Provider>
  );
}
export { FileText };
