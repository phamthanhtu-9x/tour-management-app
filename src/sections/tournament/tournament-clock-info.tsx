import type { ITournamentItem } from 'src/types/tournament';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

type Props = {
  tournament?: ITournamentItem | null;
  activeEntries?: number;
  totalEntries?: number;
  totalBuyin?: number;
  totalReBuys?: number;
  nextBreakIn?: string | null;
  regEndIn?: string | null;
};

export function TournamentClockInfo({
  tournament,
  activeEntries,
  totalEntries,
  totalBuyin,
  totalReBuys,
  nextBreakIn,
  regEndIn,
}: Props) {
  const entriesValue =
    activeEntries != null && totalEntries != null ? `${activeEntries} / ${totalEntries}` : '—';

  const chipsInPlay =
    totalEntries != null && tournament?.startingStack != null
      ? totalEntries * tournament.startingStack
      : null;

  const avgStack =
    chipsInPlay != null && activeEntries != null && activeEntries > 0
      ? Math.round(chipsInPlay / activeEntries).toLocaleString()
      : '—';

  const rows = [
    { label: 'Entries', value: entriesValue },
    {
      label: 'Re-buy / Buy-in',
      value: `${totalReBuys ?? 0} / ${totalBuyin ?? 0}`,
    },
    { label: 'Chips in play', value: chipsInPlay != null ? chipsInPlay.toLocaleString() : '—' },
    { label: 'Average Stack', value: avgStack },
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
            sx={{ fontSize: '2cqw', fontWeight: 700, lineHeight: 1.2 }}
          >
            {row.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
