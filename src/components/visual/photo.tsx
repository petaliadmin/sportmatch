"use client";
import { useState } from "react";
import { media } from "@/data/media";
import { cn } from "@/lib/utils";
import { SportVisual, type SportKey } from "./sport-visual";

/**
 * Real photo with graceful fallback. `slot` looks up data/media.ts;
 * if empty or the image fails, the branded SVG visual is shown instead.
 */
export function Photo({ slot, sport, seed = 0, className, kenBurns, alt, credit = true }: { slot?: string; sport: SportKey; seed?: number; className?: string; kenBurns?: boolean; alt?: string; credit?: boolean }) {
  const m = slot ? media[slot] : undefined;
  const [failed, setFailed] = useState(false);
  if (!m || failed) return <SportVisual sport={sport} seed={seed} className={className} label={alt} />;
  return (
    <div className={cn("group relative overflow-hidden bg-surface-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.url} alt={alt ?? m.alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={cn("absolute inset-0 h-full w-full object-cover", kenBurns && "animate-ken-burns")} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      {credit && (
        <a href={`${m.creditUrl}?utm_source=sportmatch&utm_medium=referral`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="absolute bottom-1.5 right-2 z-10 text-[9px] text-white/60 opacity-0 transition hover:text-white group-hover:opacity-100">
          Photo : {m.credit} / Unsplash
        </a>
      )}
    </div>
  );
}
