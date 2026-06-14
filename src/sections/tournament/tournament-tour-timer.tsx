import type { ITournamentItem } from 'src/types/tournament';
import type { TourControlData, TourLevelItemDto } from 'src/services/types';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import {
  formatBlinds,
  findNextLevel,
  getBlindLevelNumber,
} from './tournament-clock-utils';

// ----------------------------------------------------------------------

type Props = {
  tournament?: ITournamentItem | null;
  control?: TourControlData | null;
  levels?: TourLevelItemDto[];
  levelsLoading?: boolean;
};

// ----------------------------------------------------------------------

type TimerRow = {
  label: string;
  value: string;
};

export function TournamentTourTimer({ tournament, control, levels = [], levelsLoading }: Props) {
  const rows = useMemo<TimerRow[]>(() => {
    // ---- Compute current / next level info ----
    const currentLevelIdx = control?.currentLevel;
    const currentLevelObj = levels.find((l) => l.idx === currentLevelIdx);
    const nextLevelObj = currentLevelIdx ? findNextLevel(levels, currentLevelIdx) : null;

    const currentIsBreak = currentLevelObj?.type === 'BREAK';
    const nextIsBreak = nextLevelObj?.type === 'BREAK';

    const currentBlindNumber = currentLevelObj ? getBlindLevelNumber(currentLevelObj, levels) : null;
    const nextBlindNumber = nextLevelObj ? getBlindLevelNumber(nextLevelObj, levels) : null;

    const currentLabel = currentIsBreak ? 'Break' : currentBlindNumber != null ? `Level ${currentBlindNumber}` : '—';
    const nextLabel = nextLevelObj
      ? nextIsBreak
        ? 'Break'
        : nextBlindNumber != null
          ? `Level ${nextBlindNumber}`
          : '—'
      : '—';

    const currentBlindsStr = currentLevelObj && !currentIsBreak ? formatBlinds(currentLevelObj) : '';
    const nextBlindsStr = nextLevelObj && !nextIsBreak ? formatBlinds(nextLevelObj) : '';

    const currentLevelFull = currentBlindsStr ? `${currentLabel} - ${currentBlindsStr}` : currentLabel;
    const nextLevelFull = nextBlindsStr ? `${nextLabel} - ${nextBlindsStr}` : nextLabel;

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

    return [
      { label: 'Current Level', value: currentLevelFull },
      { label: 'Next Level', value: nextLevelFull },
      { label: 'Duration', value: '10:00' },
      { label: 'Entries', value: entriesValue },
      { label: 'Re-buy / Buy-in', value: rebuyBuyinValue },
      { label: 'Chips in play', value: chipsInPlay != null ? chipsInPlay.toLocaleString() : '—' },
      { label: 'Average Stack', value: avgStack },
      { label: 'GTD', value: gtd || '—' },
    ];
  }, [control, levels, tournament]);

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
        Tour Timer
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
