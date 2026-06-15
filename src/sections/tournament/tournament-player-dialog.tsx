'use client';

import type { IPlayerItem } from 'src/types/player';
import type { TourControlEntry } from 'src/services/types';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useGetPlayers } from 'src/actions/player';
import { getFileUrl } from 'src/utils/file-url';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  currentEntries: TourControlEntry[];
  onSave: (selected: TourControlEntry[]) => Promise<void>;
};

// ----------------------------------------------------------------------

export function TournamentPlayerDialog({ open, onClose, currentEntries, onSave }: Props) {
  const [page, setPage] = useState(1);

  // Only fetch when dialog is open
  const { players, playersTotal, playersLoading } = useGetPlayers(
    open ? { page, limit: 10 } : null
  );

  // ---- Accumulate players across pages -----------------------------------

  const [allPlayers, setAllPlayers] = useState<IPlayerItem[]>([]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setAllPlayers([]);
      setPage(1);
      prevPlayersRef.current = [];
    }
  }, [open]);

  // Append new data when players change
  const prevPlayersRef = useRef<IPlayerItem[]>([]);
  useEffect(() => {
    if (!players.length) return;

    const prev = prevPlayersRef.current;
    const prevIds = new Set(prev.map((p) => p.id));
    const fresh = players.filter((p) => !prevIds.has(p.id));

    if (fresh.length) {
      setAllPlayers((prevAll) => [...prevAll, ...fresh]);
    }

    prevPlayersRef.current = players;
  }, [players]);

  const hasMore = playersTotal > 0 && allPlayers.length < playersTotal;

  // ---- current entries names ----------------------------------------------

  const currentNames = useMemo(() => {
    const set = new Set<string>();
    currentEntries.forEach((e) => {
      if (e.name) set.add(e.name);
    });
    return set;
  }, [currentEntries]);

  // ---- selected names ----------------------------------------------------

  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setSelectedNames(currentNames);
    }
    prevOpenRef.current = open;
  }, [open, currentNames]);

  // ---- toggle -------------------------------------------------------------

  const handleToggle = useCallback((name: string) => {
    setSelectedNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  // ---- save ---------------------------------------------------------------

  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const existingMap = new Map<string, TourControlEntry>();
      currentEntries.forEach((e) => {
        if (e.name) existingMap.set(e.name, e);
      });

      const updated: TourControlEntry[] = [];
      selectedNames.forEach((name) => {
        const existing = existingMap.get(name);
        if (existing) {
          updated.push(existing);
        } else {
          const player = allPlayers.find((p) => p.name === name);
          updated.push({ name, avatar: player?.avatar ?? undefined, isEliminated: false, reBuyCount: 0 });
        }
      });

      await onSave(updated);
    } finally {
      setSaving(false);
    }
  }, [selectedNames, currentEntries, allPlayers, onSave]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  // ---- Infinite scroll: useInView watches sentinel ------------------------

  const { ref: sentinelRef } = useInView({
    threshold: 0,
    rootMargin: '200px',
    skip: !hasMore || playersLoading,
    onChange: (inView) => {
      if (inView) {
        setPage((prev) => prev + 1);
      }
    },
  });

  // ----------------------------------------------------------------------

  const isFirstPageLoading = playersLoading && allPlayers.length === 0;

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
      <DialogTitle>Update Players</DialogTitle>

      <DialogContent dividers sx={{px: 0, py: 2}}>
        <Scrollbar sx={{ maxHeight: 400, overflowY: 'auto' }}>
        {isFirstPageLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : !allPlayers.length ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No players found. Please create players first.
            </Typography>
          </Box>
        ) : (
          <Box>
            {allPlayers.map((player) => {
              const checked = selectedNames.has(player.name ?? '');
              const displayName = player.name || '—';
              const avatarUrl = getFileUrl(player.avatar);

              return (
                <Box
                  key={player.id}
                  onClick={() => handleToggle(player.name ?? '')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 0.75,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Checkbox
                    checked={checked}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggle(player.name ?? '');
                    }}
                    sx={{ mr: 1 }}
                  />

                  <Avatar alt={displayName} src={avatarUrl} sx={{ width: 36, height: 36, mr: 1.5 }}>
                    {!avatarUrl ? (displayName[0] ?? '?').toUpperCase() : undefined}
                  </Avatar>

                  <Typography variant="body2">{displayName}</Typography>
                </Box>
              );
            })}

            {/* Loading indicator */}
            {playersLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={20} />
              </Box>
            )}

            {/* Sentinel – useInView watches this to trigger next page */}
            {hasMore && (
              <Box ref={sentinelRef} sx={{ height: 1 }} />
            )}
          </Box>
        )}
        </Scrollbar>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={handleCancel}>
          Cancel
        </Button>

        <Button variant="contained" onClick={handleSave} disabled={saving || playersLoading}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
