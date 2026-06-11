import type { IPlayerItem } from 'src/types/player';

import { z as zod } from 'zod';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { playerService, uploadService } from 'src/services';

import { fData } from 'src/utils/format-number';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type PlayerSchemaType = zod.infer<typeof PlayerSchema>;

export const PlayerSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  avatar: schemaHelper.file({ message: { required_error: 'Avatar is required!' } }),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  currentPlayer?: IPlayerItem | null;
  onSuccess?: () => void;
};

export function PlayerFormDialog({ open, onClose, currentPlayer, onSuccess }: Props) {
  const isEdit = !!currentPlayer;

  const defaultValues = useMemo(
    () => ({
      name: currentPlayer?.name || '',
      avatar: currentPlayer?.avatar || null,
    }),
    [currentPlayer]
  );

  const methods = useForm<PlayerSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(PlayerSchema),
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
      // Avatar: nếu là File mới chọn thì upload lấy url, nếu đã là string thì giữ nguyên.
      let avatarUrl: string | undefined;

      if (data.avatar instanceof File) {
        const uploaded = await uploadService.uploadFile(data.avatar);
        // Response envelope: { statusCode, message, data: { path, filename, ... } }
        avatarUrl = uploaded?.data?.path ?? uploaded?.path;
      } else if (typeof data.avatar === 'string') {
        avatarUrl = data.avatar;
      }

      const body = { name: data.name, avatar: avatarUrl };

      if (isEdit && currentPlayer) {
        await playerService.updatePlayer(currentPlayer.id, body);
      } else {
        await playerService.insertPlayer(body);
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
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>{isEdit ? 'Edit player' : 'New player'}</DialogTitle>

        <DialogContent>
          <Box sx={{ mb: 4, mt: 1 }}>
            <Field.UploadAvatar
              name="avatar"
              maxSize={3145728}
              helperText={
                <Typography
                  variant="caption"
                  sx={{
                    mt: 3,
                    mx: 'auto',
                    display: 'block',
                    textAlign: 'center',
                    color: 'text.disabled',
                  }}
                >
                  Allowed *.jpeg, *.jpg, *.png, *.gif
                  <br /> max size of {fData(3145728)}
                </Typography>
              }
            />
          </Box>

          <Field.Text name="name" label="Name" />
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
