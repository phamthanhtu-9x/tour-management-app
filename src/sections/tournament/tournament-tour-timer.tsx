import type { ITournamentItem } from 'src/types/tournament';
import type { TourControlData, TourLevelItemDto } from 'src/services/types';
import type { ITourState } from 'src/types/tour-socket';

import { useMemo, useState, useEffect, useRef } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { tourService } from 'src/services';

import {
  formatBlinds,
  findNextLevel,
  getBlindLevelNumber,
  getSecondsToNextBreak,
  getSecondsToRegEnd,
} from './tournament-clock-utils';

// ----------------------------------------------------------------------

type Props = {
  tournament?: ITournamentItem | null;
  control?: TourControlData | null;
  levels?: TourLevelItemDto[];
  levelsLoading?: boolean;
  /** Real-time tour state từ WebSocket (để hiển thị countdown). */
  tourState?: ITourState | null;
  /** WebSocket đã kết nối hay chưa. */
  wsConnected?: boolean;
  /** Tour ID – dùng để gọi trực tiếp API getTourControl khi tab quay lại. */
  tourId?: number;
};

// ----------------------------------------------------------------------

type TimerRow = {
  label: string;
  value: string;
};

/** Format giây → MM:SS (phút cũng pad 2 chữ số) */
function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** Format giây → HH:MM:SS */
function formatTimeLong(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ----------------------------------------------------------------------

export function TournamentTourTimer({
  tournament,
  control,
  levels = [],
  levelsLoading,
  tourState,
  wsConnected,
  tourId,
}: Props) {
  // ---- Client-side ticking timer (timestamp-based, chống drift khi tab background) ----
  const [displayElapsed, setDisplayElapsed] = useState<number>(tourState?.elapsedSeconds ?? 0);

  // Anchor elapsed: socket ưu tiên, fallback REST control.
  const serverElapsed = tourState?.elapsedSeconds;
  const restElapsed = control?.elapsedSeconds;
  const anchorElapsed: number | undefined = serverElapsed ?? restElapsed;

  const serverCurrentLevel = tourState?.currentLevel;
  const isPaused = tourState?.isPaused ?? true;

  // Mốc neo: elapsed của server + thời điểm (Date.now) nhận được mốc đó.
  const anchorRef = useRef<{ elapsed: number; at: number }>({
    elapsed: anchorElapsed ?? 0,
    at: Date.now(),
  });

  // Khi server/socket hoặc REST control gửi elapsed mới → reset mốc neo.
  useEffect(() => {
    if (anchorElapsed != null) {
      anchorRef.current = { elapsed: anchorElapsed, at: Date.now() };
      setDisplayElapsed(anchorElapsed);
    }
  }, [anchorElapsed, serverCurrentLevel]);

  // Khi component mount (vd: chuyển tab quay lại Control): gọi thẳng API lấy elapsed chuẩn từ server.
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

  // Tick mỗi giây: tính elapsed từ timestamp thực.
  useEffect(() => {
    if (isPaused) return undefined;

    // Re-anchor at thành Date.now() mỗi lần tick bắt đầu (sau pause/resume),
    // để không tính khoảng thời gian đã pause vào elapsed.
    anchorRef.current = { ...anchorRef.current, at: Date.now() };

    const tick = () => {
      const { elapsed, at } = anchorRef.current;
      setDisplayElapsed(elapsed + Math.floor((Date.now() - at) / 1000));
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Khi tab quay lại foreground → tính lại ngay + gọi thẳng API lấy elapsed chuẩn.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      if (!tourId) return;

      const { elapsed, at } = anchorRef.current;
      setDisplayElapsed(elapsed + Math.floor((Date.now() - at) / 1000));

      tourService.getTourControl(tourId).then((res: unknown) => {
        const data: TourControlData | null = (res as any)?.data ?? res;
        if (data?.elapsedSeconds != null) {
          anchorRef.current = { elapsed: data.elapsedSeconds, at: Date.now() };
          setDisplayElapsed(data.elapsedSeconds);
        }
      }).catch(() => {
        // Bỏ qua lỗi.
      });
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId]);

  // ---- Build rows ----
  const rows = useMemo<TimerRow[]>(() => {
    // ---- Compute current / next level info ----
    const currentLevelIdx = control?.currentLevel;
    const currentLevelObj = levels.find((l) => l.idx === currentLevelIdx);
    const nextLevelObj = currentLevelIdx ? findNextLevel(levels, currentLevelIdx) : null;

    const currentIsBreak = currentLevelObj?.type === 'BREAK';
    const nextIsBreak = nextLevelObj?.type === 'BREAK';

    const currentBlindNumber = currentLevelObj
      ? getBlindLevelNumber(currentLevelObj, levels)
      : null;
    const nextBlindNumber = nextLevelObj ? getBlindLevelNumber(nextLevelObj, levels) : null;

    const currentLabel = currentIsBreak
      ? 'Break'
      : currentBlindNumber != null
        ? `Level ${currentBlindNumber}`
        : '—';
    const nextLabel = nextLevelObj
      ? nextIsBreak
        ? 'Break'
        : nextBlindNumber != null
          ? `Level ${nextBlindNumber}`
          : '—'
      : '—';

    const currentBlindsStr =
      currentLevelObj && !currentIsBreak ? formatBlinds(currentLevelObj) : '';
    const nextBlindsStr = nextLevelObj && !nextIsBreak ? formatBlinds(nextLevelObj) : '';

    const currentLevelFull = currentBlindsStr
      ? `${currentLabel} - ${currentBlindsStr}`
      : currentLabel;
    const nextLevelFull = nextBlindsStr ? `${nextLabel} - ${nextBlindsStr}` : nextLabel;

    // ---- Duration / countdown ----
    const durationMinutes = currentLevelObj?.duration ?? 0;
    const durationSeconds = durationMinutes * 60;
    const remaining = Math.max(0, durationSeconds - displayElapsed);
    const durationDisplay = formatTime(remaining);
    const totalDisplay = formatTime(durationSeconds);

    // ---- Compute entries / chip stats ----
    const entries = control?.entries ?? [];
    const buyin = entries.length;
    const totalReBuys = entries.reduce((sum, e) => sum + (e.reBuyCount ?? 0), 0);
    const totalEntries = buyin + totalReBuys;
    const activeEntries = entries.filter((e) => !e.isEliminated).length;

    const entriesValue = `${activeEntries} / ${totalEntries}`;
    const rebuyBuyinValue = `${totalReBuys} / ${buyin}`;

    const chipsInPlay =
      totalEntries && tournament?.startingStack ? totalEntries * tournament.startingStack : null;

    const avgStack =
      chipsInPlay != null && activeEntries > 0
        ? Math.round(chipsInPlay / activeEntries).toLocaleString()
        : '—';

    const gtd = (control as any)?.gtd ?? '';

    // ---- Next break / Reg closed ----
    const nextBreakSeconds =
      currentLevelIdx != null
        ? getSecondsToNextBreak(levels, currentLevelIdx, displayElapsed)
        : null;
    const nextBreakIn =
      nextBreakSeconds != null ? formatTimeLong(nextBreakSeconds) : '—';

    const regEndSeconds =
      currentLevelIdx != null
        ? getSecondsToRegEnd(levels, currentLevelIdx, tournament?.regEnd, displayElapsed)
        : null;
    const regEndIn =
      regEndSeconds != null ? formatTimeLong(regEndSeconds) : '—';

    return [
      { label: 'Current Level', value: currentLevelFull },
      { label: 'Next Level', value: nextLevelFull },
      { label: `Remaining (total ${totalDisplay})`, value: durationDisplay },
      { label: 'Entries', value: entriesValue },
      { label: 'Re-buy / Buy-in', value: rebuyBuyinValue },
      { label: 'Chips in play', value: chipsInPlay != null ? chipsInPlay.toLocaleString() : '—' },
      { label: 'Average Stack', value: avgStack },
      { label: 'Next break', value: nextBreakIn },
      { label: 'Reg closed', value: regEndIn },
      { label: 'GTD', value: gtd || '—' },
    ];
  }, [control, levels, tournament, displayElapsed]);

  if (levelsLoading) {
    return (
      <Card sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      </Card>
    );
  }

  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
        Tour Timer {wsConnected ? '🟢' : '🔴'}
      </Typography>

      <Stack spacing={1.5}>
        {rows.map((row) => (
          <Box
            key={row.label}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', fontWeight: 500, flexShrink: 0 }}
            >
              {row.label}
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, textAlign: 'right', wordBreak: 'break-word' }}
            >
              {row.value}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Card>
  );
}
