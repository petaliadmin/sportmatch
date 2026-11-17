"use client";
import { FxLayer } from "@/components/fx/fx-layer";
import { Toaster } from "@/components/shells/toaster";
import { RouterProvider, useRouter } from "@/lib/router";
import { StoreProvider } from "@/lib/store";
import { AdminSpace, adminRoutes } from "./admin";
import { AppSpace } from "./app";
import { BusinessSpace, businessRoutes } from "./business";
import { DesignSystem } from "./design-system/design-system";
import { EventsSpace, eventsRoutes } from "./events";
import { Hub } from "./hub/hub";

function Screen() {
  const { route } = useRouter();
  if (route.startsWith("app-")) return <AppSpace route={route} />;
  if (route in eventsRoutes) return <EventsSpace route={route} />;
  if (route in businessRoutes) return <BusinessSpace route={route} />;
  if (route in adminRoutes) return <AdminSpace route={route} />;
  if (route === "design-system") return <DesignSystem />;
  return <Hub />;
}

export function Prototype() {
  return (
    <StoreProvider>
      <RouterProvider>
        <Screen />
        <Toaster />
        <FxLayer />
      </RouterProvider>
    </StoreProvider>
  );
}
