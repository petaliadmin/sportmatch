"use client";
import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-md border border-border bg-surface px-3 text-sm text-fg placeholder:text-muted transition focus:border-primary focus:outline-none focus:shadow-ring disabled:opacity-50 aria-[invalid=true]:border-error";

export function Field({ label, hint, error, children, className }: { label?: string; hint?: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      {label && <span className="text-xs font-semibold text-fg/90">{label}</span>}
      {children}
      {error ? <span role="alert" className="block text-xs text-error">{error}</span> : hint ? <span className="block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }>(
  function Input({ className, icon, ...rest }, ref) {
    return (
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
        <input ref={ref} className={cn(field, "h-10", icon && "pl-9", className)} {...rest} />
      </div>
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn(field, "min-h-[88px] py-2.5", className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...rest }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(field, "h-10 appearance-none pr-9", className)} {...rest}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
    </div>
  );
});

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition", checked ? "bg-primary" : "bg-border")}
    >
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--primary))]" />
      {label}
    </label>
  );
}

/** Segmented control / pill group — single choice. */
export function Segmented<T extends string>({ options, value, onChange, size = "md", className }: { options: { value: T; label: React.ReactNode }[]; value: T; onChange: (v: T) => void; size?: "sm" | "md"; className?: string }) {
  return (
    <div role="radiogroup" className={cn("inline-flex rounded-lg bg-surface-2 p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md font-semibold transition",
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
            value === o.value ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Chip — toggleable filter pill. */
export function Chip({ active, onClick, children, icon }: { active?: boolean; onClick?: () => void; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition [&>svg]:h-4 [&>svg]:w-4",
        active ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface text-fg hover:border-muted",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function Stepper({ value, onChange, min = 0, max = 999, step = 1 }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div className="inline-flex items-center rounded-md border border-border">
      <button type="button" aria-label="Diminuer" className="h-9 w-9 text-lg text-muted hover:text-fg disabled:opacity-30" disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>−</button>
      <span className="tabular w-10 text-center text-sm font-semibold">{value}</span>
      <button type="button" aria-label="Augmenter" className="h-9 w-9 text-lg text-muted hover:text-fg disabled:opacity-30" disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>+</button>
    </div>
  );
}
