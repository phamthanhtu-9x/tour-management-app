import type { ITournamentItem } from 'src/types/tournament';

import { z as zod } from 'zod';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { tourService } from 'src/services';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { Box } from '@mui/material';

// ----------------------------------------------------------------------

export type TournamentSchemaType = zod.infer<typeof TournamentSchema>;

export const TournamentSchema = zod.object({
  title: zod.string().min(1, { message: 'Title is required!' }),
  desc: zod.string().optional(),
  startingStack: zod
    .number({ invalid_type_error: 'Must be a number' })
    .min(0)
    .optional()
    .nullable(),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  currentTournament?: ITournamentItem | null;
  onSuccess?: () => void;
};

export function TournamentFormDialog({ open, onClose, currentTournament, onSuccess }: Props) {
  const isEdit = !!currentTournament;

  const defaultValues = useMemo(
    () => ({
      title: currentTournament?.title || '',
      desc: currentTournament?.desc || '',
      startingStack: currentTournament?.startingStack ?? ('' as unknown as number),
    }),
    [currentTournament]
  );

  const methods = useForm<TournamentSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(TournamentSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (open) reset(defaultValues);
  }, [open, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const body = {
        title: data.title,
        desc: data.desc || undefined,
        startingStack: data.startingStack != null ? data.startingStack : undefined,
      };

      if (isEdit && currentTournament) {
        await tourService.updateTour(currentTournament.id, body);
      } else {
        await tourService.insertTour(body);
      }

      toast.success(isEdit ? 'Update success!' : 'Create success!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong!');
    }
  });

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>{isEdit ? 'Edit tournament' : 'New tournament'}</DialogTitle>

        <DialogContent>
          <Box sx={{ py: 1 }}>
            <Field.Text name="title" label="Title" sx={{ mb: 2.5 }} />

            <Field.Text
              name="desc"
              label="Description"
              multiline
              rows={3}
              sx={{ mb: 2.5 }}
            />

            <Field.Text
              name="startingStack"
              label="Starting stack"
              type="number"
              sx={{ mb: 2.5 }}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={onClose}>
            Cancel
          </Button>

          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
