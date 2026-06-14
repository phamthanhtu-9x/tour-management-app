import type { TourLevelItemDto } from 'src/services/types';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import LoadingButton from '@mui/lab/LoadingButton';

import { toast } from 'src/components/snackbar';
import { Form } from 'src/components/hook-form';

import { tourService } from 'src/services';

import { LevelsEditor, BlindLevelsSchema } from '../_blind/blind-levels-editor';

import type { BlindLevelsSchemaType } from '../_blind/blind-levels-editor';

// ----------------------------------------------------------------------

export { BlindLevelsSchema };

export const TournamentBlindSchema = BlindLevelsSchema;

export type TournamentBlindSchemaType = BlindLevelsSchemaType;

// ----------------------------------------------------------------------

type Props = {
  tourId: number;
  currentLevels?: TourLevelItemDto[];
  onSaved: () => void;
};

export function TournamentBlindEditForm({ tourId, currentLevels, onSaved }: Props) {
  const defaultValues = useMemo(() => {
    if (currentLevels?.length) {
      return {
        levels: currentLevels.map((l) => ({
          type: l.type,
          name: l.name ?? '',
          duration: l.duration,
          smallBlind: l.smallBlind,
          bigBlind: l.bigBlind,
          ante: l.ante,
        })),
      };
    }

    return {
      levels: [
        { type: 'BLIND' as const, name: '', duration: 15, smallBlind: 25, bigBlind: 50, ante: 0 },
      ],
    };
  }, [currentLevels]);

  const methods = useForm<TournamentBlindSchemaType>({
    resolver: zodResolver(TournamentBlindSchema),
    defaultValues,
  });

  const { reset, handleSubmit, formState: { isSubmitting } } = methods;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const levels: TourLevelItemDto[] = data.levels.map((item, i) => {
        const level: TourLevelItemDto = {
          type: item.type,
          idx: i + 1,
          duration: item.duration,
        };
        if (item.type === 'BLIND') {
          level.name = item.name;
          level.smallBlind = item.smallBlind ?? 0;
          level.bigBlind = item.bigBlind ?? 0;
          level.ante = item.ante ?? 0;
        } else if (item.name) {
          level.name = item.name;
        }
        return level;
      });

      await tourService.updateTour(tourId, { levels });
      toast.success('Blind updated!');
      onSaved();
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong!');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <LevelsEditor />

      <Divider sx={{ my: 3 }} />

      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
          Save changes
        </LoadingButton>
      </Stack>
    </Form>
  );
}
