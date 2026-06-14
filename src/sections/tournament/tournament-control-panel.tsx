import type { TourLevelItemDto } from 'src/services/types';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import { tourService } from 'src/services';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { TournamentSetLevelDialog } from './tournament-set-level-dialog';

// ----------------------------------------------------------------------

type Props = {
  id: number;
  levels: TourLevelItemDto[];
  /** Clock có đang chạy không: running = true, paused/chưa start = false */
  isRunning: boolean;
  controlMutate: () => void;
};

// ----------------------------------------------------------------------

export function TournamentControlPanel({ id, levels, isRunning, controlMutate }: Props) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const confirmReset = useBoolean();
  const setLevelDialog = useBoolean();

  const runAction = useCallback(
    async (name: string, fn: () => Promise<unknown>) => {
      setLoadingAction(name);
      try {
        await fn();
        controlMutate();
        toast.success('Done!');
        return true;
      } catch (error) {
        console.error(error);
        toast.error('Action failed!');
        return false;
      } finally {
        setLoadingAction(null);
      }
    },
    [controlMutate]
  );

  const isBusy = loadingAction !== null;

  const actions = [
    {
      key: 'start',
      label: 'Start',
      icon: 'solar:play-bold',
      color: 'success' as const,
      disabled: isRunning,
      onClick: () => runAction('start', () => tourService.startClock(id)),
    },
    {
      key: 'pause',
      label: 'Pause',
      icon: 'solar:pause-bold',
      color: 'warning' as const,
      disabled: !isRunning,
      onClick: () => runAction('pause', () => tourService.pauseClock(id)),
    },
    {
      key: 'resume',
      label: 'Resume',
      icon: 'solar:play-circle-bold',
      color: 'success' as const,
      disabled: !isRunning,
      onClick: () => runAction('resume', () => tourService.resumeClock(id)),
    },
    {
      key: 'prev',
      label: 'Prev',
      icon: 'solar:rewind-back-bold',
      color: 'inherit' as const,
      disabled: !isRunning,
      onClick: () => runAction('prev', () => tourService.prevLevel(id)),
    },
    {
      key: 'next',
      label: 'Next',
      icon: 'solar:rewind-forward-bold',
      color: 'inherit' as const,
      disabled: !isRunning,
      onClick: () => runAction('next', () => tourService.nextLevel(id)),
    },
    {
      key: 'set-level',
      label: 'Set level',
      icon: 'solar:list-check-bold',
      color: 'primary' as const,
      disabled: !isRunning,
      onClick: () => setLevelDialog.onTrue(),
    },
    {
      key: 'reset',
      label: 'Reset',
      icon: 'solar:restart-bold',
      color: 'error' as const,
      disabled: false,
      onClick: () => confirmReset.onTrue(),
    },
  ];

  return (
    <>
      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Clock Control
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(4, 1fr)',
              md: 'repeat(7, 1fr)',
            },
          }}
        >
          {actions.map((action) => (
            <Button
              key={action.key}
              fullWidth
              variant={action.color === 'inherit' ? 'outlined' : 'contained'}
              color={action.color}
              onClick={action.onClick}
              disabled={isBusy || action.disabled}
              startIcon={<Iconify icon={action.icon} />}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      </Card>

      <TournamentSetLevelDialog
        open={setLevelDialog.value}
        onClose={setLevelDialog.onFalse}
        id={id}
        levels={levels}
        onSuccess={controlMutate}
      />

      <ConfirmDialog
        open={confirmReset.value}
        onClose={confirmReset.onFalse}
        title="Reset clock"
        content="Are you sure you want to reset the clock to its initial state?"
        action={
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              confirmReset.onFalse();
              await runAction('reset', () => tourService.resetClock(id));
            }}
          >
            Reset
          </Button>
        }
      />
    </>
  );
}
