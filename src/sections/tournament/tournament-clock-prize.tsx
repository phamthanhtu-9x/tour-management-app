import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';

// ----------------------------------------------------------------------

const prizes = [
  { label: 'GTD', value: '10' },
  { label: 'I', value: '1' },
  { label: 'II', value: '1' },
  { label: 'III', value: '1' },
  { label: 'IV', value: '1' },
  { label: 'V', value: '1' },
  { label: 'VI', value: '1' },
  { label: 'VII', value: '1' },
  { label: 'VIII', value: '1' },
  { label: 'IX', value: '1' },
];

export function TournamentClockPrize() {
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
