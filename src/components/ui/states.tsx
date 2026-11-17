"use client";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-surface-2", className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-lg border border-border bg-surface p-3">
          <Skeleton className="h-16 w-16 shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, description, action, className }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-10 text-center", className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted [&>svg]:h-5 [&>svg]:w-5">{icon ?? <Inbox />}</div>
      <p className="font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Impossible de charger les données", description = "Vérifie ta connexion puis réessaie.", onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-lg border border-error/30 bg-error/5 px-6 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-error/15 text-error"><AlertTriangle className="h-5 w-5" /></div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>
      {onRetry && <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}><RefreshCw className="h-3.5 w-3.5" /> Réessayer</Button>}
    </div>
  );
}
