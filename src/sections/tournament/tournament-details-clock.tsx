import type { ITournamentItem } from 'src/types/tournament';
import type { TourLevelItemDto } from 'src/services/types';
import type { ITourState, ITourLevelsPayload } from 'src/types/tour-socket';

import { useMemo, useCallback, useRef, useState } from 'react';

import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import { useGetTourControl, useGetTourLevels } from 'src/actions/tournament';

import { Iconify } from 'src/components/iconify';

import { TournamentClockInfo } from './tournament-clock-info';
import { TournamentClockPrize } from './tournament-clock-prize';
import type { CountdownTimerData } from './tournament-countdown-timer';
import { TournamentCountdownTimer } from './tournament-countdown-timer';
import { TournamentClockLayout } from './tournament-clock-layout';

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

  const [clockData, setClockData] = useState<CountdownTimerData | null>(null);

  const { control: restControl } = useGetTourControl(tournament?.id);
  const { levels: restLevels } = useGetTourLevels(tournament?.id);

  // ---- Merge socket data với REST data: socket ưu tiên khi connected ----
  const control = useMemo(() => {
    if (wsConnected && tourState) {
      return {
        currentLevel: tourState.currentLevel,
        entries: tourState.entries.map((e) => ({
          name: e.name,
          avatar: e.avatar,
          isEliminated: e.isEliminated,
          reBuyCount: e.reBuyCount,
        })),
        gtd: tourState.gtd,
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
  const entries = control?.entries ?? [];
  const buyin = entries.length;
  const totalReBuys = entries.reduce((sum, e) => sum + (e.reBuyCount ?? 0), 0);
  const totalEntries = buyin + totalReBuys;
  const activeEntries = entries.filter((e) => !e.isEliminated).length;

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
    <TournamentClockLayout
      fullscreen={fullscreen.value}
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
        <Iconify
          icon={fullscreen.value ? 'solar:quit-full-screen-bold' : 'solar:full-screen-bold'}
          onClick={handleToggleFullscreen}
          sx={{ cursor: 'pointer', fontSize: '3cqw' }}
        />
      }
      left={
        <TournamentClockInfo
          tournament={tournament}
          activeEntries={activeEntries}
          totalEntries={totalEntries}
          totalBuyin={buyin}
          totalReBuys={totalReBuys}
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
          regEndIdx={tournament?.regEnd}
        />
      }
      right={<TournamentClockPrize gtdPrize={gtdPrize} />}
    />
  );
}
