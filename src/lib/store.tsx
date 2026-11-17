"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { initialMatches } from "@/data/matches";
import { initialBookings, initialNotifications } from "@/data/misc";
import { ME } from "@/data/players";
import type { AppNotification, BookingRecord, Match, Provider } from "@/data/types";
import { initSoundPreference, play, setSoundEnabled, haptic } from "./sound";
import { uid } from "./utils";

/* ---------- Gamification ---------- */
export const XP_PER_LEVEL = 500;
export const LEVEL_TITLES = ["Rookie", "Remplaçant", "Titulaire", "Pilier", "Capitaine", "Meneur", "Star du quartier", "Légende de Dakar"];
export const levelOf = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;
export const levelTitle = (lvl: number) => LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, lvl - 1)];

export interface Badge { id: string; label: string; desc: string; emoji: string; unlocked: boolean }
const initialBadges: Badge[] = [
  { id: "first-match", label: "Premier match", desc: "Rejoindre ton premier match", emoji: "⚽", unlocked: true },
  { id: "reliable", label: "Ultra fiable", desc: "Fiabilité ≥ 90", emoji: "🛡️", unlocked: true },
  { id: "organizer", label: "Organisateur", desc: "Publier un match", emoji: "📣", unlocked: false },
  { id: "booker", label: "Réservé !", desc: "Réserver un terrain", emoji: "🏟️", unlocked: false },
  { id: "full-house", label: "Full house", desc: "Remplir un match avec Smart Fill", emoji: "🔥", unlocked: false },
  { id: "streak-5", label: "5 semaines", desc: "Jouer 5 semaines d'affilée", emoji: "📅", unlocked: false },
  { id: "night-owl", label: "Oiseau de nuit", desc: "Jouer après 21 h", emoji: "🌙", unlocked: true },
  { id: "social", label: "Capitaine social", desc: "Inviter 10 joueurs", emoji: "🤝", unlocked: false },
];

export interface XpBurst { id: string; amount: number; reason: string }

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
  xp: number;
  streakWeeks: number;
  badges: Badge[];
  xpBursts: XpBurst[];
  levelUp: number | null;
  dismissLevelUp: () => void;
  newBadge: Badge | null;
  dismissBadge: () => void;
  confettiKey: number;
  /** Award XP; optionally unlock a badge. Plays sound + floating "+XP". */
  awardXp: (amount: number, reason: string, badgeId?: string) => void;
  /** Confetti + cheer/success sound + haptic. */
  celebrate: (sound?: "success" | "cheer" | "whistle") => void;
  soundOn: boolean;
  setSoundOn: (v: boolean) => void;
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
  const [xp, setXp] = useState(2340);
  const [streakWeeks, setStreakWeeks] = useState(4);
  const [badges, setBadges] = useState(initialBadges);
  const [xpBursts, setXpBursts] = useState<XpBurst[]>([]);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [soundOn, setSoundOnState] = useState(true);

  useEffect(() => { setSoundOnState(initSoundPreference()); }, []);
  const setSoundOn = (v: boolean) => { setSoundEnabled(v); setSoundOnState(v); if (v) play("select"); };

  const celebrate = useCallback((sound: "success" | "cheer" | "whistle" = "success") => {
    setConfettiKey((k) => k + 1);
    play(sound);
    haptic([18, 40, 18]);
  }, []);

  const awardXp = useCallback((amount: number, reason: string, badgeId?: string) => {
    const id = uid();
    setXpBursts((b) => [...b, { id, amount, reason }]);
    setTimeout(() => setXpBursts((b) => b.filter((x) => x.id !== id)), 1500);
    setTimeout(() => play("xp"), 120);
    setXp((cur) => {
      const next = cur + amount;
      if (levelOf(next) > levelOf(cur)) setTimeout(() => { setLevelUp(levelOf(next)); setConfettiKey((k) => k + 1); play("levelup"); }, 700);
      return next;
    });
    if (badgeId) {
      setBadges((all) => {
        const b = all.find((x) => x.id === badgeId);
        if (!b || b.unlocked) return all;
        setTimeout(() => { setNewBadge({ ...b, unlocked: true }); play("notify"); }, 1100);
        return all.map((x) => (x.id === badgeId ? { ...x, unlocked: true } : x));
      });
    }
  }, []);
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
    if (t.tone === "error") play("error");
    setToasts((all) => [...all.slice(-2), { ...t, id }]);
    setTimeout(() => dismissToast(id), 3800);
  }, [dismissToast]);

  const pushNotification = useCallback((n: Omit<AppNotification, "id" | "read" | "time">) => {
    setNotifications((all) => [{ ...n, id: uid(), read: false, time: "à l'instant" }, ...all]);
    setTimeout(() => play("notify"), 300);
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
    xp, streakWeeks, badges, xpBursts, levelUp, dismissLevelUp: () => setLevelUp(null), newBadge, dismissBadge: () => setNewBadge(null),
    confettiKey, awardXp, celebrate, soundOn, setSoundOn,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [theme, lang, matches, bookings, notifications, cart, event, toasts, onboarded, favoriteSports, toast, dismissToast, pushNotification, xp, streakWeeks, badges, xpBursts, levelUp, newBadge, confettiKey, soundOn, awardXp, celebrate]);

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
