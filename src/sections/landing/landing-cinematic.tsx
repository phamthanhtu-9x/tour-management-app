'use client';

import type { MotionValue } from 'framer-motion';
import type { ChipTone } from './landing-chip';

import { useRef, useState } from 'react';
import { m, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { LandingChip } from './landing-chip';
import { LandingFelt } from './landing-felt';
import { displayFont } from './landing-fonts';
import { LANDING_COLORS as C } from './landing-tokens';
import { CLOCK_SCENES, LandingClockDemo } from './landing-clock-demo';

// ----------------------------------------------------------------------
// Chuỗi cuộn "Từ bàn chơi đến màn hình lớn" (chỉ desktop, không bật khi giảm chuyển động).
//
// Tiến trình cuộn p (0 → 1) của khung ghim:
//   0.00 – 0.18  mặt bàn + tiêu đề; tiêu đề mờ dần
//   0.10 – 0.36  camera lùi, chip trôi về giữa và mờ dần
//   0.22 – 0.46  TV xuất hiện nhỏ rồi phóng to
//   0.46 – 1.00  4 cảnh trên đồng hồ (SCENE_STARTS)
// ----------------------------------------------------------------------

/** Mốc tiến trình bắt đầu từng cảnh của đồng hồ. */
const SCENE_STARTS = [0.46, 0.62, 0.76, 0.88];

const CAPTIONS = [
  {
    title: 'Đồng hồ chạy trên TV',
    text: 'Blind, level tiếp theo, giờ nghỉ và giải thưởng hiện rõ cho cả phòng.',
  },
  {
    title: 'Hết giờ là tự lên blind',
    text: 'Level tự chuyển đúng giờ, không cần ai đứng canh đồng hồ.',
  },
  {
    title: 'Re-buy ngay tại bàn',
    text: 'Bấm trên điện thoại, số người chơi và stack trung bình trên TV cập nhật ngay.',
  },
  {
    title: 'Đến giờ nghỉ, cả phòng cùng biết',
    text: 'Màn hình chuyển sang giờ nghỉ và đếm ngược tới level tiếp theo.',
  },
];

/** Vị trí chip trên mặt bàn (% khung), tránh vùng tiêu đề ở giữa. */
const CHIPS: { left: number; top: number; tone: ChipTone; size: number; spin: number }[] = [
  { left: 10, top: 20, tone: 'crimson', size: 96, spin: 40 },
  { left: 17, top: 31, tone: 'onyx', size: 72, spin: -60 },
  { left: 7, top: 60, tone: 'gold', size: 84, spin: 90 },
  { left: 19, top: 73, tone: 'crimson', size: 66, spin: -30 },
  { left: 31, top: 87, tone: 'ivory', size: 58, spin: 70 },
  { left: 83, top: 18, tone: 'gold', size: 88, spin: -80 },
  { left: 90, top: 33, tone: 'crimson', size: 68, spin: 50 },
  { left: 79, top: 69, tone: 'onyx', size: 98, spin: -45 },
  { left: 91, top: 79, tone: 'ivory', size: 72, spin: 65 },
  { left: 67, top: 10, tone: 'onyx', size: 56, spin: -70 },
];

const display = displayFont.style.fontFamily;

// ----------------------------------------------------------------------

type Props = {
  /** Nút hành động ở cảnh mở đầu (Liên hệ / Đăng nhập / Vào Dashboard). */
  actions: React.ReactNode;
  headline: string;
  lead: string;
};

export function LandingCinematic({ actions, headline, lead }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress: p } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // ---- Cảnh đồng hồ: chỉ đổi state khi vượt mốc (không re-render mỗi khung hình) ----
  const [sceneIndex, setSceneIndex] = useState(0);
  useMotionValueEvent(p, 'change', (v) => {
    let next = 0;
    SCENE_STARTS.forEach((start, i) => {
      if (v >= start) next = i;
    });
    setSceneIndex((prev) => (prev === next ? prev : next));
  });

  // ---- Camera lùi + tối dần ----
  const feltScale = useTransform(p, [0, 0.36], [1.22, 1]);
  const dim = useTransform(p, [0.18, 0.46], [0, 0.6]);

  // ---- Tiêu đề mở đầu ----
  const titleOpacity = useTransform(p, [0.05, 0.17], [1, 0]);
  const titleY = useTransform(p, [0, 0.17], [0, -80]);
  const titlePointer = useTransform(p, (v) => (v < 0.15 ? 'auto' : 'none'));
  const hintOpacity = useTransform(p, [0, 0.05], [1, 0]);

  // ---- TV ----
  const tvOpacity = useTransform(p, [0.22, 0.3], [0, 1]);
  const tvScale = useTransform(p, [0.22, 0.46], [0.26, 1]);
  const tvY = useTransform(p, [0.22, 0.46], ['10vh', '-6vh']);

  // ---- Chú thích + tiến trình cảnh ----
  const captionOpacity = useTransform(p, [0.44, 0.5], [0, 1]);

  const caption = CAPTIONS[sceneIndex];

  return (
    <Box ref={containerRef} sx={{ position: 'relative', height: '520vh' }}>
      <Box sx={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        {/* Mặt bàn nỉ (phóng nhẹ → camera lùi) */}
        <m.div style={{ scale: feltScale, position: 'absolute', inset: 0 }}>
          <LandingFelt sx={{ position: 'absolute', inset: 0 }} />
        </m.div>

        {/* Chip trên bàn */}
        {CHIPS.map((chip, i) => (
          <FlyingChip key={i} progress={p} {...chip} />
        ))}

        {/* Lớp tối dần khi TV lên */}
        <m.div
          style={{ opacity: dim, position: 'absolute', inset: 0, background: '#000' }}
          aria-hidden
        />

        {/* ---- Cảnh mở đầu: tiêu đề ---- */}
        <m.div
          style={{
            opacity: titleOpacity,
            y: titleY,
            pointerEvents: titlePointer,
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ textAlign: 'center', px: 3, maxWidth: 760, color: C.ivory }}>
            <Typography
              component="h1"
              sx={{
                fontFamily: display,
                fontWeight: 800,
                lineHeight: 1.08,
                fontSize: { md: 76, lg: 92 },
                textShadow: '0 2px 0 rgba(0,0,0,0.35), 0 18px 40px rgba(0,0,0,0.45)',
              }}
            >
              {headline}
            </Typography>
            <Typography
              sx={{
                mt: 3,
                mx: 'auto',
                maxWidth: 540,
                fontSize: 18,
                lineHeight: 1.65,
                color: 'rgba(244,235,221,0.82)',
              }}
            >
              {lead}
            </Typography>
            <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 4 }}>
              {actions}
            </Stack>
          </Box>
        </m.div>

        {/* Gợi ý cuộn */}
        <m.div
          style={{
            opacity: hintOpacity,
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 28,
            textAlign: 'center',
            color: 'rgba(244,235,221,0.7)',
          }}
          aria-hidden
        >
          <Typography variant="body2">Cuộn xuống để xem đồng hồ lên TV</Typography>
          <Iconify icon="eva:arrow-ios-downward-fill" width={22} sx={{ mt: 0.5 }} />
        </m.div>

        {/* ---- TV + đồng hồ ----
            Lớp ngoài căn giữa bằng flex; lớp trong chỉ animate opacity / scale / y
            (framer-motion coi `y` và `translateY` là một, nên không dùng translate để căn giữa). */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <m.div style={{ opacity: tvOpacity, scale: tvScale, y: tvY, width: 'min(84vw, 128vh)' }}>
            <TvFrame>
              <LandingClockDemo scene={CLOCK_SCENES[sceneIndex]} />
            </TvFrame>
          </m.div>
        </Box>

        {/* ---- Chú thích từng cảnh ---- */}
        <m.div
          style={{
            opacity: captionOpacity,
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '4vh',
          }}
        >
          <Box sx={{ textAlign: 'center', color: C.ivory, px: 3 }} aria-live="polite">
            <m.div
              key={sceneIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <Typography
                component="p"
                sx={{
                  fontFamily: display,
                  fontWeight: 800,
                  fontSize: { md: 30, lg: 34 },
                  lineHeight: 1.15,
                }}
              >
                {caption.title}
              </Typography>
              <Typography sx={{ mt: 0.5, color: 'rgba(244,235,221,0.75)' }}>
                {caption.text}
              </Typography>
            </m.div>

            {/* Tiến trình 4 cảnh */}
            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }} aria-hidden>
              {CAPTIONS.map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 28,
                    height: 4,
                    borderRadius: 2,
                    bgcolor: i <= sceneIndex ? C.gold : 'rgba(244,235,221,0.25)',
                    transition: 'background-color 0.3s',
                  }}
                />
              ))}
            </Stack>
          </Box>
        </m.div>
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

type FlyingChipProps = {
  progress: MotionValue<number>;
  left: number;
  top: number;
  tone: ChipTone;
  size: number;
  spin: number;
};

/** Một chip trên bàn: trôi về giữa, xoay, thu nhỏ và mờ dần khi camera lùi. */
function FlyingChip({ progress, left, top, tone, size, spin }: FlyingChipProps) {
  const x = useTransform(progress, [0.1, 0.34], ['0vw', `${(50 - left) * 0.9}vw`]);
  const y = useTransform(progress, [0.1, 0.34], ['0vh', `${(50 - top) * 0.9}vh`]);
  const scale = useTransform(progress, [0.1, 0.34], [1, 0.35]);
  const rotate = useTransform(progress, [0, 0.34], [0, spin]);
  const opacity = useTransform(progress, [0.26, 0.36], [1, 0]);

  return (
    <m.div
      aria-hidden
      style={{
        x,
        y,
        scale,
        rotate,
        opacity,
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
    >
      <LandingChip tone={tone} size={size} />
    </m.div>
  );
}

// ----------------------------------------------------------------------

/** Khung TV: viền đen, đường chỉ vàng, chân đế. */
function TvFrame({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Box
        sx={{
          p: '1.1%',
          borderRadius: '14px',
          bgcolor: '#0C0A0B',
          boxShadow: `0 0 0 1px rgba(212,175,90,0.45), 0 40px 90px -20px rgba(0,0,0,0.85)`,
        }}
      >
        {children}
      </Box>
      {/* Chân đế */}
      <Box
        aria-hidden
        sx={{
          mx: 'auto',
          width: '22%',
          height: 14,
          bgcolor: '#0C0A0B',
          clipPath: 'polygon(12% 0, 88% 0, 100% 100%, 0 100%)',
        }}
      />
    </Box>
  );
}
