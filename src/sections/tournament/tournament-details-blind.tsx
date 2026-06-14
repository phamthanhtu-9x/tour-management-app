import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useGetTourLevels } from 'src/actions/tournament';

import { TournamentBlindEditForm } from './tournament-blind-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: number;
};

export function TournamentDetailsBlind({ id }: Props) {
  const { levels, levelsLoading, levelsMutate } = useGetTourLevels(id);

  if (levelsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <TournamentBlindEditForm
      tourId={id}
      currentLevels={levels}
      onSaved={() => levelsMutate()}
    />
  );
}
