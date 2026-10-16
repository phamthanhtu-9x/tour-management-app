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
import { getFileUrl } from 'src/utils/file-url';
import { getErrorMessage } from 'src/utils/get-error-message';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

/** Bỏ các ký tự phân cách mà server cũng tự bỏ. */
const normalizePhone = (value: string) => value.replace(/[\s.\-()]/g, '');

const PHONE_REGEX = /^\+?\d{8,15}$/;

export type PlayerSchemaType = zod.infer<typeof PlayerSchema>;

export const PlayerSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  // Không bắt buộc: player có thể không có avatar (kể cả khi tạo mới).
  avatar: zod.custom<File | string | null>().nullable().optional(),
  // Không bắt buộc. Cùng luật với server: 8–15 chữ số, có thể có '+' ở đầu;
  // khoảng trắng, '.', '-', '(', ')' được bỏ qua khi kiểm tra.
  phone: zod
    .string()
    .trim()
    .refine((value) => value === '' || PHONE_REGEX.test(normalizePhone(value)), {
      message: 'Phone must have 8–15 digits and may start with "+"!',
    }),
  point: zod
    .number({ invalid_type_error: 'Point must be a number!' })
    .min(0, { message: 'Point must be greater than or equal to 0!' })
    .optional()
    .nullable(),
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
      // Avatar lưu dạng đường dẫn tương đối ("uploads/abc.jpg") → ghép server URL để preview hiển thị được.
      avatar: getFileUrl(currentPlayer?.avatar) || null,
      phone: currentPlayer?.phone ?? '',
      point: currentPlayer?.point ?? 0,
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
        // Không đổi ảnh → gửi lại đường dẫn gốc (tương đối), không gửi URL đầy đủ dùng để preview.
        avatarUrl = currentPlayer?.avatar ?? data.avatar;
      }

      const body = {
        name: data.name,
        avatar: avatarUrl,
        // Trống → null để bỏ số điện thoại (kể cả khi sửa và xoá số cũ).
        phone: data.phone ? data.phone : null,
        point: data.point ?? 0,
      };

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
      // Hiện lỗi của server, vd số điện thoại trùng với player khác.
      toast.error(getErrorMessage(error, 'Something went wrong!'));
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

          <Field.Text name="name" label="Name" sx={{ mb: 2.5 }} />

          <Field.Text
            name="phone"
            label="Phone"
            type="tel"
            placeholder="0912345678"
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2.5 }}
          />

          <Field.Text
            name="point"
            label="Point"
            type="number"
            placeholder="0"
            InputLabelProps={{ shrink: true }}
          />
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
