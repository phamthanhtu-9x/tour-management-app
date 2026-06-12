import type { ITournamentItem } from 'src/types/tournament';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

import { fDate } from 'src/utils/format-time';
import { fShortenNumber } from 'src/utils/format-number';

// ----------------------------------------------------------------------

type Props = {
  tournament: ITournamentItem;
  onClick: (tournament: ITournamentItem) => void;
};

export function TournamentCard({ tournament, onClick }: Props) {
  const { title, desc, startingStack, createdAt } = tournament;

  return (
    <Card>
      <CardActionArea onClick={() => onClick(tournament)}>
        <CardContent sx={{ pb: 1 }}>
          <Typography variant="subtitle1" noWrap>
            {title || '—'}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 1,
              color: 'text.secondary',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: 36,
            }}
          >
            {desc || 'No description'}
          </Typography>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {fDate(createdAt) ?? '—'}
            </Typography>

            {startingStack != null && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {fShortenNumber(startingStack)} chips
              </Typography>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
