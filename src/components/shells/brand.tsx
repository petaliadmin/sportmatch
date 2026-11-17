import { cn } from "@/lib/utils";

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display font-extrabold tracking-tight", className)}>
      <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#B7F34A" />
        <path d="M9 20.5c1.4 1.6 3.6 2.5 6.3 2.5 3.4 0 5.7-1.6 5.7-4.2 0-2.3-1.6-3.3-4.9-4l-1.6-.3c-1.6-.3-2.2-.8-2.2-1.6 0-1 1-1.6 2.6-1.6 1.6 0 2.9.6 3.9 1.6l2.2-2.4C19.6 9 17.6 8.2 15 8.2c-3.3 0-5.6 1.7-5.6 4.3 0 2.2 1.5 3.4 4.8 4l1.5.3c1.7.3 2.3.8 2.3 1.6 0 1-1.1 1.7-2.8 1.7-1.9 0-3.4-.7-4.5-1.9Z" fill="#101A17" />
      </svg>
      {!compact && <span className="text-[17px]">SPORT<span className="text-primary-ink">MATCH</span></span>}
    </span>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return <span className={cn("rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning", className)}>Démo · données fictives</span>;
}
