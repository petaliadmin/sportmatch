"use client";
import { Clock, MapPin, Users } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { SportVisual } from "@/components/visual/sport-visual";
import { venueById } from "@/data/venues";
import type { Match, Venue } from "@/data/types";
import { useRouter } from "@/lib/router";
import { cn, fcfa } from "@/lib/utils";

export const SPORTS = [
  { key: "football", label: "Football", emoji: "⚽" },
  { key: "basketball", label: "Basketball", emoji: "🏀" },
  { key: "tennis", label: "Tennis", emoji: "🎾" },
  { key: "padel", label: "Padel", emoji: "🥎" },
  { key: "volley", label: "Volley", emoji: "🏐" },
  { key: "handball", label: "Handball", emoji: "🤾" },
  { key: "running", label: "Running", emoji: "🏃" },
] as const;
export const sportLabel = (k: string) => SPORTS.find((s) => s.key === k)?.label ?? k;
export const sportEmoji = (k: string) => SPORTS.find((s) => s.key === k)?.emoji ?? "•";

export const dayText = (offset: number) => (offset === 0 ? "Aujourd'hui" : offset === 1 ? "Demain" : new Date(Date.now() + offset * 864e5).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" }));

export function MatchCard({ m, compact }: { m: Match; compact?: boolean }) {
  const { navigate } = useRouter();
  const v = venueById(m.venueId);
  const left = m.capacity - m.participants.length;
  const full = left <= 0;
  return (
    <Card interactive onClick={() => navigate("app-match", { id: m.id })} className={cn("overflow-hidden", compact && "w-[270px] shrink-0")}>
      <div className="relative">
        <SportVisual sport={m.sport} seed={Number(m.id.slice(1))} className="h-28" />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <Badge className="bg-black/50 text-white backdrop-blur">{sportEmoji(m.sport)} {sportLabel(m.sport)} · {m.format}</Badge>
          {full ? <Badge tone="error" className="bg-error text-white">Complet</Badge> : left <= 2 ? <Badge className="bg-warning text-[#101A17]">{left} place{left > 1 ? "s" : ""}</Badge> : null}
        </div>
        <div className="absolute bottom-2 left-3 text-white">
          <p className="font-display text-base font-bold leading-tight drop-shadow">{m.title}</p>
        </div>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{dayText(m.dayOffset)} · {m.time}</span>
          <span className="flex items-center gap-1 truncate"><MapPin className="h-3.5 w-3.5" />{v.district}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold"><Users className="h-3.5 w-3.5 text-muted" /><span className="tabular">{m.participants.length}/{m.capacity}</span> <span className="font-normal text-muted">· {m.level}</span></span>
          <span className="tabular text-sm font-bold">{m.pricePerPlayer ? fcfa(m.pricePerPlayer) : "Gratuit"}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-primary" style={{ width: `${(m.participants.length / m.capacity) * 100}%` }} /></div>
      </div>
    </Card>
  );
}

export function VenueRow({ v, onClick, active }: { v: Venue; onClick: () => void; active?: boolean }) {
  return (
    <Card interactive onClick={onClick} className={cn("flex gap-3 p-2.5", active && "border-primary")}>
      <SportVisual sport={v.sports[0]} seed={Number(v.id.slice(1))} className="h-20 w-20 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold">{v.name}</p>
          <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold">★ {v.rating}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">{v.kind} · {v.district} · {v.distanceKm} km</p>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex gap-1">{v.sports.slice(0, 3).map((s) => <span key={s} className="text-sm" title={sportLabel(s)}>{sportEmoji(s)}</span>)}</div>
          <span className="tabular text-sm font-bold">{fcfa(v.pricePerHour)}<span className="text-2xs font-normal text-muted"> /h</span></span>
        </div>
      </div>
    </Card>
  );
}
