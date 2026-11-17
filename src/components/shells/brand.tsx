import { cn } from "@/lib/utils";

/**
 * SportMatch mark — an "S" drawn as a run with the ball ahead of it.
 * The skew gives forward momentum; the two trails read as speed.
 * `animated` draws the stroke, then rolls the ball in (splash, loaders).
 */
export function LogoMark({ size = 28, animated = false, className, mono }: { size?: number; animated?: boolean; className?: string; mono?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={cn("shrink-0", className)} aria-hidden>
      <rect width="64" height="64" rx="18" fill={mono ? "currentColor" : "#B7F34A"} className={animated ? "origin-center animate-[logo-pop_.5s_cubic-bezier(.2,.8,.2,1)_both]" : undefined} />
      <g transform="skewX(-8) translate(4 0)">
        <path
          d="M37 19.5H28.5a7.25 7.25 0 0 0 0 14.5h7a7.25 7.25 0 0 1 0 14.5H22"
          fill="none"
          stroke="#101A17"
          strokeWidth="6.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={100}
          strokeDasharray={animated ? 100 : undefined}
          className={animated ? "animate-[logo-draw_.8s_.25s_cubic-bezier(.6,0,.2,1)_both]" : undefined}
        />
        <circle cx="47.5" cy="19.5" r="4.6" fill="#101A17" className={animated ? "animate-[logo-ball_.55s_.95s_cubic-bezier(.2,1.4,.4,1)_both]" : undefined} />
        <path d="M11.5 48.5h4.5M13 42.5h2.5" stroke="#101A17" strokeWidth="3" strokeLinecap="round" opacity=".45" className={animated ? "animate-[logo-trail_.4s_.7s_ease-out_both]" : undefined} />
      </g>
    </svg>
  );
}

export function Logo({ className, compact, size = 28 }: { className?: string; compact?: boolean; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display font-extrabold tracking-tight", className)}>
      <LogoMark size={size} />
      {!compact && <span className="text-[17px] tracking-[-0.02em]">SPORT<span className="text-primary-ink">MATCH</span></span>}
    </span>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return <span className={cn("rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning", className)}>Démo · données fictives</span>;
}
