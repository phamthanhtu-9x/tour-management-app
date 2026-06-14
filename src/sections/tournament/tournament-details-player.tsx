'use client';

import type { TourControlEntry } from 'src/services/types';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Avatar from '@mui/material/Avatar';
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
import { EmptyContent } from 'src/components/empty-content';

import { TournamentPlayerDialog } from './tournament-player-dialog';

// ----------------------------------------------------------------------

type Props = {
  id: number;
};

// ----------------------------------------------------------------------

export function TournamentDetailsPlayer({ id }: Props) {
  const { control, controlLoading, controlMutate } = useGetTourControl(id);

  const dialog = useBoolean();

  const entries: TourControlEntry[] = control?.entries ?? [];

  const [togglingEntry, setTogglingEntry] = useState<number | null>(null);

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

        <Card>
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
                  <TableCell align="right" sx={{ width: 120 }}>
                    In Game
                  </TableCell>
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
    </>
  );
}
