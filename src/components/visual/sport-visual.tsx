import { cn } from "@/lib/utils";

export type SportKey = "football" | "basketball" | "tennis" | "padel" | "volley" | "handball" | "running";

/**
 * Stylised "photo" placeholder per sport. Rendered in SVG so the prototype ships
 * with zero external images (the sandbox blocks remote assets). Replace with
 * real photography (`<Image src=…>`) when the media CDN is available.
 */
const palettes: Record<SportKey, [string, string, string]> = {
  football: ["#1F5131", "#2E7A45", "#E9FFD0"],
  basketball: ["#7A3B17", "#B5602A", "#FFE7D1"],
  tennis: ["#1D4A6B", "#2C6E9E", "#E6F4FF"],
  padel: ["#174A4A", "#227070", "#DFFAF5"],
  volley: ["#6B5A1D", "#A68A2C", "#FFF6D6"],
  handball: ["#4A1D5E", "#6E2C8C", "#F5E6FF"],
  running: ["#5E1D2C", "#8C2C42", "#FFE6EC"],
};

export function SportVisual({ sport, className, seed = 0, label }: { sport: SportKey; className?: string; seed?: number; label?: string }) {
  const [a, b, line] = palettes[sport];
  const rot = (seed * 37) % 18 - 9;
  return (
    <div className={cn("relative overflow-hidden bg-surface-2", className)} role="img" aria-label={label ?? `Illustration ${sport}`}>
      <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id={`g-${sport}-${seed}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={b} />
            <stop offset="1" stopColor={a} />
          </linearGradient>
          <radialGradient id={`l-${sport}-${seed}`} cx={0.2 + (seed % 5) * 0.15} cy="0" r="0.9">
            <stop offset="0" stopColor="#fff" stopOpacity=".28" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="240" fill={`url(#g-${sport}-${seed})`} />
        {sport === "football" &&
          Array.from({ length: 8 }).map((_, i) => <rect key={i} x={i * 50} y="0" width="25" height="240" fill="#000" opacity=".06" />)}
        <g transform={`rotate(${rot} 200 120)`} stroke={line} strokeOpacity=".55" strokeWidth="2.5" fill="none">
          {sport === "football" && (
            <>
              <rect x="30" y="30" width="340" height="180" />
              <line x1="200" y1="30" x2="200" y2="210" />
              <circle cx="200" cy="120" r="34" />
              <rect x="30" y="78" width="46" height="84" />
              <rect x="324" y="78" width="46" height="84" />
            </>
          )}
          {(sport === "basketball" || sport === "handball") && (
            <>
              <rect x="30" y="30" width="340" height="180" />
              <line x1="200" y1="30" x2="200" y2="210" />
              <circle cx="200" cy="120" r="28" />
              <path d="M30 60 Q130 120 30 180" />
              <path d="M370 60 Q270 120 370 180" />
            </>
          )}
          {(sport === "tennis" || sport === "padel" || sport === "volley") && (
            <>
              <rect x="40" y="40" width="320" height="160" />
              <line x1="200" y1="30" x2="200" y2="210" strokeWidth="4" />
              <line x1="40" y1="70" x2="360" y2="70" />
              <line x1="40" y1="170" x2="360" y2="170" />
              <line x1="110" y1="120" x2="290" y2="120" />
            </>
          )}
          {sport === "running" &&
            [0, 1, 2, 3].map((i) => <ellipse key={i} cx="200" cy="120" rx={170 - i * 22} ry={100 - i * 18} />)}
        </g>
        <rect width="400" height="240" fill={`url(#l-${sport}-${seed})`} />
        <rect y="140" width="400" height="100" fill="url(#fade)" />
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".45" />
        </linearGradient>
      </svg>
    </div>
  );
}
