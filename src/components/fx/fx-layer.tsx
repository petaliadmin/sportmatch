"use client";
import { Sparkles, Zap } from "lucide-react";
import { useEffect } from "react";
import { levelTitle, useStore, XP_PER_LEVEL } from "@/lib/store";
import { Button } from "../ui";
import { Confetti } from "./fx";
import { TrophyIllustration } from "../visual/illustrations";

/** Global celebration layer: confetti, floating XP, level-up and badge-unlock moments. */
export function FxLayer() {
  const { confettiKey, xpBursts, levelUp, dismissLevelUp, newBadge, dismissBadge } = useStore();
  useEffect(() => {
    if (!levelUp && !newBadge) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { dismissLevelUp(); dismissBadge(); } };
    window.addEventListener("keydown", h);
    const t = newBadge && !levelUp ? setTimeout(dismissBadge, 4500) : undefined;
    return () => { window.removeEventListener("keydown", h); if (t) clearTimeout(t); };
  }, [levelUp, newBadge, dismissLevelUp, dismissBadge]);
  return (
    <>
      <Confetti fireKey={confettiKey} />

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-24 z-[85] flex flex-col items-center gap-2">
        {xpBursts.map((b) => (
          <div key={b.id} className="flex animate-float-up items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-extrabold text-primary-fg shadow-pop">
            <Zap className="h-4 w-4 fill-current" />+{b.amount} XP
            <span className="font-semibold opacity-70">· {b.reason}</span>
          </div>
        ))}
      </div>

      {levelUp && (
        <div className="fixed inset-0 z-[88] flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-label="Niveau supérieur">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismissLevelUp} />
          <div className="relative w-full max-w-sm animate-pop overflow-hidden rounded-2xl border border-primary/40 bg-surface p-6 text-center shadow-pop">
            <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgb(var(--primary)/.35),transparent_70%)]" />
            <TrophyIllustration className="relative mx-auto h-32 w-32 animate-bounce2" />
            <p className="relative mt-2 text-xs font-bold uppercase tracking-[.2em] text-primary-ink">Niveau supérieur</p>
            <p className="relative font-display text-5xl font-extrabold">{levelUp}</p>
            <p className="relative mt-1 font-display text-lg font-bold">{levelTitle(levelUp)}</p>
            <p className="relative mt-2 text-sm text-muted">Nouveau palier débloqué : priorité Smart Fill et badge de profil. Prochain niveau dans {XP_PER_LEVEL} XP.</p>
            <Button autoFocus className="relative mt-5" block size="lg" onClick={dismissLevelUp}><Sparkles className="h-4 w-4" />Continuer</Button>
          </div>
        </div>
      )}

      {newBadge && !levelUp && (
        <div className="fixed inset-x-0 bottom-6 z-[87] flex justify-center px-4">
          <button onClick={dismissBadge} className="flex w-full max-w-sm animate-pop items-center gap-4 rounded-xl border border-primary/50 bg-surface p-4 text-left shadow-pop">
            <span className="flex h-14 w-14 shrink-0 animate-wiggle items-center justify-center rounded-full bg-primary/15 text-3xl ring-2 ring-primary">{newBadge.emoji}</span>
            <span className="flex-1">
              <span className="block text-2xs font-bold uppercase tracking-widest text-primary-ink">Badge débloqué</span>
              <span className="block font-display text-lg font-bold">{newBadge.label}</span>
              <span className="block text-xs text-muted">{newBadge.desc}</span>
            </span>
          </button>
        </div>
      )}
    </>
  );
}
