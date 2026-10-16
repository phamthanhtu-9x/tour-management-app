import { LANDING_COLORS as C } from './landing-tokens';

// ----------------------------------------------------------------------

export type ChipTone = 'crimson' | 'onyx' | 'gold' | 'ivory';

const TONES: Record<ChipTone, { body: string; edge: string; inlay: string }> = {
  crimson: { body: C.crimson, edge: C.ivory, inlay: '#9E2343' },
  onyx: { body: C.onyx, edge: C.gold, inlay: '#2C2226' },
  gold: { body: C.gold, edge: C.onyx, inlay: '#B8923A' },
  ivory: { body: C.ivory, edge: C.crimson, inlay: '#E3D6C3' },
};

type Props = {
  tone?: ChipTone;
  size?: number;
};

/** Chip poker nhìn từ trên xuống (SVG): 8 vạch viền, vòng trong và mặt giữa. */
export function LandingChip({ tone = 'crimson', size = 64 }: Props) {
  const t = TONES[tone];

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden focusable="false">
      {/* Bóng đổ trên nỉ */}
      <ellipse cx="52" cy="55" rx="47" ry="47" fill="rgba(0,0,0,0.35)" />
      <circle cx="50" cy="50" r="47" fill={t.body} />
      {/* 8 vạch viền */}
      {Array.from({ length: 8 }).map((_, i) => (
        <rect
          key={i}
          x="44"
          y="3"
          width="12"
          height="15"
          rx="2"
          fill={t.edge}
          transform={`rotate(${i * 45} 50 50)`}
        />
      ))}
      <circle
        cx="50"
        cy="50"
        r="31"
        fill="none"
        stroke={t.edge}
        strokeWidth="2"
        strokeDasharray="5 4"
      />
      <circle cx="50" cy="50" r="25" fill={t.inlay} />
      <circle
        cx="50"
        cy="50"
        r="25"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
      />
      {/* Ánh sáng phản chiếu nhẹ */}
      <ellipse
        cx="38"
        cy="32"
        rx="18"
        ry="9"
        fill="rgba(255,255,255,0.12)"
        transform="rotate(-25 38 32)"
      />
    </svg>
  );
}
