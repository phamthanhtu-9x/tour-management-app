import type { ITournamentItem } from 'src/types/tournament';
import type { TourLevelItemDto } from 'src/services/types';
import type { ITourState, ITourLevelsPayload } from 'src/types/tour-socket';

import { useMemo, useEffect, useCallback, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import { useGetTourControl, useGetTourLevels } from 'src/actions/tournament';

import { Iconify } from 'src/components/iconify';

import { TournamentClockInfo } from './tournament-clock-info';
import { TournamentClockPrize } from './tournament-clock-prize';
import type { CountdownTimerData } from './tournament-countdown-timer';
import { TournamentCountdownTimer } from './tournament-countdown-timer';
import { TournamentClockLayout } from './tournament-clock-layout';
import { TournamentClockBgDialog } from './tournament-clock-bg-dialog';
import { useClockBackground } from './tournament-clock-backgrounds';
import { clockSize, computeEntryStats } from './tournament-clock-utils';
import { useFullscreenControls } from './use-fullscreen-controls';

// ----------------------------------------------------------------------

/** Chu kỳ gọi lại REST control khi mất WebSocket (ms). */
const CONTROL_POLL_MS = 5000;

// ----------------------------------------------------------------------

type Props = {
  tournament?: ITournamentItem | null;
  loading?: boolean;
  /** Real-time state từ WebSocket. */
  tourState?: ITourState | null;
  /** Real-time levels từ WebSocket. */
  tourLevels?: ITourLevelsPayload | null;
  /** WebSocket đã kết nối hay chưa. */
  wsConnected?: boolean;
  /**
   * Mini clock (tab Control trên mobile): cùng bố cục Clock nhưng chữ có cỡ tối thiểu,
   * không có nút đổi nền / fullscreen (nền dùng chung với tab Clock trên máy này).
   */
  compact?: boolean;
};

// ----------------------------------------------------------------------

/** Parse GTD "10/5/3/3/1" → { total, ranks } */
function parseGtd(gtd?: string | null): { total: number; ranks: number[] } | undefined {
  if (!gtd || gtd === '0' || gtd === '0/0') return undefined;
  const parts = gtd.split('/').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n) && n > 0);
  if (parts.length === 0) return undefined;
  return {
    total: parts.reduce((sum, n) => sum + n, 0),
    ranks: parts,
  };
}

// ----------------------------------------------------------------------

export function TournamentDetailsClock({
  tournament,
  loading,
  tourState,
  tourLevels,
  wsConnected,
  compact,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreen = useBoolean();

  // ---- Nền Clock (lưu trên trình duyệt của máy này, theo từng tour) ----
  const { background, changeBackground } = useClockBackground(tournament?.id);
  const bgDialog = useBoolean();

  const [clockData, setClockData] = useState<CountdownTimerData | null>(null);

  const { control: restControl, controlMutate } = useGetTourControl(tournament?.id, {
    refreshInterval: wsConnected ? 0 : CONTROL_POLL_MS,
  });

  // Socket vừa rớt → lấy lại REST control ngay thay vì chờ chu kỳ polling.
  useEffect(() => {
    if (!wsConnected) controlMutate();
  }, [wsConnected, controlMutate]);
  const { levels: restLevels } = useGetTourLevels(tournament?.id);

  // ---- Merge socket data với REST data: socket ưu tiên khi connected ----
  const control = useMemo(() => {
    if (wsConnected && tourState) {
      return {
        currentLevel: tourState.currentLevel,
        entries: tourState.entries.map((e) => ({
          id: e.id,
          playerId: e.playerId,
          name: e.name,
          avatar: e.avatar,
          isEliminated: e.isEliminated,
          reBuyCount: e.reBuyCount,
          addOn: e.addOn ?? [],
        })),
        gtd: tourState.gtd,
        regEnd: tourState.regEnd,
        isRegOpen: tourState.isRegOpen,
      };
    }
    return restControl;
  }, [wsConnected, tourState, restControl]);

  const levels: TourLevelItemDto[] = useMemo(() => {
    if (wsConnected && tourLevels) {
      return tourLevels.levels.map((l) => ({
        name: l.name ?? undefined,
        type: l.type,
        idx: l.idx,
        duration: l.duration,
        smallBlind: l.smallBlind ?? undefined,
        bigBlind: l.bigBlind ?? undefined,
        ante: l.ante ?? undefined,
      })) as TourLevelItemDto[];
    }
    return restLevels;
  }, [wsConnected, tourLevels, restLevels]);

  // ---- Derived stats cho ClockInfo ----
  const entryStats = useMemo(
    () => computeEntryStats(control?.entries, tournament?.startingStack),
    [control?.entries, tournament?.startingStack]
  );

  // ---- GTD prize ----
  const gtdPrize = parseGtd(control?.gtd);

  // ---- Fullscreen ----
  // Chỉ có nút vào fullscreen; thoát bằng phím Esc (hoặc thao tác thoát của trình duyệt).
  // Trạng thái lấy theo sự kiện fullscreenchange để luôn khớp với trình duyệt.
  const { setValue: setFullscreen } = fullscreen;

  useEffect(() => {
    const handleChange = () => {
      const el = containerRef.current;
      setFullscreen(!!el && document.fullscreenElement === el);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, [setFullscreen]);

  const handleEnterFullscreen = useCallback(() => {
    containerRef.current?.requestFullscreen?.().catch(() => {});
  }, []);

  const handleExitFullscreen = useCallback(() => {
    document.exitFullscreen?.().catch(() => {});
  }, []);

  // Nút thoát chỉ hiện khi có tương tác (cho Smart TV / tablet không có phím Esc)
  const exitButtonRef = useRef<SVGElement>(null);
  const exitVisible = useFullscreenControls(fullscreen.value, containerRef, exitButtonRef);

  return (
    <>
    <TournamentClockLayout
      ref={containerRef}
      fullscreen={fullscreen.value}
      compact={compact}
      backgroundImage={background.src}
      backgroundColor={background.color}
      topCenter={
        <Typography
          sx={{
            fontSize: clockSize(2.5, 13, compact),
            fontWeight: 700,
            textTransform: 'uppercase',
            lineHeight: 1.1,
          }}
        >
          {tournament?.title ?? 'Tournament'}
        </Typography>
      }
      topRight={
        compact ? (
          // Mini clock: chỉ hiện chấm trạng thái kết nối realtime
          <Box
            component="span"
            title={wsConnected ? 'Realtime connected' : 'Realtime disconnected'}
            aria-label={wsConnected ? 'Realtime connected' : 'Realtime disconnected'}
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: wsConnected ? '#22C55E' : '#FF5630',
            }}
          />
        ) : // Fullscreen: ẩn nút nền / fullscreen, chỉ hiện nút thoát khi có tương tác
        fullscreen.value ? (
          <Iconify
            ref={exitButtonRef}
            icon="solar:quit-full-screen-bold"
            onClick={handleExitFullscreen}
            onKeyDown={(event) => {
              // Remote TV: chọn bằng phím mũi tên rồi bấm OK/Enter
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleExitFullscreen();
              }
            }}
            role="button"
            aria-label="Thoát toàn màn hình"
            tabIndex={exitVisible ? 0 : -1}
            aria-hidden={!exitVisible}
            sx={{
              cursor: 'pointer',
              fontSize: '3cqw',
              borderRadius: 0.5,
              '&:focus-visible': { outline: '3px solid #fff', outlineOffset: 4 },
              opacity: exitVisible ? 1 : 0,
              visibility: exitVisible ? 'visible' : 'hidden',
              transition: 'opacity 0.3s ease, visibility 0.3s ease',
            }}
          />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '1.5cqw' }}>
            {/* Đổi nền Clock */}
            <Iconify
              icon="solar:gallery-wide-bold"
              onClick={bgDialog.onTrue}
              sx={{ cursor: 'pointer', fontSize: '3cqw' }}
            />
            <Iconify
              icon="solar:full-screen-bold"
              onClick={handleEnterFullscreen}
              sx={{ cursor: 'pointer', fontSize: '3cqw' }}
            />
          </Box>
        )
      }
      left={
        <TournamentClockInfo
          stats={entryStats}
          nextBreakIn={clockData?.nextBreakIn}
          regEndIn={clockData?.regEndIn}
          compact={compact}
        />
      }
      center={
        <TournamentCountdownTimer
          tourState={tourState}
          levels={levels}
          restControl={restControl}
          tourId={tournament?.id}
          onDataChange={setClockData}
          regEndIdx={control?.regEnd !== undefined ? control.regEnd : tournament?.regEnd}
          isRegOpen={control?.isRegOpen}
          compact={compact}
        />
      }
      right={<TournamentClockPrize gtdPrize={gtdPrize} compact={compact} />}
    />

    {!compact && (
    <TournamentClockBgDialog
      open={bgDialog.value}
      onClose={bgDialog.onFalse}
      value={background.id}
      onChange={changeBackground}
    />
    )}
    </>
  );
}
