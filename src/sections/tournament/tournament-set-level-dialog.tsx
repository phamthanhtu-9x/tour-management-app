import type { TourLevelItemDto } from 'src/services/types';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { tourService } from 'src/services';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  id: number;
  levels: TourLevelItemDto[];
  onSuccess: () => void;
};

// ----------------------------------------------------------------------

export function TournamentSetLevelDialog({ open, onClose, id, levels, onSuccess }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) setSelectedLevel('');
  }, [open]);

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

  const handleConfirm = useCallback(async () => {
    if (selectedLevel === '') return;

    setIsSubmitting(true);
    try {
      await tourService.setLevel(id, { level: Number(selectedLevel) });
      toast.success('Level changed!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Change level failed!');
    } finally {
      setIsSubmitting(false);
    }
  }, [id, selectedLevel, onSuccess, onClose]);

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
      <DialogTitle>Jump to level</DialogTitle>

      <DialogContent>
        <TextField
          select
          fullWidth
          label="Select level"
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ mt: 1 }}
        >
          {levelOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </Button>

        <LoadingButton
          variant="contained"
          onClick={handleConfirm}
          loading={isSubmitting}
          disabled={selectedLevel === ''}
        >
          Go
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
