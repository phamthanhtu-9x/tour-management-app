import type { ITournamentItem } from 'src/types/tournament';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

type Props = {
  tournament?: ITournamentItem | null;
};

export function TournamentClockInfo({ tournament: _tournament }: Props) {
  const rows = [
    { label: 'Entries', value: '18 / 40' },
    { label: 'Re-buy / Buy-in', value: '10 / 20' },
    { label: 'Chips in play', value: '40,000' },
    { label: 'Average Stack', value: '30,000' },
    { label: 'Next break', value: '00:10:47' },
    { label: 'Reg closed', value: '00:00:00' },
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
