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
import { computeEntryStats } from './tournament-clock-utils';

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
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreen = useBoolean();

  // ---- Nền Clock (lưu trên trình duyệt của máy này, theo từng tour) ----
  const { background, changeBackground } = useClockBackground(tournament?.id);
  const bgDialog = useBoolean();
  /** Gắn dialog vào khung Clock khi đang fullscreen (dialog gắn vào body sẽ bị che). */
  const [bgDialogContainer, setBgDialogContainer] = useState<HTMLElement | null>(null);

  const handleOpenBgDialog = useCallback(() => {
    const el = containerRef.current;
    setBgDialogContainer(el && document.fullscreenElement === el ? el : null);
    bgDialog.onTrue();
  }, [bgDialog]);

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

  // ---- Fullscreen handler ----
  const handleToggleFullscreen = useCallback(() => {
    if (!fullscreen.value) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      fullscreen.onTrue();
    } else {
      document.exitFullscreen?.().catch(() => {});
      fullscreen.onFalse();
    }
  }, [fullscreen]);

  return (
    <>
    <TournamentClockLayout
      ref={containerRef}
      fullscreen={fullscreen.value}
      backgroundImage={background.src}
      backgroundColor={background.color}
      topCenter={
        <Typography
          sx={{
            fontSize: '2.5cqw',
            fontWeight: 700,
            textTransform: 'uppercase',
            lineHeight: 1.1,
          }}
        >
          {tournament?.title ?? 'Tournament'}
        </Typography>
      }
      topRight={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '1.5cqw' }}>
          {/* Đổi nền Clock */}
          <Iconify
            icon="solar:gallery-wide-bold"
            onClick={handleOpenBgDialog}
            sx={{ cursor: 'pointer', fontSize: '3cqw' }}
          />
          <Iconify
            icon={fullscreen.value ? 'solar:quit-full-screen-bold' : 'solar:full-screen-bold'}
            onClick={handleToggleFullscreen}
            sx={{ cursor: 'pointer', fontSize: '3cqw' }}
          />
        </Box>
      }
      left={
        <TournamentClockInfo
          stats={entryStats}
          nextBreakIn={clockData?.nextBreakIn}
          regEndIn={clockData?.regEndIn}
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
        />
      }
      right={<TournamentClockPrize gtdPrize={gtdPrize} />}
    />

    <TournamentClockBgDialog
      open={bgDialog.value}
      onClose={bgDialog.onFalse}
      value={background.id}
      onChange={changeBackground}
      container={bgDialogContainer}
    />
    </>
  );
}
