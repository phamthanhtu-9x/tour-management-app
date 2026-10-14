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

const playerKey = (id: number) => `p:${id}`;
const nameKey = (name: string) => `n:${name}`;

/** Khoá định danh một entry: playerId nếu có, nếu không thì theo tên. */
function entryKey(entry: TourControlEntry): string | null {
  if (entry.playerId != null) return playerKey(entry.playerId);
  return entry.name ? nameKey(entry.name) : null;
}

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  currentEntries: TourControlEntry[];
  onSave: (selected: TourControlEntry[]) => Promise<void>;
  /**
   * Cho phép thêm player mới (chưa có trong tour) hay không.
   * false khi đăng ký đã đóng: vẫn bỏ chọn được player hiện có, nhưng không thêm mới.
   */
  allowAddNew?: boolean;
};

// ----------------------------------------------------------------------

export function TournamentPlayerDialog({
  open,
  onClose,
  currentEntries,
  onSave,
  allowAddNew = true,
}: Props) {
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

  // ---- Khoá định danh entry ----------------------------------------------
  // Ưu tiên playerId (`p:<id>`); entry cũ / khách vãng lai không có playerId thì dùng tên (`n:<name>`).

  /** Các khoá của entries hiện có trong tour. */
  const currentKeys = useMemo(() => {
    const set = new Set<string>();
    currentEntries.forEach((e) => {
      const key = entryKey(e);
      if (key) set.add(key);
    });
    return set;
  }, [currentEntries]);

  /** Player (từ danh sách /players) đã có trong tour chưa – theo playerId, hoặc theo tên với entry cũ. */
  const isInTour = useCallback(
    (player: IPlayerItem) =>
      currentKeys.has(playerKey(player.id)) ||
      (!!player.name && currentKeys.has(nameKey(player.name))),
    [currentKeys]
  );

  // ---- selected keys -----------------------------------------------------

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setSelectedKeys(new Set(currentKeys));
    }
    prevOpenRef.current = open;
  }, [open, currentKeys]);

  const isSelected = useCallback(
    (player: IPlayerItem) =>
      selectedKeys.has(playerKey(player.id)) ||
      (!!player.name && selectedKeys.has(nameKey(player.name))),
    [selectedKeys]
  );

  // ---- toggle -------------------------------------------------------------

  const handleToggle = useCallback((player: IPlayerItem) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const pKey = playerKey(player.id);
      const nKey = player.name ? nameKey(player.name) : null;
      const selected = next.has(pKey) || (!!nKey && next.has(nKey));

      if (selected) {
        next.delete(pKey);
        if (nKey) next.delete(nKey);
      } else {
        next.add(pKey);
      }
      return next;
    });
  }, []);

  // ---- save ---------------------------------------------------------------

  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const updated: TourControlEntry[] = [];
      const keptPlayerIds = new Set<number>();

      // 1. Giữ các entry hiện có còn được chọn (giữ nguyên thứ tự, reBuyCount, isEliminated...).
      currentEntries.forEach((e) => {
        const key = entryKey(e);
        if (!key) return;

        // Entry cũ (chưa có playerId) nhưng khớp tên một player → bổ sung playerId.
        const matched =
          e.playerId == null && e.name ? allPlayers.find((p) => p.name === e.name) : undefined;
        const stillSelected =
          selectedKeys.has(key) || (!!matched && selectedKeys.has(playerKey(matched.id)));
        if (!stillSelected) return;

        const entry = matched ? { ...e, playerId: matched.id } : e;
        if (entry.playerId != null) keptPlayerIds.add(entry.playerId);
        updated.push(entry);
      });

      // 2. Thêm player mới được chọn (gửi kèm playerId).
      allPlayers.forEach((player) => {
        if (keptPlayerIds.has(player.id)) return;
        if (!selectedKeys.has(playerKey(player.id))) return;
        if (isInTour(player)) return;

        updated.push({
          playerId: player.id,
          name: player.name ?? '',
          avatar: player.avatar ?? undefined,
          isEliminated: false,
          reBuyCount: 0,
          addOn: [],
        });
      });

      await onSave(updated);
    } finally {
      setSaving(false);
    }
  }, [selectedKeys, currentEntries, allPlayers, isInTour, onSave]);

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
        {!allowAddNew && (
          <Typography variant="body2" color="warning.main" sx={{ px: 2, pb: 1.5 }}>
            Registration is closed – new players cannot be added.
          </Typography>
        )}

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
              const checked = isSelected(player);
              // Khi đóng đăng ký: không cho chọn player chưa có trong tour.
              const locked = !allowAddNew && !isInTour(player);
              const displayName = player.name || '—';
              const avatarUrl = getFileUrl(player.avatar);

              return (
                <Box
                  key={player.id}
                  onClick={() => {
                    if (!locked) handleToggle(player);
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 0.75,
                    cursor: locked ? 'not-allowed' : 'pointer',
                    opacity: locked ? 0.5 : 1,
                    '&:hover': { bgcolor: locked ? 'transparent' : 'action.hover' },
                  }}
                >
                  <Checkbox
                    checked={checked}
                    disabled={locked}
                    // Chặn click lan lên Box cha (nếu không sẽ toggle 2 lần → không đổi trạng thái)
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => handleToggle(player)}
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
