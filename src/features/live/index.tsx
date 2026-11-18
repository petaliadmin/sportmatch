"use client";
import { ArrowLeft, LogIn, LogOut, Radio } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/shells/brand";
import { SoundToggle, ThemeToggle } from "@/components/shells/console-shell";
import { Avatar, Badge, Button, Card, Tabs } from "@/components/ui";
import { useSession } from "@/lib/api/auth";
import { API_URL, apiEnabled } from "@/lib/api/config";
import { useRouter } from "@/lib/router";
import { BookingsPanel } from "./bookings";
import { ChatPanel } from "./chat";
import { AdminPanel } from "./admin";
import { MatchesPanel } from "./matches";
import { ProPanel } from "./pro";
import { NotificationsPanel } from "./notifications";
import { TournamentsPanel } from "./tournaments";
import { VenuesPanel } from "./venues";

type Tab = "venues" | "matches" | "bookings" | "tournaments" | "chat" | "notifications" | "pro" | "admin";
const PRIVATE: Tab[] = ["bookings", "chat", "notifications"];

/** Espace « Bêta live » : l'interface SportMatch branchée sur les microservices réels (via la gateway). */
export function LiveSpace() {
  return <Live />;
}

function Live() {
  const { navigate } = useRouter();
  const { ready, user, login, logout } = useSession();
  const [tab, setTab] = useState<Tab>("venues");
  const [chatMatch, setChatMatch] = useState<string | null>(null);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" aria-label="Retour à l'accueil" onClick={() => navigate("hub")}><ArrowLeft className="h-4 w-4" /></Button>
            <Logo />
            <Badge tone="success" dot><Radio className="hidden" />Bêta live</Badge>
          </div>
          <div className="flex items-center gap-2">
            <SoundToggle /><ThemeToggle />
            {apiEnabled && ready && (user ? (
              <div className="flex items-center gap-2">
                <Avatar name={user.name} size={30} />
                <span className="hidden text-sm font-semibold sm:inline">{user.name}</span>
                <Button variant="ghost" size="icon-sm" aria-label="Se déconnecter" onClick={logout}><LogOut className="h-4 w-4" /></Button>
              </div>
            ) : <Button size="sm" onClick={login}><LogIn className="h-3.5 w-3.5" /> Se connecter</Button>)}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5">
        {!apiEnabled ? <NotConfigured /> : (
          <>
            <Tabs<Tab> className="mb-5" value={tab} onChange={setTab} tabs={[
              { value: "venues", label: "Terrains" }, { value: "matches", label: "Matchs" }, { value: "bookings", label: "Réservations" },
              { value: "tournaments", label: "Tournois" }, { value: "chat", label: "Chat" }, { value: "notifications", label: "Notifications" },
              ...(user?.roles.includes("provider") ? [{ value: "pro" as Tab, label: "Espace pro" }] : []),
              ...(user?.roles.includes("admin") ? [{ value: "admin" as Tab, label: "Admin" }] : []),
            ]} />
            {PRIVATE.includes(tab) && !user ? (
              <Card className="flex flex-col items-center gap-3 p-8 text-center">
                <p className="font-semibold">Connecte-toi pour voir cet espace</p>
                <p className="max-w-sm text-sm text-muted">Comptes de démonstration : awa.player, moussa.player, fatou.orga… (mot de passe demo1234).</p>
                <Button onClick={login}><LogIn className="h-4 w-4" /> Se connecter avec Keycloak</Button>
              </Card>
            ) : (
              <>
                {tab === "venues" && <VenuesPanel />}
                {tab === "matches" && <MatchesPanel onOpenChat={(id) => { setChatMatch(id); setTab("chat"); }} />}
                {tab === "bookings" && <BookingsPanel />}
                {tab === "tournaments" && <TournamentsPanel />}
                {tab === "chat" && <ChatPanel focusMatchId={chatMatch} />}
                {tab === "notifications" && <NotificationsPanel />}
                {tab === "pro" && user?.roles.includes("provider") && <ProPanel />}
                {tab === "admin" && user?.roles.includes("admin") && <AdminPanel />}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function NotConfigured() {
  return (
    <Card className="mx-auto max-w-xl space-y-3 p-6">
      <p className="font-display text-lg font-bold">La bêta live n'est pas branchée ici</p>
      <p className="text-sm text-muted">
        Cette version publique est le prototype à données fictives. La bêta live fonctionne avec l'environnement local :
        lance <code>make up</code> (ou <code>sportmatch-launch.bat</code> sous Windows), puis ouvre <code>http://localhost:3080/#live</code>.
      </p>
      <p className="text-xs text-muted">API attendue : {API_URL || "NEXT_PUBLIC_API_URL non défini"}</p>
    </Card>
  );
}
