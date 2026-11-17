"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const COLORS = ["#B7F34A", "#FFFFFF", "#22C55E", "#F59E0B", "#60A5FA", "#F472B6"];

/**
 * Canvas confetti burst. Re-fires whenever `fireKey` changes.
 * Pure canvas (no dependency), auto-stops after ~2.4 s, skipped under reduced motion.
 */
export function Confetti({ fireKey, origin = { x: 0.5, y: 0.35 } }: { fireKey: number; origin?: { x: number; y: number } }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!fireKey) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = (cv.width = cv.offsetWidth * dpr);
    const H = (cv.height = cv.offsetHeight * dpr);
    const parts = Array.from({ length: 140 }, () => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const v = (6 + Math.random() * 9) * dpr;
      return {
        x: origin.x * W, y: origin.y * H,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        w: (5 + Math.random() * 6) * dpr, h: (8 + Math.random() * 8) * dpr,
        r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.35,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        shape: Math.random() < 0.25 ? "circle" : "rect",
      };
    });
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const el = t - t0;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.vy += 0.28 * dpr;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - el / 2400);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        if (p.shape === "circle") { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)) + 2);
        ctx.restore();
      }
      if (el < 2400) raf = requestAnimationFrame(step);
      else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [fireKey, origin.x, origin.y]);
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[90] h-full w-full" />;
}

/** Animated number (ease-out), formats with fr-FR grouping. */
export function CountUp({ value, duration = 900, format, className }: { value: number; duration?: number; format?: (n: number) => string; className?: string }) {
  const [n, setN] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - k, 3);
      setN(a + (value - a) * e);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={cn("tabular", className)}>{format ? format(n) : Math.round(n).toLocaleString("fr-FR")}</span>;
}

/** Fades/slides children in when they enter the viewport. */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("transition-all duration-500 ease-out", shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/** Pulsing "live" dot. */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
    </span>
  );
}

/** Infinite horizontal ticker. Children are duplicated for a seamless loop. */
export function Marquee({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]", className)}>
      <div className="flex w-max animate-marquee gap-6 hover:[animation-play-state:paused]">
        <div className="flex gap-6">{children}</div>
        <div className="flex gap-6" aria-hidden>{children}</div>
      </div>
    </div>
  );
}
