import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';

import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

type Props = {
  /** Nội dung cột giữa của top row (title, desc). */
  topCenter: ReactNode;
  /** Slot cho nút fullscreen nằm ở cột phải của top row. */
  topRight: ReactNode;
  /** Nội dung cột trái (bottom row). */
  left: ReactNode;
  /** Nội dung cột giữa (bottom row). */
  center: ReactNode;
  /** Nội dung cột phải (bottom row). */
  right: ReactNode;
  /** Khi true: fill toàn bộ màn hình (bỏ ràng buộc 16:9). */
  fullscreen?: boolean;
  /** Ảnh nền (URL). Không có → chỉ dùng màu nền. */
  backgroundImage?: string | null;
  /** Màu nền (màu trơn, hoặc màu tạm trong lúc ảnh nền đang tải). */
  backgroundColor?: string;
  /** Mini clock (mobile): nền kiểu Card, bỏ tỉ lệ 16:9 để khung cao theo nội dung, thu gọn padding. */
  compact?: boolean;
};

/**
 * Layout 16:9 cho tab Clock.
 *
 * Cấu trúc top row (3 cột, sides < center 25%):
 *   ┌──────────┬────────────┬──────────┐
 *   │  (empty) │  topCenter │ topRight │
 *   └──────────┴────────────┴──────────┘
 *
 * Cấu trúc bottom row (3 cột):
 *   ┌────────┬────────┬────────┐
 *   │  left  │ center │ right  │
 *   └────────┴────────┴────────┘
 */
export const TournamentClockLayout = forwardRef<HTMLDivElement, Props>(function TournamentClockLayout(
  {
    topCenter,
    topRight,
    left,
    center,
    right,
    fullscreen,
    backgroundImage,
    backgroundColor = '#BE3455',
    compact,
  },
  ref: Ref<HTMLDivElement>,
) {
  const sideWidth = 25; // bottom row
  const topSideWidth = 10; // top row: center = sides × 1.25 → sides ≈ 30.77

  return (
    <Box
      ref={ref}
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '2cqw',
        bgcolor: backgroundColor,
        ...(backgroundImage && !compact && {
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }),
        color: '#fff',
        position: 'relative',
        containerType: 'inline-size',
        ...(!fullscreen && !compact && { aspectRatio: '16 / 9' }),
        // Mini clock: nền giống thẻ Card (MuiPaper) thay cho nền ảnh của Clock
        ...(compact && {
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: (theme) => theme.customShadows.card,
          borderRadius: 2,
          overflow: 'hidden',
          pb: 2,
        }),
      }}
    >
      {/* ----- Top row: 3 cols ----- */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          px: compact ? 1.5 : 3,
          paddingTop: compact ? 1.5 : '1cqw',
        }}
      >
        <Box sx={{ width: `${topSideWidth}%` }} />
        <Box sx={{ flex: 1, textAlign: 'center' }}>{topCenter}</Box>
        <Box sx={{ width: `${topSideWidth}%`, display: 'flex', justifyContent: 'flex-end' }}>
          {topRight}
        </Box>
      </Box>

      {/* ----- Bottom row: 3 cols ----- */}
      <Box sx={{ flex: 1, display: 'flex', gap: compact ? 1 : 2, px: compact ? 1 : 0 }}>
        <Box sx={{ width: `${sideWidth}%` }}>{left}</Box>
        <Box sx={{ flex: 1 }}>{center}</Box>
        <Box sx={{ width: `${sideWidth}%` }}>{right}</Box>
      </Box>
    </Box>
  );
});
