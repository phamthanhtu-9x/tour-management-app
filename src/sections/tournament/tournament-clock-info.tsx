import type { TourEntryStats } from './tournament-clock-utils';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { formatChips } from './tournament-clock-utils';

// ----------------------------------------------------------------------

type Props = {
  /** Thống kê entries / chip, tính bằng `computeEntryStats`. */
  stats?: TourEntryStats | null;
  nextBreakIn?: string | null;
  regEndIn?: string | null;
};

export function TournamentClockInfo({ stats, nextBreakIn, regEndIn }: Props) {
  const entriesValue = stats ? `${stats.activeEntries} / ${stats.totalEntries}` : '—';

  const rows = [
    { label: 'Entries', value: entriesValue },
    {
      label: 'Re-buy / Buy-in',
      value: `${stats?.totalReBuys ?? 0} / ${stats?.buyin ?? 0}`,
    },
    { label: 'Chips in play', value: formatChips(stats?.chipsInPlay) },
    { label: 'Average Stack', value: formatChips(stats?.avgStack) },
    { label: 'Next break', value: nextBreakIn || '—' },
    { label: 'Reg closed', value: regEndIn || '—' },
  ];

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'center',
        gap: '2.5cqw',
        py: '3cqw',
      }}
    >
      {rows.map((row) => (
        <Box key={row.label}>
          <Typography
            sx={{ fontSize: '2cqw', fontWeight: 700, lineHeight: 1.2, textTransform: 'uppercase' }}
          >
            {row.label}
          </Typography>
          <Typography
            sx={{ fontSize: '2cqw', fontWeight: 700, lineHeight: 1.2,
              fontVariantNumeric: 'tabular-nums',
             }}
          >
            {row.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
