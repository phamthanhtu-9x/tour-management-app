import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export type ClockTimerData = {
  level: number | string;
  time: string;
  blinds: string;
  nextLevel: number | string;
  nextBlinds: string;
  /** Hiện tại đang là level BREAK */
  isBreak?: boolean;
  /** Level kế tiếp là BREAK */
  isNextBreak?: boolean;
};

type Props = {
  data?: ClockTimerData;
};

const fallback: ClockTimerData = {
  level: '—',
  time: '—:—',
  blinds: '—',
  nextLevel: '—',
  nextBlinds: '—',
};

export function TournamentClockTimer({ data }: Props) {
  const clock = data ?? fallback;

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
          {clock.isBreak ? 'Break' : `Level ${clock.level}`}
        </Typography>

        {/* Timer */}
        <Typography sx={{ fontWeight: 700, lineHeight: 0.9, fontSize: '22cqw', mb: '1cqw' }}>
          {clock.time}
        </Typography>

        {/* Current blinds & ante – hidden on break */}
        {!clock.isBreak && (
          <Box>
            <Typography sx={{ textTransform: 'uppercase', fontSize: '4cqw', fontWeight: 700, lineHeight: 1.2 }}>
              Blinds &amp; Ante
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: '4cqw', lineHeight: 1.2 }}>
              {clock.blinds}
            </Typography>
          </Box>
        )}

        {/* Next level – ẩn khi không còn level kế tiếp */}
        {clock.nextLevel !== '—' && (
          <Box>
            <Typography sx={{ textTransform: 'uppercase', opacity: 0.85, fontSize: '2.5cqw', fontWeight: 700, lineHeight: 1.2 }}>
              {clock.isNextBreak ? 'Next break' : `Next Level ${clock.nextLevel}`}
            </Typography>
            {clock.nextBlinds ? (
              <Typography sx={{ fontWeight: 700, opacity: 0.85, fontSize: '2.5cqw', lineHeight: 1.2 }}>
                {clock.nextBlinds}
              </Typography>
            ) : null}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
