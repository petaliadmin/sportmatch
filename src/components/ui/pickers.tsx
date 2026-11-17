"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { play } from "@/lib/sound";
import { cn, DAYS_FR, MONTHS_FR, nextDays } from "@/lib/utils";

/** Horizontal day picker (mobile-first date picker). */
export function DateStrip({ value, onChange, days = 14 }: { value: Date; onChange: (d: Date) => void; days?: number }) {
  const list = useMemo(() => nextDays(days), [days]);
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="listbox" aria-label="Choisir une date">
      {list.map((d, i) => {
        const active = d.toDateString() === value.toDateString();
        return (
          <button
            key={i}
            role="option"
            aria-selected={active}
            onClick={() => { play("tap"); onChange(d); }}
            className={cn(
              "flex w-14 shrink-0 flex-col items-center rounded-lg border py-2 transition",
              active ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface hover:border-muted",
            )}
          >
            <span className={cn("text-2xs font-semibold uppercase", active ? "text-primary-fg/70" : "text-muted")}>{i === 0 ? "Auj." : DAYS_FR[d.getDay()]}</span>
            <span className="tabular font-display text-lg font-bold">{d.getDate()}</span>
            <span className={cn("text-2xs", active ? "text-primary-fg/70" : "text-muted")}>{MONTHS_FR[d.getMonth()]}</span>
          </button>
        );
      })}
    </div>
  );
}

export interface Slot { time: string; status: "free" | "booked" | "few" | "peak"; price: number }

/** Time slot picker. Supports multi-hour contiguous selection. */
export function SlotGrid({ slots, selected, onToggle }: { slots: Slot[]; selected: string[]; onToggle: (t: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((s) => {
        const sel = selected.includes(s.time);
        const disabled = s.status === "booked";
        return (
          <button
            key={s.time}
            disabled={disabled}
            aria-pressed={sel}
            onClick={() => { play(sel ? "tap" : "select"); onToggle(s.time); }}
            className={cn(
              "relative rounded-md border px-2 py-2.5 text-left transition active:scale-95",
              disabled && "cursor-not-allowed border-border bg-surface-2/50 text-muted line-through opacity-60",
              !disabled && !sel && "border-border bg-surface hover:border-primary/60",
              sel && "animate-pop border-primary bg-primary/15 ring-1 ring-primary",
            )}
          >
            <div className="tabular text-sm font-bold">{s.time}</div>
            <div className="tabular text-2xs text-muted">{disabled ? "Réservé" : `${(s.price / 1000).toFixed(0)}k FCFA`}</div>
            {s.status === "peak" && !disabled && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-warning" title="Heure de pointe" />}
          </button>
        );
      })}
    </div>
  );
}

/** Month calendar with availability dots. */
export function MonthCalendar({ value, onChange, marks = {} }: { value: Date; onChange: (d: Date) => void; marks?: Record<number, "busy" | "free" | "full"> }) {
  const [cursor, setCursor] = useState(new Date(value.getFullYear(), value.getMonth(), 1));
  const first = (cursor.getDay() + 6) % 7; // Monday first
  const daysIn = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells = [...Array(first).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <button aria-label="Mois précédent" className="rounded-md p-1.5 hover:bg-surface-2" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></button>
        <span className="font-semibold capitalize">{cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span>
        <button aria-label="Mois suivant" className="rounded-md p-1.5 hover:bg-surface-2" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-2xs font-semibold text-muted">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <span key={i} className="py-1">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const date = new Date(cursor.getFullYear(), cursor.getMonth(), d);
          const past = date < today;
          const active = date.toDateString() === value.toDateString();
          const mark = marks[d];
          return (
            <button
              key={i}
              disabled={past}
              onClick={() => onChange(date)}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-md text-sm tabular transition",
                past && "text-muted/40",
                !past && !active && "hover:bg-surface-2",
                active && "bg-primary font-bold text-primary-fg",
              )}
            >
              {d}
              {mark && !active && (
                <span className={cn("absolute bottom-1 h-1 w-1 rounded-full", mark === "free" ? "bg-success" : mark === "busy" ? "bg-warning" : "bg-error")} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
