import type { ITournamentItem } from 'src/types/tournament';

import { useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { tourService } from 'src/services';
import { useGetTourLevels } from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

type Props = {
  id: number;
  tournament?: ITournamentItem | null;
  tournamentMutate: () => void;
  tournamentLoading?: boolean;
};

// ----------------------------------------------------------------------

export function TournamentDetailsControl({ id, tournament, tournamentMutate, tournamentLoading }: Props) {
  const { levels, levelsLoading } = useGetTourLevels(id);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const levelOptions = useMemo(
    () =>
      levels
        .filter((l) => l.type !== 'BREAK')
        .map((l) => ({
          value: l.idx,
          label: `Level ${l.idx}${l.name ? ` — ${l.name}` : ''} (${l.type})`,
        })),
    [levels]
  );

  const currentRegEnd = tournament?.regEnd ?? null;

  const handleUpdateRegEnd = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const newRegEnd = raw === '' || raw === undefined ? null : Number(raw);

      setIsSubmitting(true);
      try {
        await tourService.updateTour(id, { regEnd: newRegEnd ?? undefined });
        tournamentMutate();
        toast.success('Reg end updated!');
      } catch (error) {
        console.error(error);
        toast.error('Update failed!');
      } finally {
        setIsSubmitting(false);
      }
    },
    [id, tournamentMutate]
  );

  if (tournamentLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card sx={{ p: 3 }}>
        {levelsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : levels.length === 0 ? (
          <EmptyContent title="No levels" description="Add levels in the Blind tab first." />
        ) : (
          <TextField
            select
            fullWidth
            label="Registration End Level (regEnd)"
            value={currentRegEnd ?? ''}
            onChange={handleUpdateRegEnd}
            disabled={isSubmitting}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {levelOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Card>
    </Box>
  );
}
