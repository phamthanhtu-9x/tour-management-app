import type { ITournamentItem } from 'src/types/tournament';
import type { ITourState, ITourLevelsPayload } from 'src/types/tour-socket';
import type { TourControlData, TourLevelItemDto } from 'src/services/types';

import { useCallback, useMemo, useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { tourService } from 'src/services';
import { useGetTourLevels, useGetTourControl } from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { TournamentControlPanel } from './tournament-control-panel';
import { TournamentTourTimer } from './tournament-tour-timer';

// ----------------------------------------------------------------------

type Props = {
  id: number;
  tournament?: ITournamentItem | null;
  tournamentMutate: () => void;
  tournamentLoading?: boolean;
  /** Real-time state từ WebSocket (ưu tiên dùng khi connected). */
  tourState?: ITourState | null;
  /** Real-time levels từ WebSocket (ưu tiên dùng khi connected). */
  tourLevels?: ITourLevelsPayload | null;
  /** WebSocket đã kết nối hay chưa. */
  wsConnected?: boolean;
};

// ----------------------------------------------------------------------

export function TournamentDetailsControl({
  id,
  tournament,
  tournamentMutate,
  tournamentLoading,
  tourState,
  tourLevels,
  wsConnected,
}: Props) {
  const { levels: restLevels, levelsLoading } = useGetTourLevels(id);
  const { control: restControl, controlMutate } = useGetTourControl(id);

  // ---- Merge socket data với REST data: socket ưu tiên khi connected ----
  const control: TourControlData | null =
    wsConnected && tourState
      ? ({
          currentLevel: tourState.currentLevel,
          isRunning: tourState.isRunning,
          entries: tourState.entries.map((e) => ({
            name: e.name,
            avatar: e.avatar,
            isEliminated: e.isEliminated,
            reBuyCount: e.reBuyCount,
          })),
          gtd: tourState.gtd,
        } as TourControlData)
      : (restControl ?? null);

  const levels: TourLevelItemDto[] =
    wsConnected && tourLevels
      ? (tourLevels.levels.map((l) => ({
          name: l.name ?? undefined,
          type: l.type,
          idx: l.idx,
          duration: l.duration,
          smallBlind: l.smallBlind ?? undefined,
          bigBlind: l.bigBlind ?? undefined,
          ante: l.ante ?? undefined,
        })) as TourLevelItemDto[])
      : restLevels;

  // ---- Data ready flag: socket connected hoặc REST đã load xong ----
  const dataReady = wsConnected ? !!tourState : !levelsLoading;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gtd, setGtd] = useState('');
  const [savingGtd, setSavingGtd] = useState(false);

  const controlGtd: string = (control as any)?.gtd ?? '';

  useEffect(() => {
    setGtd(controlGtd);
  }, [controlGtd]);

  const levelOptions = useMemo(
    () =>
      levels
        .filter((l) => l.type !== 'BREAK')
        .map((l) => ({
          value: l.idx,
          label: `${l.name ? `${l.name}` : ''} (${l.type})`,
        })),
    [levels]
  );

  const currentRegEnd = tournament?.regEnd ?? null;

  const handleUpdateRegEnd = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const newRegEnd = raw === '' || raw === undefined ? null : Number(raw);

      setIsSubmitting(true);
      try {
        await tourService.updateTour(id, { regEnd: newRegEnd ?? undefined });
        tournamentMutate();
        toast.success('Reg end updated!');
      } catch (error) {
        console.error(error);
        toast.error('Update failed!');
      } finally {
        setIsSubmitting(false);
      }
    },
    [id, tournamentMutate]
  );

  const handleChangeGtd = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setGtd(event.target.value);
  }, []);

  const handleSaveGtd = useCallback(async () => {
    setSavingGtd(true);
    try {
      await tourService.updateGtd(id, { gtd });
      toast.success('GTD updated!');
    } catch (error) {
      console.error(error);
      toast.error('GTD update failed!');
    } finally {
      setSavingGtd(false);
    }
  }, [id, gtd]);

  if (tournamentLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TournamentTourTimer
        tournament={tournament}
        control={control}
        levels={levels}
        levelsLoading={!dataReady}
        tourState={tourState}
        wsConnected={wsConnected}
        tourId={id}
      />

      <TournamentControlPanel
        id={id}
        levels={levels}
        isRunning={control?.isRunning ?? false}
        controlMutate={controlMutate}
        tourState={tourState}
        wsConnected={wsConnected}
      />

      <Card sx={{ p: 3 }}>
        {!dataReady ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
            {levels.length === 0 ? (
              <Box sx={{ flex: 1, width: '100%' }}>
                <EmptyContent title="No levels" description="Add levels in the Blind tab first." />
              </Box>
            ) : (
              <TextField
                select
                fullWidth
                label="Registration End Level (regEnd)"
                value={currentRegEnd ?? ''}
                onChange={handleUpdateRegEnd}
                disabled={isSubmitting}
                sx={{ flex: 1 }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {levelOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              fullWidth
              label="GTD (prize structure)"
              placeholder="10/5/3/3/1"
              value={gtd}
              onChange={handleChangeGtd}
              helperText="Định dạng: {số}/{số}/... (vd: 10/5/3/3/1)"
              sx={{ flex: 1 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      color="primary"
                      onClick={handleSaveGtd}
                      disabled={savingGtd || gtd === controlGtd}
                      edge="end"
                    >
                      {savingGtd ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Iconify icon="solar:diskette-bold" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        )}
      </Card>
    </Box>
  );
}
