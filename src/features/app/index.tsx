"use client";
import { MobileShell } from "@/components/shells/mobile-shell";
import { BookingSummary, Confirmation, Payment, VenueDetail } from "./booking";
import { Catalog, Explore } from "./explore";
import { Home } from "./home";
import { CreateMatch, MatchDetail, MatchesList, SmartFill, Teams } from "./matches";
import { Auth, Onboarding, ProfileSetup, Splash, SportsPick } from "./onboarding";
import { Bookings, Chat, Messages, Notifications, PlayerProfile, PlayerSearch, Profile, Settings, SportHistory, Stats } from "./people";

/** route → [screen, hideBottomNav] */
export const appRoutes: Record<string, [React.ComponentType, boolean?]> = {
  "app-splash": [Splash, true],
  "app-onboarding": [Onboarding, true],
  "app-auth": [Auth, true],
  "app-sports": [SportsPick, true],
  "app-profile-setup": [ProfileSetup, true],
  "app-home": [Home],
  "app-explore": [Explore],
  "app-catalog": [Catalog],
  "app-venue": [VenueDetail, true],
  "app-booking": [BookingSummary, true],
  "app-payment": [Payment, true],
  "app-confirmation": [Confirmation, true],
  "app-matches": [MatchesList],
  "app-match": [MatchDetail, true],
  "app-create-match": [CreateMatch, true],
  "app-smart-fill": [SmartFill, true],
  "app-teams": [Teams, true],
  "app-players": [PlayerSearch],
  "app-player": [PlayerProfile, true],
  "app-stats": [Stats],
  "app-history": [SportHistory],
  "app-bookings": [Bookings],
  "app-notifications": [Notifications],
  "app-messages": [Messages],
  "app-chat": [Chat, true],
  "app-profile": [Profile],
  "app-settings": [Settings],
};

export function AppSpace({ route }: { route: string }) {
  const [Screen, hideNav] = appRoutes[route] ?? appRoutes["app-home"];
  return (
    <MobileShell hideNav={hideNav}>
      <div key={route} className="min-h-full animate-fade-up">
        <Screen />
      </div>
    </MobileShell>
  );
}
