import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export function IconShirt(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 3 4 6l2 3 2-1v10h8V8l2 1 2-3-4-3-2 2h-4z" />
    </svg>
  );
}

export function IconShoe(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 8h10a4 4 0 0 1 4 4v2h3v2H3z" />
      <path d="M3 8v8" />
    </svg>
  );
}

export function IconSparkle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8a4 4 0 0 0 4 4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0 4-4z" />
    </svg>
  );
}

export function IconSkin(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3c3 0 5 2 5 5 0 3-1 4 1 7s-1 6-6 6-7-2-6-6 1-4 1-7c0-3 2-5 5-5z" />
      <path d="M9 11h.01M15 11h.01M10 16c1 1 3 1 4 0" />
    </svg>
  );
}

export function IconProfile(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconArrow(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconUpload(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
    </svg>
  );
}

// Animated circular score ring (0-100).
export function ScoreRing({
  value,
  size = 96,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e091b4" />
            <stop offset="1" stopColor="#c8a15a" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-black text-accent-2">{value}%</span>
        {label && <span className="text-[10px] uppercase tracking-wide text-white/50">{label}</span>}
      </div>
    </div>
  );
}

export function IconRuler(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="8" width="18" height="8" rx="1" />
      <path d="M7 8v3M11 8v4M15 8v3M19 8v4" />
    </svg>
  );
}

export function IconCamera(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 8h3l2-2h6l2 2h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

// ---- Big decorative hero illustration ----
export function HeroArt(props: IconProps) {
  return (
    <svg viewBox="0 0 400 320" fill="none" {...props}>
      <defs>
        <linearGradient id="hg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e091b4" />
          <stop offset="1" stopColor="#c8a15a" />
        </linearGradient>
      </defs>

      {/* floating blobs */}
      <circle cx="60" cy="60" r="34" fill="#e091b4" opacity="0.18" />
      <circle cx="340" cy="80" r="46" fill="#c8a15a" opacity="0.16" />
      <circle cx="320" cy="250" r="28" fill="#e091b4" opacity="0.14" />

      {/* phone frame */}
      <rect x="150" y="40" width="100" height="200" rx="20" fill="#0b0b0f" stroke="url(#hg1)" strokeWidth="3" />
      <rect x="162" y="58" width="76" height="150" rx="10" fill="#ffffff" opacity="0.06" />

      {/* face on screen */}
      <circle cx="200" cy="110" r="22" fill="url(#hg1)" opacity="0.85" />
      <circle cx="192" cy="106" r="2.5" fill="#0b0b0f" />
      <circle cx="208" cy="106" r="2.5" fill="#0b0b0f" />
      <path d="M191 118c3 3 15 3 18 0" stroke="#0b0b0f" strokeWidth="2.4" strokeLinecap="round" />

      {/* dress overlay */}
      <path d="M180 150c0-6 4-10 8-8l12 6 12-6c4-2 8 2 8 8v44h-40z" fill="#c8a15a" opacity="0.9" />

      {/* sparkles */}
      <path d="M300 150l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#e091b4" />
      <path d="M95 200l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#c8a15a" />

      {/* confidence gauge */}
      <rect x="50" y="240" width="120" height="12" rx="6" fill="#ffffff" opacity="0.1" />
      <rect x="50" y="240" width="86" height="12" rx="6" fill="url(#hg1)" />
      <text x="50" y="232" fill="#ededed" fontSize="13" fontWeight="700">Fit Confidence 86%</text>
    </svg>
  );
}

// ---- Feature illustration: virtual try-on ----
export function ArtTryOn(props: IconProps) {
  return (
    <svg viewBox="0 0 120 100" fill="none" {...props}>
      <rect x="14" y="20" width="44" height="60" rx="10" fill="#e091b4" opacity="0.18" stroke="#e091b4" strokeWidth="2" />
      <circle cx="36" cy="38" r="9" fill="#e091b4" opacity="0.7" />
      <path d="M26 56c0-5 4-7 10-7s10 2 10 7v18H26z" fill="#e091b4" opacity="0.55" />
      <path d="M66 30c14 6 24 16 24 30 0 14-10 30-24 30" stroke="#c8a15a" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <path d="M92 24l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#c8a15a" />
    </svg>
  );
}

// ---- Feature illustration: skin ----
export function ArtSkin(props: IconProps) {
  return (
    <svg viewBox="0 0 120 100" fill="none" {...props}>
      <circle cx="60" cy="50" r="34" fill="#c8a15a" opacity="0.16" stroke="#c8a15a" strokeWidth="2" />
      <circle cx="50" cy="44" r="3" fill="#c8a15a" />
      <circle cx="70" cy="44" r="3" fill="#c8a15a" />
      <circle cx="48" cy="60" r="2.4" fill="#e091b4" />
      <circle cx="74" cy="58" r="2.4" fill="#e091b4" />
      <path d="M48 70c6 5 24 5 26 0" stroke="#c8a15a" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M16 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#e091b4" />
    </svg>
  );
}

// ---- Feature illustration: profile ----
export function ArtProfile(props: IconProps) {
  return (
    <svg viewBox="0 0 120 100" fill="none" {...props}>
      <circle cx="46" cy="40" r="16" fill="#e091b4" opacity="0.22" stroke="#e091b4" strokeWidth="2" />
      <path d="M22 82c0-14 11-22 24-22s24 8 24 22" stroke="#e091b4" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
      <rect x="78" y="26" width="26" height="6" rx="3" fill="#c8a15a" opacity="0.7" />
      <rect x="78" y="40" width="26" height="6" rx="3" fill="#c8a15a" opacity="0.5" />
      <rect x="78" y="54" width="26" height="6" rx="3" fill="#c8a15a" opacity="0.35" />
    </svg>
  );
}

// ---- Feature illustration: sizing ----
export function ArtSizing(props: IconProps) {
  return (
    <svg viewBox="0 0 120 100" fill="none" {...props}>
      <rect x="20" y="34" width="80" height="32" rx="6" fill="#e091b4" opacity="0.16" stroke="#e091b4" strokeWidth="2" />
      <path d="M34 34v10M48 34v14M62 34v10M76 34v14M88 34v10" stroke="#c8a15a" strokeWidth="2.4" strokeLinecap="round" />
      <text x="38" y="86" fill="#ededed" fontSize="11" fontWeight="700">S  M  L  XL</text>
    </svg>
  );
}

// ---- Empty state illustration ----
export function ArtEmpty(props: IconProps) {
  return (
    <svg viewBox="0 0 120 100" fill="none" {...props}>
      <rect x="30" y="28" width="60" height="44" rx="8" fill="#ffffff" opacity="0.05" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M44 60l12-12 8 8 12-14" stroke="#e091b4" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <circle cx="48" cy="44" r="4" fill="#c8a15a" opacity="0.7" />
    </svg>
  );
}
