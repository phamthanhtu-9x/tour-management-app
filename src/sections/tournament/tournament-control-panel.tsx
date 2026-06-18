import type { TourLevelItemDto } from 'src/services/types';
import type { ITourState } from 'src/types/tour-socket';

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
  /** Real-time tour state từ WebSocket (để biết isPaused). */
  tourState?: ITourState | null;
  /** WebSocket đã kết nối hay chưa. */
  wsConnected?: boolean;
};

// ----------------------------------------------------------------------

export function TournamentControlPanel({
  id,
  levels,
  isRunning,
  controlMutate,
  tourState,
  wsConnected,
}: Props) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const confirmReset = useBoolean();
  const setLevelDialog = useBoolean();

  // ---- Phân biệt 3 trạng thái từ 2 cờ độc lập của server ----
  // started: tour đã được start (chưa reset)
  // paused:  tour đang tạm dừng
  // ticking: tour đang chạy thực sự (started && !paused)
  const hasSocket = !!(wsConnected && tourState);
  const started = hasSocket ? !!tourState!.isRunning : isRunning;
  const paused = hasSocket ? !!tourState!.isPaused : !isRunning;
  const ticking = started && !paused;

  const runAction = useCallback(
    async (name: string, fn: () => Promise<unknown>) => {
      setLoadingAction(name);
      try {
        await fn();
        // Không cần gọi controlMutate ngay vì WebSocket sẽ push tour-state mới.
        // Vẫn gọi để fallback REST nếu socket chưa connected.
        if (!wsConnected) {
          controlMutate();
        }
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
    [controlMutate, wsConnected]
  );

  const isBusy = loadingAction !== null;

  const actions = [
    {
      key: 'start',
      label: 'Start',
      icon: 'solar:play-bold',
      color: 'success' as const,
      // Chỉ start được khi tour chưa start.
      disabled: started,
      onClick: () => runAction('start', () => tourService.startClock(id)),
    },
    {
      key: 'pause',
      label: 'Pause',
      icon: 'solar:pause-bold',
      color: 'warning' as const,
      // Chỉ pause được khi đang chạy.
      disabled: !ticking,
      onClick: () => runAction('pause', () => tourService.pauseClock(id)),
    },
    {
      key: 'resume',
      label: 'Resume',
      icon: 'solar:play-circle-bold',
      color: 'success' as const,
      // Chỉ resume được khi đã start và đang pause.
      disabled: !(started && paused),
      onClick: () => runAction('resume', () => tourService.resumeClock(id)),
    },
    {
      key: 'prev',
      label: 'Prev',
      icon: 'solar:rewind-back-bold',
      color: 'inherit' as const,
      // Đổi level được khi tour đã start (kể cả đang pause).
      disabled: !started,
      onClick: () => runAction('prev', () => tourService.prevLevel(id)),
    },
    {
      key: 'next',
      label: 'Next',
      icon: 'solar:rewind-forward-bold',
      color: 'inherit' as const,
      disabled: !started,
      onClick: () => runAction('next', () => tourService.nextLevel(id)),
    },
    {
      key: 'forward',
      label: '+5s',
      icon: 'solar:skip-forward-bold',
      color: 'primary' as const,
      disabled: !started,
      onClick: () => runAction('forward', () => tourService.forwardTime(id)),
    },
    {
      key: 'rewind',
      label: '-5s',
      icon: 'solar:skip-back-bold',
      color: 'primary' as const,
      disabled: !started,
      onClick: () => runAction('rewind', () => tourService.rewindTime(id)),
    },
    {
      key: 'set-level',
      label: 'Set level',
      icon: 'solar:list-check-bold',
      color: 'primary' as const,
      disabled: !started,
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
              md: 'repeat(auto-fill, minmax(120px, 1fr))',
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
