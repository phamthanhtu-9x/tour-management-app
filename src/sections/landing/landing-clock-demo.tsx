'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';

import { CONFIG } from 'src/config-global';

import { displayFont } from './landing-fonts';
import { LANDING_COLORS as C } from './landing-tokens';

// ----------------------------------------------------------------------

/** Thời lượng level demo (giây) – đếm ngược rồi lặp lại. */
const LEVEL_SECONDS = 20 * 60;
const START_REMAINING = 12 * 60 + 47;

const pad = (n: number) => n.toString().padStart(2, '0');
const vnNumber = (n: number) => n.toLocaleString('vi-VN');

/** Trạng thái hiển thị trên đồng hồ demo (số liệu ví dụ). */
export type ClockScene = {
  level: number;
  /** null = đang nghỉ. */
  blinds: string | null;
  ante: string | null;
  next: string;
  players: string;
  rebuys: string;
  avgStack: number;
  nextBreak: string;
};

export const CLOCK_SCENES: ClockScene[] = [
  {
    level: 6,
    blinds: '400 / 800',
    ante: '800',
    next: '500 / 1.000',
    players: '38 / 52',
    rebuys: '9 / 43',
    avgStack: 54737,
    nextBreak: '00:32:10',
  },
  {
    level: 7,
    blinds: '500 / 1.000',
    ante: '1.000',
    next: '600 / 1.200',
    players: '38 / 52',
    rebuys: '9 / 43',
    avgStack: 54737,
    nextBreak: '00:12:10',
  },
  {
    level: 7,
    blinds: '500 / 1.000',
    ante: '1.000',
    next: '600 / 1.200',
    players: '39 / 53',
    rebuys: '10 / 43',
    avgStack: 54359,
    nextBreak: '00:11:40',
  },
  {
    level: 8,
    blinds: null,
    ante: null,
    next: '600 / 1.200',
    players: '39 / 53',
    rebuys: '10 / 43',
    avgStack: 54359,
    nextBreak: '—',
  },
];

/**
 * Bản thu nhỏ màn hình Clock thật (tỉ lệ 16:9, chữ co giãn theo khung bằng cqw)
 * – dùng làm phần mở đầu landing page. Số liệu là ví dụ.
 */
type Props = {
  /** Cảnh đang hiển thị (mặc định cảnh đầu). */
  scene?: ClockScene;
};

export function LandingClockDemo({ scene = CLOCK_SCENES[0] }: Props) {
  const isBreak = scene.blinds == null;
  const [remaining, setRemaining] = useState(START_REMAINING);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((s) => (s <= 1 ? LEVEL_SECONDS : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <Box
      role="img"
      aria-label={
        isBreak
          ? 'Ví dụ màn hình đồng hồ giải đấu đang trong giờ nghỉ'
          : `Ví dụ màn hình đồng hồ giải đấu: Level ${scene.level}, blind ${scene.blinds}`
      }
      sx={{
        width: 1,
        aspectRatio: '16 / 9',
        containerType: 'inline-size',
        borderRadius: { xs: 1.5, md: 2 },
        overflow: 'hidden',
        position: 'relative',
        color: '#fff',
        bgcolor: '#6B1D2F',
        backgroundImage: `url(${CONFIG.assetsDir}/assets/background/tournament-bg/poker_clock_bg_01_crimson_rose.webp)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: `0 2px 0 ${C.gold}, 0 30px 60px -20px rgba(0,0,0,0.6)`,
        display: 'grid',
        gridTemplateColumns: '24% 1fr 24%',
        gridTemplateRows: 'auto 1fr',
        columnGap: '2cqw',
        p: '3cqw',
        fontFamily: displayFont.style.fontFamily,
      }}
    >
      {/* Tên giải */}
      <Box
        sx={{
          gridColumn: '1 / -1',
          textAlign: 'center',
          fontSize: '2.6cqw',
          fontWeight: 800,
          letterSpacing: '0.04em',
          mb: '1.5cqw',
        }}
      >
        Giải Hyper Turbo tối thứ Bảy
      </Box>

      {/* Cột trái: thống kê */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.6cqw', textAlign: 'center' }}>
        <Stat label="Người chơi" value={scene.players} />
        <Stat label="Re-buy / Buy-in" value={scene.rebuys} />
        <Stat label="Stack trung bình" value={vnNumber(scene.avgStack)} />
        <Stat label="Nghỉ sau" value={scene.nextBreak} />
      </Box>

      {/* Giữa: đồng hồ */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ fontSize: '2.4cqw', fontWeight: 600, opacity: 0.85 }}>
          {isBreak ? 'Giờ nghỉ' : `Level ${scene.level}`}
        </Box>
        <Box
          aria-hidden
          sx={{
            fontSize: '13.5cqw',
            fontWeight: 800,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.01em',
          }}
        >
          {pad(minutes)}:{pad(seconds)}
        </Box>
        <Box
          sx={{ fontSize: '5cqw', fontWeight: 800, color: C.gold, lineHeight: 1.1, mt: '0.5cqw' }}
        >
          {isBreak ? 'Nghỉ 10 phút' : scene.blinds}
        </Box>
        <Box sx={{ fontSize: '2.2cqw', fontWeight: 600, opacity: 0.85, minHeight: '3cqw' }}>
          {scene.ante ? `Ante ${scene.ante}` : ' '}
        </Box>
        <Box sx={{ fontSize: '1.9cqw', fontWeight: 600, opacity: 0.7, mt: '1.2cqw' }}>
          Level tiếp: {scene.next}
        </Box>
      </Box>

      {/* Cột phải: giải thưởng */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.1cqw', textAlign: 'center' }}>
        <Box sx={{ fontSize: '2cqw', fontWeight: 800, opacity: 0.9 }}>Giải thưởng</Box>
        {[
          ['Nhất', '40%'],
          ['Nhì', '25%'],
          ['Ba', '15%'],
          ['Tư', '12%'],
          ['Năm', '8%'],
        ].map(([rank, value]) => (
          <Box
            key={rank}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.9cqw',
              fontWeight: 600,
              borderBottom: '1px solid rgba(255,255,255,0.18)',
              pb: '0.5cqw',
            }}
          >
            <span>{rank}</span>
            <span>{value}</span>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Box sx={{ fontSize: '1.6cqw', fontWeight: 600, opacity: 0.75 }}>{label}</Box>
      <Box sx={{ fontSize: '2.6cqw', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Box>
    </Box>
  );
}
