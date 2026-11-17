"use client";
import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MapPoint { id: string; x: number; y: number; label: string; price?: string; active?: boolean }

/**
 * Stylised vector map of the Dakar peninsula (fictional, not to scale).
 * Stands in for Mapbox/Google Maps in the sandboxed prototype; the component API
 * (points, onSelect, selectedId) mirrors what a real map adapter would expose.
 */
export function DakarMap({ points, selectedId, onSelect, className, showUser = true }: { points: MapPoint[]; selectedId?: string; onSelect?: (id: string) => void; className?: string; showUser?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden bg-[#0B1A22] dark:bg-[#0B1A22]", className)}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="#1B3340" strokeWidth=".6" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill="url(#grid)" />
        {/* peninsula */}
        <path d="M-10 130 C40 90 70 60 120 70 C150 76 160 50 200 48 C250 46 300 80 340 70 C380 62 400 90 420 100 L420 320 L-10 320Z" fill="#17302A" />
        <path d="M120 70 C90 120 70 170 110 230 C150 290 260 300 330 250 C380 215 400 170 420 160" fill="none" stroke="#1F3D35" strokeWidth="18" />
        {/* roads */}
        <g stroke="#2A4A41" strokeWidth="3" fill="none" strokeLinecap="round">
          <path d="M30 130 C120 120 220 130 410 120" />
          <path d="M150 60 C170 140 190 220 200 310" />
          <path d="M260 60 C250 140 280 220 320 310" />
          <path d="M60 110 C140 180 260 200 410 230" />
        </g>
        <g fill="#5E7A71" fontSize="9" fontFamily="Inter" fontWeight="600" letterSpacing=".08em">
          <text x="38" y="100">ALMADIES</text>
          <text x="120" y="58">NGOR</text>
          <text x="226" y="70">YOFF</text>
          <text x="120" y="170">OUAKAM</text>
          <text x="210" y="160">MERMOZ</text>
          <text x="290" y="150">LIBERTÉ 6</text>
          <text x="230" y="250">POINT E</text>
          <text x="320" y="285">PLATEAU</text>
        </g>
        <text x="20" y="40" fill="#3B6B7D" fontSize="10" fontFamily="Inter" fontStyle="italic">Océan Atlantique</text>
      </svg>

      {showUser && (
        <span className="absolute" style={{ left: "47%", top: "52%" }}>
          <span className="absolute -left-4 -top-4 h-8 w-8 animate-ping rounded-full bg-info/30" />
          <span className="relative block h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-info" />
        </span>
      )}

      {points.map((p) => {
        const active = p.id === selectedId;
        return (
          <button
            key={p.id}
            onClick={() => onSelect?.(p.id)}
            aria-label={p.label}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-full transition-transform hover:z-10 hover:scale-105",
              active && "z-20 scale-110",
            )}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <span
              className={cn(
                "flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-2xs font-bold shadow-pop",
                active ? "bg-primary text-primary-fg" : "bg-white text-[#101A17]",
              )}
            >
              <MapPin className="h-3 w-3" />
              {p.price ?? p.label}
            </span>
          </button>
        );
      })}

      <div className="absolute bottom-3 right-3 flex flex-col gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#101A17] shadow-pop" title="Ma position (simulée)">
          <Navigation className="h-4 w-4" />
        </span>
      </div>
      <span className="absolute bottom-3 left-3 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white/70">Carte schématique · données fictives</span>
    </div>
  );
}
