"use client";
import { BadgeCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ className, interactive, ...rest }: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface",
        interactive && "cursor-pointer transition hover:-translate-y-0.5 hover:border-muted/60 hover:shadow-card",
        className,
      )}
      {...rest}
    />
  );
}

type Tone = "neutral" | "primary" | "success" | "warning" | "error" | "info" | "outline";
const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-fg/80",
  primary: "bg-primary/15 text-primary-ink",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  error: "bg-error/15 text-error",
  info: "bg-info/15 text-info",
  outline: "border border-border text-muted",
};
export function Badge({ tone = "neutral", className, dot, children }: { tone?: Tone; className?: string; dot?: boolean; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-2xs font-semibold [&>svg]:h-3.5 [&>svg]:w-3.5", tones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Verified({ className }: { className?: string }) {
  return (
    <span title="Professionnel vérifié" className={cn("inline-flex items-center gap-1 text-2xs font-semibold text-primary-ink", className)}>
      <BadgeCheck className="h-3.5 w-3.5" /> Vérifié
    </span>
  );
}

export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", className)}>
      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
      {value.toFixed(1)}
      {count !== undefined && <span className="font-normal text-muted">({count})</span>}
    </span>
  );
}

const avatarColors = ["#B7F34A", "#60A5FA", "#F59E0B", "#F472B6", "#34D399", "#A78BFA", "#FB7185", "#22D3EE"];
export function Avatar({ name, size = 36, className, ring }: { name: string; size?: number; className?: string; ring?: boolean }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const color = avatarColors[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % avatarColors.length];
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-bold text-[#101A17]", ring && "ring-2 ring-surface", className)}
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}
export function AvatarStack({ names, max = 4, size = 28 }: { names: string[]; max?: number; size?: number }) {
  return (
    <div className="flex -space-x-2">
      {names.slice(0, max).map((n) => <Avatar key={n} name={n} size={size} ring />)}
      {names.length > max && (
        <span className="inline-flex items-center justify-center rounded-full bg-surface-2 text-2xs font-bold ring-2 ring-surface" style={{ width: size, height: size }}>
          +{names.length - max}
        </span>
      )}
    </div>
  );
}

export function Progress({ value, max = 100, tone = "primary", className }: { value: number; max?: number; tone?: "primary" | "success" | "warning" | "error"; className?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const bar = { primary: "bg-primary", success: "bg-success", warning: "bg-warning", error: "bg-error" }[tone];
  return (
    <div role="progressbar" aria-valuenow={value} aria-valuemax={max} className={cn("h-2 overflow-hidden rounded-full bg-surface-2", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", bar)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Circular score (reliability, compatibility). */
export function ScoreRing({ value, size = 44, label }: { value: number; size?: number; label?: string }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const color = value >= 85 ? "rgb(var(--primary))" : value >= 70 ? "rgb(var(--warning))" : "rgb(var(--error))";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} aria-label={label ? `${label} ${value}%` : `${value}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgb(var(--surface-2))" strokeWidth={4} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} className="transition-[stroke-dashoffset] duration-700" />
      </svg>
      <span className="tabular absolute text-[11px] font-bold">{value}</span>
    </div>
  );
}

export function Stat({ label, value, delta, icon, hint }: { label: string; value: React.ReactNode; delta?: number; icon?: React.ReactNode; hint?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-xs font-medium text-muted">
        {label}
        {icon && <span className="text-muted [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
      </div>
      <div className="tabular mt-2 font-display text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta !== undefined && <span className={cn("font-semibold", delta >= 0 ? "text-success" : "text-error")}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} %</span>}
        {hint && <span className="text-muted">{hint}</span>}
      </div>
    </Card>
  );
}

export function SectionHeader({ title, action, subtitle }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-border", className)} />;
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-sans text-2xs text-muted">{children}</kbd>;
}
