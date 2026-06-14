import type { ITournamentItem } from 'src/types/tournament';

import { useCallback, useRef, useMemo } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import { useGetTourControl } from 'src/actions/tournament';

import { Iconify } from 'src/components/iconify';

import { TournamentClockInfo } from './tournament-clock-info';
import { TournamentClockPrize } from './tournament-clock-prize';
import { TournamentClockTimer } from './tournament-clock-timer';
import { TournamentClockLayout } from './tournament-clock-layout';

// ----------------------------------------------------------------------

type Props = {
  tournament?: ITournamentItem | null;
  loading?: boolean;
};

export function TournamentDetailsClock({ tournament }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreen = useBoolean();

  const { control } = useGetTourControl(tournament?.id);

  const { activeEntries, totalBuyin, totalReBuys, totalEntries } = useMemo(() => {
    const entries = control?.entries ?? [];
    const buyin = entries.length;
    const reBuys = entries.reduce((sum, e) => sum + (e.reBuyCount ?? 0), 0);
    return {
      activeEntries: entries.filter((e) => !e.isEliminated).length,
      totalBuyin: buyin,
      totalReBuys: reBuys,
      totalEntries: buyin + reBuys,
    };
  }, [control?.entries]);

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
        center={<TournamentClockTimer />}
        right={<TournamentClockPrize />}
        fullscreen={fullscreen.value}
      />
    </Box>
  );
}
