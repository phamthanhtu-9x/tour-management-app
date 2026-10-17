import { z as zod } from 'zod';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, useFieldArray } from 'react-hook-form';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { tourService } from 'src/services';
import { getErrorMessage } from 'src/utils/get-error-message';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import {
  gtdRankLabel,
  parseGtdRanks,
  formatGtdRanks,
  autoCalculateGtd,
} from './tournament-gtd-utils';

// ----------------------------------------------------------------------

export type GtdSchemaType = zod.infer<typeof GtdSchema>;

export const GtdSchema = zod
  .object({
    /** Tổng GTD: chỉ dùng để auto tính trong dialog, không lưu lên backend. */
    total: zod.number({ invalid_type_error: 'Must be a number' }).min(0).optional().nullable(),
    ranks: zod
      .array(
        zod.object({
          points: zod
            .number({ invalid_type_error: 'Required' })
            .int({ message: 'Integer only' })
            .min(1, { message: 'Must be > 0' }),
        })
      )
      .min(1, { message: 'Add at least one top!' }),
  })
  .superRefine((data, ctx) => {
    data.ranks.forEach((rank, index) => {
      if (index > 0 && rank.points > data.ranks[index - 1].points) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: `≤ top ${gtdRankLabel(index - 1)}`,
          path: ['ranks', index, 'points'],
        });
      }
    });
  });

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  tourId: number;
  /** GTD hiện tại, dạng "10/5/3/3/1". */
  currentGtd?: string | null;
  onSuccess?: () => void;
};

export function TournamentGtdDialog({ open, onClose, tourId, currentGtd, onSuccess }: Props) {
  const defaultValues = useMemo(() => {
    const ranks = parseGtdRanks(currentGtd);
    return {
      total: ranks.length ? ranks.reduce((a, b) => a + b, 0) : ('' as unknown as number),
      ranks: ranks.map((points) => ({ points })),
    };
  }, [currentGtd]);

  const methods = useForm<GtdSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(GtdSchema),
    defaultValues,
  });

  const {
    reset,
    control,
    getValues,
    clearErrors,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = methods;

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'ranks' });

  useEffect(() => {
    if (open) reset(defaultValues);
  }, [open, defaultValues, reset]);

  const watchedRanks = useWatch({ control, name: 'ranks' });
  const watchedTotal = useWatch({ control, name: 'total' });

  const sumPoints = (watchedRanks ?? []).reduce((acc, r) => acc + (Number(r?.points) || 0), 0);
  const total = Number(watchedTotal) || 0;
  const mismatch = total > 0 && sumPoints !== total;

  const handleAutoCalculate = () => {
    const value = Number(getValues('total')) || 0;
    if (value <= 0) {
      toast.error('Nhập Total GTD trước khi auto tính!');
      return;
    }
    clearErrors();
    replace(autoCalculateGtd(value).map((points) => ({ points })));
  };

  const handleAddTop = () => {
    const ranks = getValues('ranks');
    const last = ranks[ranks.length - 1]?.points;
    append({ points: last && last > 0 ? last : 1 });
  };

  const handleRemoveTop = (index: number) => {
    remove(index);
    clearErrors('ranks');
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const gtd = formatGtdRanks(data.ranks.map((r) => r.points));
      await tourService.updateGtd(tourId, { gtd });
      toast.success('GTD updated!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, 'GTD update failed!'));
    }
  });

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>GTD structure</DialogTitle>

        <DialogContent>
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ pt: 1, mb: 2 }}>
            <Field.Text
              name="total"
              label="Total GTD"
              type="number"
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: 0, inputMode: 'numeric' }}
              onKeyDown={(event) => {
                // Enter trong ô Total → auto tính thay vì submit form
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleAutoCalculate();
                }
              }}
            />
            <Button
              variant="soft"
              color="primary"
              onClick={handleAutoCalculate}
              startIcon={<Iconify icon="solar:magic-stick-3-bold" />}
              sx={{ flexShrink: 0, height: 54 }}
            >
              Auto
            </Button>
          </Stack>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 64 }}>Top</TableCell>
                <TableCell>Points</TableCell>
                <TableCell sx={{ width: 48 }} />
              </TableRow>
            </TableHead>

            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell sx={{ fontWeight: 700 }}>{gtdRankLabel(index)}</TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Field.Text
                      name={`ranks.${index}.points`}
                      type="number"
                      size="small"
                      inputProps={{
                        min: 1,
                        inputMode: 'numeric',
                        'aria-label': `Points top ${gtdRankLabel(index)}`,
                      }}
                    />
                  </TableCell>
                  <TableCell padding="none">
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveTop(index)}
                      aria-label={`Remove top ${gtdRankLabel(index)}`}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {!fields.length && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}
                  >
                    Chưa có top nào. Nhập Total GTD rồi bấm Auto, hoặc thêm top thủ công.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Box
            sx={{ mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Button
              size="small"
              color="inherit"
              onClick={handleAddTop}
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Add top
            </Button>

            <Typography
              variant="subtitle2"
              sx={{
                fontVariantNumeric: 'tabular-nums',
                color: mismatch ? 'warning.main' : 'text.primary',
              }}
            >
              Total: {sumPoints.toLocaleString()}
              {total > 0 && ` / ${total.toLocaleString()}`}
            </Typography>
          </Box>

          {mismatch && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Tổng điểm các top ({sumPoints.toLocaleString()}) khác Total GTD (
              {total.toLocaleString()}). Bạn vẫn có thể lưu.
            </Alert>
          )}

          {!!errors.ranks?.root?.message || !!errors.ranks?.message ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errors.ranks?.root?.message ?? errors.ranks?.message}
            </Alert>
          ) : null}
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Save
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
