import type { ITournamentItem } from 'src/types/tournament';
import type { TourLevelItemDto } from 'src/services/types';

import { useCallback, useRef, useMemo } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import { useGetTourControl, useGetTourLevels } from 'src/actions/tournament';

import { Iconify } from 'src/components/iconify';

import { TournamentClockInfo } from './tournament-clock-info';
import { TournamentClockPrize } from './tournament-clock-prize';
import { TournamentClockTimer } from './tournament-clock-timer';
import { TournamentClockLayout } from './tournament-clock-layout';
import {
  formatBlinds,
  findNextBlindLevel,
  findNextLevel,
  getBlindLevelNumber,
  blindsLabel,
} from './tournament-clock-utils';
import type { ClockTimerData } from './tournament-clock-timer';

// ----------------------------------------------------------------------

type Props = {
  tournament?: ITournamentItem | null;
  loading?: boolean;
};

// ----------------------------------------------------------------------

export function TournamentDetailsClock({ tournament }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreen = useBoolean();

  const { control } = useGetTourControl(tournament?.id);
  const { levels } = useGetTourLevels(tournament?.id);

  const { activeEntries, totalBuyin, totalReBuys, totalEntries, gtdPrize, clockData } = useMemo(() => {
    const entries = control?.entries ?? [];
    const buyin = entries.length;
    const reBuys = entries.reduce((sum, e) => sum + (e.reBuyCount ?? 0), 0);

    // GTD
    const rawGtd: string = control?.gtd ?? '';
    const gtdNumbers = rawGtd
      .split('/')
      .map((s: string) => Number(s.trim()))
      .filter((n: number) => !Number.isNaN(n) && n > 0);
    const gtdTotal = gtdNumbers.reduce((sum: number, n: number) => sum + n, 0);

    // ---- Build clock data from control + levels ----
    const currentLevelIdx = control?.currentLevel;
    const currentLevelObj = levels.find((l) => l.idx === currentLevelIdx);
    const nextBlindLevelObj = currentLevelIdx ? findNextBlindLevel(levels, currentLevelIdx) : null;
    const nextLevelObj = currentLevelIdx ? findNextLevel(levels, currentLevelIdx) : null;

    const currentIsBreak = currentLevelObj?.type === 'BREAK';

    const currentBlindNumber = currentLevelObj ? getBlindLevelNumber(currentLevelObj, levels) : null;
    const nextBlindNumber = nextLevelObj ? getBlindLevelNumber(nextLevelObj, levels) : null;
    const nextIsBreak = nextLevelObj?.type === 'BREAK';

    const builtClock: ClockTimerData = {
      level: currentIsBreak || currentBlindNumber === null ? '—' : currentBlindNumber,
      time: '10:00', // placeholder – countdown nằm ngoài scope lần này
      blinds: currentLevelObj ? blindsLabel(currentLevelObj) : '—',
      nextLevel: nextLevelObj
        ? nextIsBreak
          ? 'Break'
          : nextBlindNumber ?? '—'
        : '—',
      nextBlinds: nextIsBreak ? '' : (nextBlindLevelObj ? formatBlinds(nextBlindLevelObj) : '—'),
      isBreak: currentIsBreak,
      isNextBreak: nextIsBreak,
    };

    return {
      activeEntries: entries.filter((e) => !e.isEliminated).length,
      totalBuyin: buyin,
      totalReBuys: reBuys,
      totalEntries: buyin + reBuys,
      gtdPrize: { total: gtdTotal, ranks: gtdNumbers },
      clockData: builtClock,
    };
  }, [control, levels]);

  const handleToggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      fullscreen.onFalse();
    } else if (containerRef.current) {
      await containerRef.current.requestFullscreen();
      fullscreen.onTrue();
    }
  }, [fullscreen]);

  const renderTopCenter = (
    <Box>
      <Typography sx={{ textTransform: 'uppercase', fontSize: '2.5cqw', fontWeight: 700, lineHeight: 1.2 }}>
        {tournament?.title || '—'}
      </Typography>
    </Box>
  );

  const renderTopRight = (
    <IconButton onClick={handleToggleFullscreen} sx={{ color: '#fff' }}>
      <Iconify
        icon={'solar:full-screen-linear'}
        width={24}
      />
    </IconButton>
  );

  return (
    <Box
      ref={containerRef}
      sx={{
        ...(fullscreen.value && { height: '100%' }),
      }}
    >
      <TournamentClockLayout
        topCenter={renderTopCenter}
        topRight={renderTopRight}
        left={<TournamentClockInfo tournament={tournament} activeEntries={activeEntries} totalEntries={totalEntries} totalBuyin={totalBuyin} totalReBuys={totalReBuys} />}
        center={<TournamentClockTimer data={clockData} />}
        right={<TournamentClockPrize gtdPrize={gtdPrize} />}
        fullscreen={fullscreen.value}
      />
    </Box>
  );
}
