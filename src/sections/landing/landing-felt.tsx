import type { SxProps, Theme } from '@mui/material/styles';

import Box from '@mui/material/Box';

import { LANDING_COLORS as C } from './landing-tokens';

// ----------------------------------------------------------------------

/** Vân nỉ: nhiễu SVG (feTurbulence) rất nhẹ, lặp lại – không cần ảnh ngoài. */
const FELT_NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

type Props = {
  sx?: SxProps<Theme>;
  /** Có vệt đèn rọi từ trên xuống. */
  spotlight?: boolean;
  children?: React.ReactNode;
};

/** Mặt nỉ bàn poker: màu nỉ + vân + ánh đèn rọi, tối dần ra mép. */
export function LandingFelt({ sx, spotlight = true, children }: Props) {
  return (
    <Box
      sx={[
        {
          position: 'relative',
          bgcolor: C.felt,
          backgroundImage: [
            spotlight
              ? `radial-gradient(ellipse 70% 60% at 50% 38%, rgba(64,140,96,0.55) 0%, rgba(15,61,42,0) 60%)`
              : null,
            `radial-gradient(ellipse 120% 90% at 50% 50%, rgba(0,0,0,0) 45%, ${C.feltDeep} 100%)`,
            FELT_NOISE,
          ]
            .filter(Boolean)
            .join(', '),
          backgroundSize: spotlight ? 'auto, auto, 160px 160px' : 'auto, 160px 160px',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
