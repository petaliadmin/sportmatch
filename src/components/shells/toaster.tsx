"use client";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismissToast } = useStore();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-[80] flex flex-col items-center gap-2 px-3 sm:items-end sm:pr-5">
      {toasts.map((t) => {
        const Icon = t.tone === "error" ? XCircle : t.tone === "info" ? Info : CheckCircle2;
        return (
          <div key={t.id} role="status" className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-surface p-3.5 shadow-pop animate-fade-up">
            <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", t.tone === "error" ? "text-error" : t.tone === "info" ? "text-info" : "text-success")} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.body && <p className="mt-0.5 text-xs text-muted">{t.body}</p>}
            </div>
            <button aria-label="Fermer" onClick={() => dismissToast(t.id)} className="text-muted hover:text-fg"><X className="h-4 w-4" /></button>
          </div>
        );
      })}
    </div>
  );
}
