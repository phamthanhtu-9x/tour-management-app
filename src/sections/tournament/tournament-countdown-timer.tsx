import type { TourLevelItemDto, TourControlData } from 'src/services/types';
import type { ITourState, ITourLevelsPayload } from 'src/types/tour-socket';

import { useMemo, useState, useEffect, useRef } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { tourService } from 'src/services';

import {
  formatBlinds,
  findNextBlindLevel,
  findNextLevel,
  getBlindLevelNumber,
  blindsLabel,
} from './tournament-clock-utils';

// ----------------------------------------------------------------------

/**
 * Data đồng bộ cho countdown timer (Clock view 16:9).
 */
export type CountdownTimerData = {
  /** Số thứ tự blind level hiện tại (1-based), hoặc '—' nếu không xác định. */
  level: number | string;
  /** Thời gian đếm ngược hiển thị (mm:ss). */
  time: string;
  /** Chuỗi blinds hiện tại, ví dụ '100/200/100'. */
  blinds: string;
  /** Số thứ tự blind level kế tiếp, hoặc '—'. */
  nextLevel: number | string;
  /** Chuỗi blinds kế tiếp, '' nếu là break hoặc không có. */
  nextBlinds: string;
  /** Hiện tại đang ở level BREAK. */
  isBreak?: boolean;
  /** Level kế tiếp là BREAK. */
  isNextBreak?: boolean;
};

// ----------------------------------------------------------------------

type Props = {
  /** Real-time tour state từ WebSocket. Cần để lấy elapsedSeconds, currentLevel, isPaused. */
  tourState?: ITourState | null;
  /** Levels đã merge (socket hoặc REST). */
  levels: TourLevelItemDto[];
  /** Levels có đang được load không. */
  loading?: boolean;
  /** REST control data (dùng elapsedSeconds khi không có socket). */
  restControl?: TourControlData | null;
  /** Tour ID – dùng để gọi trực tiếp API getTourControl khi tab quay lại. */
  tourId?: number;
};

// ----------------------------------------------------------------------

/** Format giây → MM:SS (phút cũng pad 2 chữ số) */
function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ----------------------------------------------------------------------

/**
 * Countdown Timer cho Clock tab (view 16:9).
 *
 * Cơ chế đồng bộ (timestamp-based):
 * - Server push `elapsedSeconds` khi state thay đổi → làm mốc neo + ghi nhận Date.now().
 * - Client tính elapsed = serverAnchor + (Date.now() - anchorTimestamp) / 1000.
 * - Khi tour paused → dừng tick.
 * - Khi `elapsedSeconds` / `currentLevel` từ server thay đổi → reset mốc neo.
 * - `visibilitychange` → tính lại ngay khi tab quay lại foreground.
 * → Không drift khi tab background, sai số ≤ 1 giây.
 */
export function TournamentCountdownTimer({
  tourState,
  levels,
  loading,
  restControl,
  tourId,
}: Props) {
  // -------------------------------------------------------
  // Client-side ticking
  // -------------------------------------------------------
  const [displayElapsed, setDisplayElapsed] = useState<number>(tourState?.elapsedSeconds ?? 0);

  const serverElapsed = tourState?.elapsedSeconds;
  const serverLevel = tourState?.currentLevel;
  const isPaused = tourState?.isPaused ?? true;
  const isRunning = tourState?.isRunning ?? false;

  // SRC chính của elapsed: socket ưu tiên, fallback REST control.
  const anchorElapsed: number | undefined = serverElapsed ?? restControl?.elapsedSeconds;

  // Mốc neo: elapsed của server + thời điểm (Date.now) nhận được mốc đó.
  const anchorRef = useRef<{ elapsed: number; at: number }>({
    elapsed: anchorElapsed ?? 0,
    at: Date.now(),
  });

  // Reset mốc neo mỗi khi server/socket hoặc REST control gửi elapsed mới.
  useEffect(() => {
    if (anchorElapsed != null) {
      anchorRef.current = { elapsed: anchorElapsed, at: Date.now() };
      setDisplayElapsed(anchorElapsed);
    }
  }, [anchorElapsed, serverLevel]);

  // Khi component mount (vd: chuyển tab quay lại Clock): gọi thẳng API lấy elapsed chuẩn từ server.
  // Tránh trường hợp tourState chưa có update mới → displayElapsed khởi tạo từ giá trị cũ.
  useEffect(() => {
    if (!tourId) return;

    tourService.getTourControl(tourId).then((res: unknown) => {
      const data: TourControlData | null = (res as any)?.data ?? res;
      if (data?.elapsedSeconds != null) {
        anchorRef.current = { elapsed: data.elapsedSeconds, at: Date.now() };
        setDisplayElapsed(data.elapsedSeconds);
      }
    }).catch(() => {
      // Bỏ qua lỗi – anchor vẫn chạy từ giá trị khởi tạo.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId]);

  // Tick mỗi giây khi đang chạy: tính elapsed từ timestamp thực.
  useEffect(() => {
    if (!isRunning || isPaused) return undefined;

    const tick = () => {
      const { elapsed, at } = anchorRef.current;
      const realElapsed = elapsed + Math.floor((Date.now() - at) / 1000);
      setDisplayElapsed(realElapsed);
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  // Khi tab quay lại foreground: tính lại từ anchor + gọi thẳng API lấy elapsed chuẩn.
  // Gọi trực tiếp tourService.getTourControl thay vì SWR mutate để đảm bảo API luôn chạy,
  // không bị ảnh hưởng bởi SWR cache policy.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      if (!tourId) return;

      // Tính lại ngay từ anchor (chống setInterval bị throttle khi background).
      const { elapsed, at } = anchorRef.current;
      setDisplayElapsed(elapsed + Math.floor((Date.now() - at) / 1000));

      // Gọi API trực tiếp lấy elapsedSeconds từ server.
      tourService.getTourControl(tourId).then((res: unknown) => {
        const data: TourControlData | null = (res as any)?.data ?? res;
        if (data?.elapsedSeconds != null) {
          anchorRef.current = { elapsed: data.elapsedSeconds, at: Date.now() };
          setDisplayElapsed(data.elapsedSeconds);
        }
      }).catch(() => {
        // Bỏ qua lỗi – anchor vẫn đang chạy từ timestamp.
      });
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
    // Chỉ gắn listener 1 lần dựa trên tourId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId]);

  // -------------------------------------------------------
  // Build clock data
  // -------------------------------------------------------
  const clockData = useMemo<CountdownTimerData>(() => {
    const currentLevelIdx = tourState?.currentLevel;
    const currentLevelObj = levels.find((l) => l.idx === currentLevelIdx);
    const nextBlindLevelObj = currentLevelIdx ? findNextBlindLevel(levels, currentLevelIdx) : null;
    const nextLevelObj = currentLevelIdx ? findNextLevel(levels, currentLevelIdx) : null;

    const currentIsBreak = currentLevelObj?.type === 'BREAK';
    const nextIsBreak = nextLevelObj?.type === 'BREAK';

    const currentBlindNumber = currentLevelObj
      ? getBlindLevelNumber(currentLevelObj, levels)
      : null;
    const nextBlindNumber = nextLevelObj ? getBlindLevelNumber(nextLevelObj, levels) : null;

    // ---- Time: remaining = duration - elapsed ----
    const durationMinutes = currentLevelObj?.duration ?? 0;
    const durationSeconds = durationMinutes * 60;
    const remaining = Math.max(0, durationSeconds - displayElapsed);
    const timeDisplay = formatTime(remaining);

    // ---- Next blinds ----
    const nextBlindsDisplay = nextIsBreak
      ? ''
      : nextBlindLevelObj
        ? formatBlinds(nextBlindLevelObj)
        : '—';

    return {
      level: currentIsBreak || currentBlindNumber === null ? '—' : currentBlindNumber,
      time: timeDisplay,
      blinds: currentLevelObj ? blindsLabel(currentLevelObj) : '—',
      nextLevel: nextLevelObj ? (nextIsBreak ? 'Break' : (nextBlindNumber ?? '—')) : '—',
      nextBlinds: nextBlindsDisplay,
      isBreak: currentIsBreak,
      isNextBreak: nextIsBreak,
    };
  }, [tourState, levels, displayElapsed]);

  // -------------------------------------------------------
  // Loading state
  // -------------------------------------------------------
  if (loading) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography sx={{ fontSize: '3cqw', opacity: 0.7 }}>Loading…</Typography>
      </Box>
    );
  }

  // -------------------------------------------------------

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        pt: '1cqw',
      }}
    >
      <Stack spacing="1cqw" alignItems="center">
        {/* Current level */}
        <Typography
          sx={{
            textTransform: 'uppercase',
            fontSize: '5cqw',
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {clockData.isBreak ? 'Break' : `Level ${clockData.level}`}
        </Typography>

        {/* Timer */}
        <Typography
          sx={{
            fontWeight: 700,
            lineHeight: 0.9,
            fontSize: '21cqw',
            mb: '1cqw',
            width: '57cqw'
          }}
        >
          {clockData.time}
        </Typography>

        {/* Current blinds & ante – hidden on break */}
        {!clockData.isBreak && (
          <Box>
            <Typography
              sx={{
                textTransform: 'uppercase',
                fontSize: '4cqw',
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              Blinds &amp; Ante
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: '4cqw', lineHeight: 1.2 }}>
              {clockData.blinds}
            </Typography>
          </Box>
        )}

        {/* Next level */}
        <Box>
          <Typography
            sx={{
              textTransform: 'uppercase',
              opacity: 0.85,
              fontSize: '2.5cqw',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {clockData.isNextBreak ? 'Next break' : `Next Level ${clockData.nextLevel}`}
          </Typography>
          {clockData.nextBlinds ? (
            <Typography
              sx={{
                fontWeight: 700,
                opacity: 0.85,
                fontSize: '2.5cqw',
                lineHeight: 1.2,
              }}
            >
              {clockData.nextBlinds}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}
