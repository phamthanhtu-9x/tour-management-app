'use client';

import { z as zod } from 'zod';
import { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';

import { useCopyToClipboard } from 'src/hooks/use-copy-to-clipboard';

import { getErrorMessage } from 'src/utils/get-error-message';

import { userService } from 'src/services';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

/** a-z, 0-9, '-', dài 3–30, không bắt đầu/kết thúc bằng '-' (luật của server). */
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

export type AccountSettingsSchemaType = zod.infer<typeof AccountSettingsSchema>;

export const AccountSettingsSchema = zod.object({
  slug: zod
    .string()
    .trim()
    .toLowerCase()
    .min(1, { message: 'Slug is required!' })
    .regex(SLUG_REGEX, {
      message: 'Use 3–30 characters: a-z, 0-9 and "-" (not at the start or end).',
    }),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AccountSettingsDialog({ open, onClose }: Props) {
  const { user, checkUserSession } = useAuthContext();
  const { copy } = useCopyToClipboard();

  const currentSlug: string = (user?.slug as string | null | undefined) ?? '';

  const defaultValues = useMemo(() => ({ slug: currentSlug }), [currentSlug]);

  const methods = useForm<AccountSettingsSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(AccountSettingsSchema),
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

  /** Link trang công khai cho slug ĐÃ LƯU (không phải slug đang gõ). */
  const publicUrl =
    currentSlug && typeof window !== 'undefined'
      ? `${window.location.origin}${paths.publicPlayers(currentSlug)}`
      : '';

  const handleCopy = async () => {
    if (!publicUrl) return;
    const ok = await copy(publicUrl);
    if (ok) toast.success('Link copied!');
    else toast.error('Could not copy the link.');
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      await userService.updateProfile({ slug: data.slug });
      // Tải lại thông tin user để slug mới có hiệu lực ở mọi nơi.
      await checkUserSession?.();
      toast.success('Account updated!');
      onClose();
    } catch (error) {
      console.error(error);
      // Vd slug đã được người khác sử dụng.
      toast.error(getErrorMessage(error, 'Update failed!'));
    }
  });

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Account settings</DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Field.Text
              name="slug"
              label="Slug"
              placeholder="pham-tu"
              helperText="Used in your public player lookup link. Must be unique: a-z, 0-9 and “-”, 3–30 characters."
              InputLabelProps={{ shrink: true }}
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Public player lookup link
              </Typography>

              {publicUrl ? (
                <Box
                  sx={{
                    pl: 1.5,
                    pr: 0.5,
                    py: 0.5,
                    gap: 1,
                    display: 'flex',
                    borderRadius: 1,
                    alignItems: 'center',
                    bgcolor: 'background.neutral',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ flex: '1 1 auto', minWidth: 0, wordBreak: 'break-all' }}
                  >
                    {publicUrl}
                  </Typography>

                  <Tooltip title="Copy link">
                    <IconButton onClick={handleCopy}>
                      <Iconify icon="solar:copy-bold" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Open in new tab">
                    <IconButton component="a" href={publicUrl} target="_blank" rel="noopener">
                      <Iconify icon="solar:square-arrow-right-up-bold" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Save a slug to get a link players can use to look up their info (no login
                  needed).
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={onClose}>
            Cancel
          </Button>

          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Save changes
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
