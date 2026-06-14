import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';

// ----------------------------------------------------------------------

type Props = {
  gtdPrize?: { total: number; ranks: number[] };
};

// ----------------------------------------------------------------------

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export function TournamentClockPrize({ gtdPrize }: Props) {
  const prizes = useMemo(() => {
    const { total, ranks } = gtdPrize ?? { total: 0, ranks: [] };

    if (ranks.length === 0) return [{ label: 'GTD', value: '—' }];

    const grouped: { label: string; value: string }[] = [
      { label: 'GTD', value: total.toLocaleString() },
    ];

    let i = 0;
    while (i < ranks.length) {
      const currentValue = ranks[i];
      const groupLabels: string[] = [];

      while (i < ranks.length && ranks[i] === currentValue) {
        groupLabels.push(ROMAN[i] ?? `${i + 1}`);
        i++;
      }

      const label =
        groupLabels.length >= 3
          ? `${groupLabels[0]} ... ${groupLabels[groupLabels.length - 1]}`
          : groupLabels.join(', ');

      grouped.push({
        label,
        value: currentValue.toLocaleString(),
      });
    }

    return grouped;
  }, [gtdPrize]);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        px: 2,
        pt: '3cqw',
      }}
    >
      <TableContainer>
        <Table size="small">
          <TableBody>
            {prizes.map((prize, index) => (
              <TableRow key={prize.label}>
                <TableCell
                  sx={{
                    borderBottom: 'none',
                    py: 1,
                    textAlign: 'center',
                    color: '#fff',
                  }}
                >
                  <Typography sx={{ fontSize: '2cqw', fontWeight: index === 0 ? 700 : 600, lineHeight: 1.2 }}>
                    {prize.label}
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{
                    borderBottom: 'none',
                    py: index === 0 ? 0.75 : 0.5,
                    textAlign: 'right',
                    color: '#fff',
                  }}
                >
                  <Typography sx={{ fontSize: '2cqw', fontWeight: index === 0 ? 700 : 600, lineHeight: 1.2 }}>
                    {prize.value}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
