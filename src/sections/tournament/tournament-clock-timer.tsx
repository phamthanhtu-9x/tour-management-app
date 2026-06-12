import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

const clock = {
  level: 10,
  time: '10:00',
  blinds: '4000/8000/8000',
  nextLevel: 11,
  nextBlinds: '4000/8000/8000',
};

export function TournamentClockTimer() {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        pt: '1cqw',
      }}
    >
      <Stack spacing="1cqw" alignItems="center">
        {/* Current level */}
        <Typography sx={{ textTransform: 'uppercase', fontSize: '5cqw', fontWeight: 700, lineHeight: 1.1 }}>
          Level {clock.level}
        </Typography>

        {/* Timer */}
        <Typography sx={{ fontWeight: 700, lineHeight: 0.9, fontSize: '22cqw', mb: '1cqw' }}>
          {clock.time}
        </Typography>

        {/* Current blinds & ante */}
        <Box>
          <Typography sx={{ textTransform: 'uppercase', fontSize: '4cqw', fontWeight: 700, lineHeight: 1.2 }}>
            Blinds &amp; Ante
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '4cqw', lineHeight: 1.2 }}>
            {clock.blinds}
          </Typography>
        </Box>

        {/* Next level */}
        <Box>
          <Typography sx={{ textTransform: 'uppercase', opacity: 0.85, fontSize: '2.5cqw', fontWeight: 700, lineHeight: 1.2 }}>
            Next Level {clock.nextLevel}
          </Typography>
          <Typography sx={{ fontWeight: 700, opacity: 0.85, fontSize: '2.5cqw', lineHeight: 1.2 }}>
            {clock.nextBlinds}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
