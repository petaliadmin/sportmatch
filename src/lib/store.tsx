"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { initialMatches } from "@/data/matches";
import { initialBookings, initialNotifications } from "@/data/misc";
import { ME } from "@/data/players";
import type { AppNotification, BookingRecord, Match, Provider } from "@/data/types";
import { uid } from "./utils";

export type Theme = "dark" | "light";
export type Lang = "fr" | "en";

export interface CartItem {
  id: string;
  provider: Provider;
  qty: number; // agents, people, trips, hours...
  days: number;
  note?: string;
  status: "Brouillon" | "Devis demandé" | "Devis reçu" | "Validé";
}

export interface EventDraft {
  name: string;
  sport: string;
  date: string;
  durationDays: number;
  location: string;
  participants: number;
  budget: number;
  services: string[];
  format: string;
  teams: number;
}

export interface Toast { id: string; title: string; body?: string; tone?: "success" | "error" | "info" }

interface StoreValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  matches: Match[];
  upsertMatch: (m: Match) => void;
  joinMatch: (id: string, playerId?: string) => void;
  leaveMatch: (id: string, playerId?: string) => void;
  bookings: BookingRecord[];
  addBooking: (b: Omit<BookingRecord, "id">) => BookingRecord;
  notifications: AppNotification[];
  pushNotification: (n: Omit<AppNotification, "id" | "read" | "time">) => void;
  markAllRead: () => void;
  cart: CartItem[];
  addToCart: (p: Provider, qty?: number, days?: number) => void;
  updateCart: (id: string, patch: Partial<CartItem>) => void;
  removeFromCart: (id: string) => void;
  event: EventDraft;
  setEvent: (patch: Partial<EventDraft>) => void;
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;
  favoriteSports: string[];
  setFavoriteSports: (s: string[]) => void;
}

const Ctx = createContext<StoreValue | null>(null);

const defaultEvent: EventDraft = {
  name: "Tournoi Inter-Quartiers Dakar 2026",
  sport: "football",
  date: "2026-12-12",
  durationDays: 2,
  location: "Dakar · Yoff",
  participants: 160,
  budget: 3500000,
  services: ["infrastructures", "arbitres", "medical", "securite", "restauration"],
  format: "Poules + élimination directe",
  teams: 16,
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [lang, setLang] = useState<Lang>("fr");
  const [matches, setMatches] = useState(initialMatches);
  const [bookings, setBookings] = useState(initialBookings);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [event, setEventState] = useState(defaultEvent);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [onboarded, setOnboarded] = useState(false);
  const [favoriteSports, setFavoriteSports] = useState<string[]>(["football", "basketball"]);

  useEffect(() => {
    try {
      const t = localStorage.getItem("sm-theme") as Theme | null;
      if (t) setThemeState(t);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  const setTheme = (t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem("sm-theme", t); } catch {}
  };

  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = uid();
    setToasts((all) => [...all.slice(-2), { ...t, id }]);
    setTimeout(() => dismissToast(id), 3800);
  }, [dismissToast]);

  const pushNotification = useCallback((n: Omit<AppNotification, "id" | "read" | "time">) => {
    setNotifications((all) => [{ ...n, id: uid(), read: false, time: "à l'instant" }, ...all]);
  }, []);

  const value = useMemo<StoreValue>(() => ({
    theme, setTheme, lang, setLang,
    matches,
    upsertMatch: (m) => setMatches((all) => (all.some((x) => x.id === m.id) ? all.map((x) => (x.id === m.id ? m : x)) : [m, ...all])),
    joinMatch: (id, pid = ME) => setMatches((all) => all.map((m) => (m.id === id && !m.participants.includes(pid) && m.participants.length < m.capacity ? { ...m, participants: [...m.participants, pid] } : m))),
    leaveMatch: (id, pid = ME) => setMatches((all) => all.map((m) => (m.id === id ? { ...m, participants: m.participants.filter((p) => p !== pid) } : m))),
    bookings,
    addBooking: (b) => {
      const rec = { ...b, id: uid() };
      setBookings((all) => [rec, ...all]);
      return rec;
    },
    notifications, pushNotification,
    markAllRead: () => setNotifications((all) => all.map((n) => ({ ...n, read: true }))),
    cart,
    addToCart: (p, qty = 1, days = 1) => setCart((c) => (c.some((x) => x.provider.id === p.id) ? c.map((x) => (x.provider.id === p.id ? { ...x, qty, days } : x)) : [...c, { id: uid(), provider: p, qty, days, status: "Brouillon" }])),
    updateCart: (id, patch) => setCart((c) => c.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    removeFromCart: (id) => setCart((c) => c.filter((x) => x.id !== id)),
    event, setEvent: (patch) => setEventState((e) => ({ ...e, ...patch })),
    toasts, toast, dismissToast,
    onboarded, setOnboarded, favoriteSports, setFavoriteSports,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [theme, lang, matches, bookings, notifications, cart, event, toasts, onboarded, favoriteSports, toast, dismissToast, pushNotification]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside StoreProvider");
  return c;
}

/** Line total for a service in the event cart. */
export const cartLineTotal = (c: CartItem) => c.provider.price * c.qty * c.days;

/** Simulated async call (mock service layer). */
export async function mockRequest<T>(data: T, { delay = 700, failRate = 0 } = {}): Promise<T> {
  await new Promise((r) => setTimeout(r, delay));
  if (Math.random() < failRate) throw new Error("Erreur réseau simulée");
  return data;
}
