/**
 * SportMatch illustration set — flat geometric, brand palette only
 * (lime #B7F34A, deep green #101A17/#202D28, white, one accent).
 * Shared stroke weight (3) and corner language so they read as one family.
 */
type P = { className?: string };
const L = "#B7F34A";
const D = "#101A17";
const S2 = "#202D28";
const W = "#FFFFFF";

export function TrophyIllustration({ className }: P) {
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden>
      <circle cx="80" cy="80" r="70" fill={L} opacity=".12" />
      <g stroke={D} strokeWidth="3" strokeLinejoin="round">
        <path d="M52 34h56v26a28 28 0 0 1-56 0Z" fill={L} />
        <path d="M52 42H38a14 14 0 0 0 16 20M108 42h14a14 14 0 0 1-16 20" fill="none" />
        <path d="M72 86h16v16H72Z" fill={L} />
        <path d="M58 118h44l-5-16H63Z" fill={S2} />
        <path d="M50 118h60v10H50Z" fill={D} />
      </g>
      <path d="M68 46l6 6 14-14" stroke={D} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".0" />
      <path d="M80 44l4 8.5 9.3 1.3-6.7 6.6 1.6 9.2L80 65.2l-8.2 4.4 1.6-9.2-6.7-6.6 9.3-1.3Z" fill={D} />
      {[[30, 30], [128, 26], [136, 96], [22, 100]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 6}v12M${x - 6} ${y}h12`} stroke={L} strokeWidth="3" strokeLinecap="round" />
      ))}
    </svg>
  );
}

/** Footballer striking a ball — faceless, geometric, not a real person. */
export function PlayerIllustration({ className }: P) {
  const skin = "#8A5636";
  const skinHi = "#A86C47";
  return (
    <svg viewBox="0 0 220 200" className={className} aria-hidden>
      <ellipse cx="112" cy="186" rx="78" ry="7" fill="#000" opacity=".28" />
      <path d="M18 156c42-28 120-36 192-16" stroke={L} strokeWidth="2" strokeDasharray="4 7" fill="none" opacity=".45" />
      <g strokeLinecap="round" strokeLinejoin="round">
        {/* support leg */}
        <path d="M100 120l-7 30 3 22" stroke={skin} strokeWidth="11" fill="none" />
        <path d="M94 158l2 16" stroke={W} strokeWidth="12" />
        <path d="M90 181h16" stroke={D} strokeWidth="9" />
        <path d="M90 181h16" stroke={L} strokeWidth="2" opacity=".8" />
        {/* back arm */}
        <path d="M92 64l-22 16-10 16" stroke={skin} strokeWidth="9" fill="none" />
        <path d="M92 64l-12 9" stroke={L} strokeWidth="13" />
        {/* shorts */}
        <path d="M91 102h30l5 20-15 2-4-8-4 9-15-2Z" fill="#0B1310" stroke={L} strokeWidth="2" />
        {/* kicking leg */}
        <path d="M116 120l20 16 28-11" stroke={skinHi} strokeWidth="11" fill="none" />
        <path d="M150 131l14-6" stroke={W} strokeWidth="12" />
        <path d="M166 124l10-4" stroke={D} strokeWidth="10" />
        {/* torso / jersey */}
        <path d="M88 58c8-6 22-6 30 0l3 46H92Z" fill={L} stroke={D} strokeWidth="2.5" />
        <path d="M96 57c3 4 9 4 12 0" stroke={D} strokeWidth="2.5" fill="none" />
        {/* front arm */}
        <path d="M116 64l24-4 12-18" stroke={skinHi} strokeWidth="9" fill="none" />
        <path d="M116 64l12-2" stroke={L} strokeWidth="13" />
        {/* head */}
        <path d="M101 50v6" stroke={skin} strokeWidth="8" />
        <circle cx="102" cy="36" r="14" fill={skinHi} />
        <path d="M88 34a14 14 0 0 1 28-3c-6-3-14-4-28 3Z" fill={D} />
      </g>
      <text x="105" y="90" textAnchor="middle" fontFamily="Manrope, Inter, sans-serif" fontWeight="800" fontSize="18" fill={D}>10</text>
      {/* ball + motion */}
      <g>
        <circle cx="192" cy="112" r="12" fill={W} stroke={D} strokeWidth="2.5" />
        <path d="M192 104l6.5 4.6-2.5 7.6h-8l-2.5-7.6Z" fill={D} />
        <path d="M150 100h16M156 112h12M152 88h10" stroke={L} strokeWidth="3" strokeLinecap="round" opacity=".7" />
      </g>
    </svg>
  );
}

export function StadiumIllustration({ className }: P) {
  return (
    <svg viewBox="0 0 240 150" className={className} aria-hidden>
      <path d="M10 110c30-50 190-50 220 0v20H10Z" fill={S2} />
      <path d="M22 108c32-38 164-38 196 0" stroke={L} strokeWidth="3" fill="none" opacity=".5" />
      <path d="M34 112c30-28 142-28 172 0v18H34Z" fill="#1F5131" />
      <path d="M120 96v34M60 118h120" stroke={W} strokeWidth="2" opacity=".55" />
      <ellipse cx="120" cy="118" rx="14" ry="6" stroke={W} strokeWidth="2" fill="none" opacity=".55" />
      {[38, 202].map((x) => (
        <g key={x}>
          <path d={`M${x} 110V30`} stroke={D} strokeWidth="4" />
          <rect x={x - 14} y="18" width="28" height="14" rx="3" fill={D} />
          {[0, 1, 2].map((i) => <circle key={i} cx={x - 8 + i * 8} cy="25" r="3" fill={L} />)}
          <path d={`M${x} 32L${x < 120 ? x + 60 : x - 60} 110`} stroke={L} strokeWidth="24" opacity=".08" />
        </g>
      ))}
      {Array.from({ length: 22 }).map((_, i) => (
        <circle key={i} cx={30 + i * 8.6} cy={84 - Math.sin((i / 21) * Math.PI) * 18} r="2.4" fill={i % 3 ? W : L} opacity=".55" />
      ))}
    </svg>
  );
}

export function EmptyNetIllustration({ className }: P) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden>
      <ellipse cx="80" cy="106" rx="60" ry="6" fill={D} opacity=".2" />
      <path d="M28 100V30h104v70" stroke={W} strokeWidth="4" fill="none" strokeLinejoin="round" />
      <g stroke={W} opacity=".25" strokeWidth="1.5">
        {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M${38 + i * 10.5} 32v68`} />)}
        {Array.from({ length: 6 }).map((_, i) => <path key={i} d={`M30 ${42 + i * 11}h100`} />)}
      </g>
      <circle cx="122" cy="96" r="9" fill={L} stroke={D} strokeWidth="2.5" />
      <path d="M118 22c4-6 10-6 14 0" stroke={L} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M126 12v4" stroke={L} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function WhistleIllustration({ className }: P) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <circle cx="60" cy="60" r="52" fill={L} opacity=".12" />
      <path d="M30 56h44a18 18 0 1 1-18 18H40a10 10 0 0 1-10-10Z" fill={L} stroke={D} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="74" cy="74" r="7" fill={D} />
      <path d="M30 56l-6-14h18l4 14" fill={S2} stroke={D} strokeWidth="3" strokeLinejoin="round" />
      <path d="M84 34l8-10M94 44l12-4M74 30l2-12" stroke={L} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export function CalendarIllustration({ className }: P) {
  return (
    <svg viewBox="0 0 140 120" className={className} aria-hidden>
      <rect x="20" y="22" width="100" height="84" rx="12" fill={S2} stroke={D} strokeWidth="3" />
      <rect x="20" y="22" width="100" height="22" rx="12" fill={L} />
      <path d="M20 40h100" stroke={D} strokeWidth="3" />
      <path d="M46 14v16M94 14v16" stroke={D} strokeWidth="5" strokeLinecap="round" />
      {[0, 1, 2, 3].map((c) => [0, 1, 2].map((r) => (
        <rect key={`${c}${r}`} x={32 + c * 21} y={52 + r * 17} width="13" height="10" rx="3" fill={c === 2 && r === 1 ? L : W} opacity={c === 2 && r === 1 ? 1 : 0.18} />
      )))}
      <circle cx="108" cy="96" r="14" fill={L} stroke={D} strokeWidth="3" />
      <path d="M101 96l5 5 9-10" stroke={D} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TeamIllustration({ className }: P) {
  const head = (x: number, y: number, c: string) => (
    <g key={`${x}${y}`}>
      <circle cx={x} cy={y} r="11" fill={W} />
      <path d={`M${x - 17} ${y + 36}a17 17 0 0 1 34 0`} fill={c} />
    </g>
  );
  return (
    <svg viewBox="0 0 180 110" className={className} aria-hidden>
      <ellipse cx="90" cy="100" rx="78" ry="6" fill={D} opacity=".2" />
      {head(40, 46, S2)}{head(140, 46, S2)}
      {head(66, 40, L)}{head(114, 40, L)}
      {head(90, 34, L)}
      <circle cx="90" cy="34" r="11" fill={W} stroke={L} strokeWidth="3" />
      <path d="M78 14l4 6 8-8 8 8 4-6v10H78Z" fill={L} stroke={D} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
