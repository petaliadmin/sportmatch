"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
}

function useFocusOnOpen(open: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);
  return ref;
}

export function Modal({ open, onClose, title, description, children, footer, size = "md" }: { open: boolean; onClose: () => void; title: string; description?: string; children?: React.ReactNode; footer?: React.ReactNode; size?: "sm" | "md" | "lg" }) {
  useEscape(open, onClose);
  const ref = useFocusOnOpen(open);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/60 animate-fade-up" onClick={onClose} />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative max-h-[90vh] w-full overflow-auto rounded-t-2xl border border-border bg-surface shadow-pop outline-none animate-slide-up sm:rounded-xl sm:animate-fade-up",
          { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-3xl" }[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 p-5 pb-0">
          <div>
            <h3 className="font-display text-lg font-bold">{title}</h3>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button aria-label="Fermer" onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border p-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children, footer, width = 440 }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; width?: number }) {
  useEscape(open, onClose);
  const ref = useFocusOnOpen(open);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/50 animate-fade-up" onClick={onClose} />
      <aside
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ maxWidth: width }}
        className="absolute inset-y-0 right-0 flex w-full flex-col border-l border-border bg-surface shadow-pop outline-none animate-slide-in"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <button aria-label="Fermer" onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="scroll-thin flex-1 overflow-auto p-5">{children}</div>
        {footer && <footer className="border-t border-border p-4">{footer}</footer>}
      </aside>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div role="tablist" className={cn("no-scrollbar flex gap-1 overflow-x-auto border-b border-border", className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "relative -mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition",
            value === t.value ? "border-primary text-fg" : "border-transparent text-muted hover:text-fg",
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="tabular rounded-full bg-surface-2 px-1.5 text-2xs">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Lightweight dropdown menu. */
export function Menu({ trigger, items, align = "right" }: { trigger: React.ReactNode; items: { label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[]; align?: "left" | "right" }) {
  return (
    <details className="group relative">
      <summary className="list-none [&::-webkit-details-marker]:hidden">{trigger}</summary>
      <div className={cn("absolute z-50 mt-1 min-w-[180px] rounded-lg border border-border bg-surface p-1 shadow-pop animate-fade-up", align === "right" ? "right-0" : "left-0")}>
        {items.map((it) => (
          <button
            key={it.label}
            onClick={(e) => {
              (e.currentTarget.closest("details") as HTMLDetailsElement).open = false;
              it.onClick();
            }}
            className={cn("flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-surface-2 [&>svg]:h-4 [&>svg]:w-4", it.danger && "text-error")}
          >
            {it.icon}
            {it.label}
          </button>
        ))}
      </div>
    </details>
  );
}
