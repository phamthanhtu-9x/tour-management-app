'use client';

import type { ITourState } from 'src/types/tour-socket';
import type { TourControlEntry } from 'src/services/types';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useBoolean } from 'src/hooks/use-boolean';

import { useGetTourControl } from 'src/actions/tournament';
import { tourService } from 'src/services';
import { getFileUrl } from 'src/utils/file-url';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { EmptyContent } from 'src/components/empty-content';

import { TournamentPlayerDialog } from './tournament-player-dialog';

// ----------------------------------------------------------------------

type Props = {
  id: number;
  /** Real-time state từ WebSocket (ưu tiên dùng khi connected). */
  tourState?: ITourState | null;
  /** WebSocket đã kết nối hay chưa. */
  wsConnected?: boolean;
};

// ----------------------------------------------------------------------

export function TournamentDetailsPlayer({ id, tourState, wsConnected }: Props) {
  const { control: restControl, controlLoading, controlMutate } = useGetTourControl(id);

  // ---- Merge socket data với REST data: socket ưu tiên khi connected ----
  const entries: TourControlEntry[] =
    wsConnected && tourState
      ? tourState.entries.map((e) => ({
          name: e.name,
          avatar: e.avatar,
          isEliminated: e.isEliminated,
          reBuyCount: e.reBuyCount,
        }))
      : (restControl?.entries ?? []);

  const dialog = useBoolean();
  const confirm = useBoolean();

  const [togglingEntry, setTogglingEntry] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  // ----------------------------------------------------------------------

  const handleToggleEliminated = useCallback(
    async (index: number, currentValue: boolean) => {
      setTogglingEntry(index);
      try {
        const updated = entries.map((e, i) =>
          i === index ? { ...e, isEliminated: !currentValue } : e
        );
        await tourService.updateEntries(id, updated);
        controlMutate();
        toast.success('Updated!');
      } catch (error) {
        console.error(error);
        toast.error('Update failed!');
      } finally {
        setTogglingEntry(null);
      }
    },
    [entries, id, controlMutate]
  );

  const handleChangeReBuy = useCallback(
    async (index: number, delta: number) => {
      const current = entries[index]?.reBuyCount ?? 0;
      const next = Math.max(0, current + delta);
      if (next === current) return;

      try {
        const updated = entries.map((e, i) =>
          i === index ? { ...e, reBuyCount: next } : e
        );
        await tourService.updateEntries(id, updated);
        controlMutate();
        toast.success('Updated!');
      } catch (error) {
        console.error(error);
        toast.error('Update failed!');
      }
    },
    [entries, id, controlMutate]
  );

  const handleUpdateEntries = useCallback(
    async (selected: TourControlEntry[]) => {
      try {
        await tourService.updateEntries(id, selected);
        controlMutate();
        dialog.onFalse();
        toast.success('Players updated!');
      } catch (error) {
        console.error(error);
        toast.error('Update failed!');
      }
    },
    [id, controlMutate, dialog]
  );

  const handleOpenDelete = useCallback(
    (index: number) => {
      setDeleteIndex(index);
      confirm.onTrue();
    },
    [confirm]
  );

  const handleDeleteEntry = useCallback(async () => {
    if (deleteIndex === null) return;

    try {
      const updated = entries.filter((_, i) => i !== deleteIndex);
      await tourService.updateEntries(id, updated);
      controlMutate();
      confirm.onFalse();
      setDeleteIndex(null);
      toast.success('Delete success!');
    } catch (error) {
      console.error(error);
      toast.error('Delete failed!');
    }
  }, [deleteIndex, entries, id, controlMutate, confirm]);

  // ----------------------------------------------------------------------

  return (
    <>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={dialog.onTrue}
          >
            Update Players
          </Button>
        </Box>

        <Card sx={{ overflowX: 'auto' }}>
          {controlLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : entries.length === 0 ? (
            <EmptyContent title="No players" description="No players have been added to this tournament yet." />
          ) : (
            <Table size="small" sx={{ minWidth: 480 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 56 }} />
                  <TableCell>Player Name</TableCell>
                  <TableCell align="center" sx={{ width: 100 }}>
                    Re-buy
                  </TableCell>
                  <TableCell align="right" sx={{ width: 120 }}>
                    In Game
                  </TableCell>
                  <TableCell align="right" sx={{ width: 56 }} />
                </TableRow>
              </TableHead>

              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow key={`${entry.name}-${index}`} hover sx={{opacity: entry.isEliminated ? 0.5: 1 }}>
                    <TableCell sx={{ py: 0.75 }}>
                      <Avatar
                        alt={entry.name || '—'}
                        src={getFileUrl(entry.avatar)}
                        sx={{ width: 32, height: 32 }}
                      >
                        {!entry.avatar ? (entry.name?.[0] ?? '?').toUpperCase() : undefined}
                      </Avatar>
                    </TableCell>

                    <TableCell>{entry.name || '—'}</TableCell>

                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleChangeReBuy(index, -1)}
                          disabled={togglingEntry === index}
                          sx={{ p: 0.25 }}
                        >
                          <Iconify icon="mingcute:minimize-line" width={16} />
                        </IconButton>
                        <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                          {entry.reBuyCount ?? 0}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleChangeReBuy(index, 1)}
                          disabled={togglingEntry === index}
                          sx={{ p: 0.25 }}
                        >
                          <Iconify icon="mingcute:add-line" width={16} />
                        </IconButton>
                      </Box>
                    </TableCell>

                    <TableCell align="right">
                      {togglingEntry === index ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Switch
                          checked={!entry.isEliminated}
                          onChange={() => handleToggleEliminated(index, !!entry.isEliminated)}
                          size="small"
                        />
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <IconButton color="error" onClick={() => handleOpenDelete(index)}>
                        <Iconify icon="mingcute:delete-2-line" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </Box>

      <TournamentPlayerDialog
        open={dialog.value}
        onClose={dialog.onFalse}
        currentEntries={entries}
        onSave={handleUpdateEntries}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete{' '}
            <strong>{deleteIndex !== null ? entries[deleteIndex]?.name : ''}</strong>
            ?
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={handleDeleteEntry}>
            Delete
          </Button>
        }
      />
    </>
  );
}
