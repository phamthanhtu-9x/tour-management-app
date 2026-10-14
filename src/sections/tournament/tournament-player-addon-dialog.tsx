'use client';

import type { TourControlEntry } from 'src/services/types';

import { z as zod } from 'zod';
import { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fNumber } from 'src/utils/format-number';

import { useBoolean } from 'src/hooks/use-boolean';

import { Form, Field } from 'src/components/hook-form';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { sumAddOn } from './tournament-clock-utils';

// ----------------------------------------------------------------------

export type AddOnSchemaType = zod.infer<typeof AddOnSchema>;

export const AddOnSchema = zod.object({
  chips: zod
    .number({ invalid_type_error: 'Chips must be a number!' })
    .int({ message: 'Chips must be a whole number!' })
    .positive({ message: 'Chips must be greater than 0!' }),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  /** Entry đang add-on (chốt lúc mở dialog). */
  entry?: TourControlEntry | null;
  /** Gọi khi submit: thêm một lần add-on `chips` cho entry. Throw nếu lỗi. */
  onSubmit: (chips: number) => Promise<void>;
  /** Gọi khi reset: xoá toàn bộ add-on của entry (addOn = []). Throw nếu lỗi. */
  onReset: () => Promise<void>;
};

export function TournamentPlayerAddOnDialog({ open, onClose, entry, onSubmit, onReset }: Props) {
  const confirmReset = useBoolean();
  const [resetting, setResetting] = useState(false);

  const addOns = entry?.addOn ?? [];
  const total = sumAddOn(addOns);

  const defaultValues = useMemo(() => ({ chips: '' as unknown as number }), []);

  const methods = useForm<AddOnSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(AddOnSchema),
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

  const handleFormSubmit = handleSubmit(async (data) => {
    try {
      await onSubmit(data.chips);
      onClose();
    } catch {
      // Lỗi đã được báo (toast) ở nơi gọi – giữ dialog mở để người dùng sửa / thử lại.
    }
  });

  const handleReset = async () => {
    setResetting(true);
    try {
      await onReset();
      confirmReset.onFalse();
      onClose();
    } catch {
      // Lỗi đã được báo (toast) ở nơi gọi – giữ dialog mở.
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
        <Form methods={methods} onSubmit={handleFormSubmit}>
          <DialogTitle>Add-on – {entry?.name || '—'}</DialogTitle>

          <DialogContent>
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Typography variant="subtitle2">Previous add-ons</Typography>

              {addOns.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No add-on yet.
                </Typography>
              ) : (
                <>
                  {addOns.map((chips, i) => (
                    <Row key={i} label={`#${i + 1}`} value={fNumber(chips)} />
                  ))}
                  <Divider sx={{ borderStyle: 'dashed' }} />
                  <Row label="Total" value={fNumber(total)} strong />
                </>
              )}
            </Stack>

            <Field.Text
              name="chips"
              label="Add-on chips"
              type="number"
              placeholder="e.g. 10000"
              autoFocus
              InputLabelProps={{ shrink: true }}
            />
          </DialogContent>

          <DialogActions>
            {/* Reset: xoá toàn bộ add-on của player (có xác nhận) */}
            <Button
              color="error"
              onClick={confirmReset.onTrue}
              disabled={addOns.length === 0 || isSubmitting}
              sx={{ mr: 'auto' }}
            >
              Reset
            </Button>

            <Button variant="outlined" color="inherit" onClick={onClose}>
              Cancel
            </Button>

            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              Add-on
            </LoadingButton>
          </DialogActions>
        </Form>
      </Dialog>

      <ConfirmDialog
        open={confirmReset.value}
        onClose={confirmReset.onFalse}
        title="Reset add-on"
        content={
          <>
            Remove all {addOns.length} add-on(s) ({fNumber(total)} chips) of{' '}
            <strong>{entry?.name || '—'}</strong>? This cannot be undone.
          </>
        }
        action={
          <LoadingButton
            variant="contained"
            color="error"
            loading={resetting}
            onClick={handleReset}
          >
            Reset
          </LoadingButton>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography
        variant={strong ? 'subtitle2' : 'body2'}
        sx={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </Typography>
    </Box>
  );
}
