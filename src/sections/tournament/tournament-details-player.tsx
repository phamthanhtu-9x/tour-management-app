'use client';

import type { ITourState } from 'src/types/tour-socket';
import type { TourControlEntry } from 'src/services/types';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
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
import { fNumber } from 'src/utils/format-number';
import { getErrorMessage } from 'src/utils/get-error-message';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { EmptyContent } from 'src/components/empty-content';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { TournamentPlayerDialog, type PlayerDialogChanges } from './tournament-player-dialog';
import { sumAddOn } from './tournament-clock-utils';
import { TournamentPlayerInfoDialog } from './tournament-player-info-dialog';
import { TournamentPlayerAddOnDialog } from './tournament-player-addon-dialog';

// ----------------------------------------------------------------------

/** Chu kỳ gọi lại REST control khi mất WebSocket (ms). */
const CONTROL_POLL_MS = 5000;

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
  const { control: restControl, controlLoading, controlMutate } = useGetTourControl(id, {
    refreshInterval: wsConnected ? 0 : CONTROL_POLL_MS,
  });

  // Socket vừa rớt → lấy lại REST control ngay thay vì chờ chu kỳ polling.
  useEffect(() => {
    if (!wsConnected) controlMutate();
  }, [wsConnected, controlMutate]);

  // ---- Merge socket data với REST data: socket ưu tiên khi connected ----
  const entries: TourControlEntry[] =
    wsConnected && tourState
      ? tourState.entries.map((e) => ({
          id: e.id,
          playerId: e.playerId,
          name: e.name,
          avatar: e.avatar,
          isEliminated: e.isEliminated,
          reBuyCount: e.reBuyCount,
          addOn: e.addOn ?? [],
        }))
      : (restControl?.entries ?? []);

  // Đăng ký còn mở không (server tính). Không có dữ liệu → coi như còn mở.
  const isRegOpen =
    (wsConnected && tourState ? tourState.isRegOpen : restControl?.isRegOpen) ?? true;

  const dialog = useBoolean();
  const confirm = useBoolean();

  const popover = usePopover();
  const infoDialog = useBoolean();
  /** Entry đang xem Info – chốt lúc mở để không đổi người khi danh sách cập nhật real-time. */
  const [infoEntry, setInfoEntry] = useState<TourControlEntry | null>(null);

  const addOnDialog = useBoolean();
  /** Entry đang add-on – chốt lúc mở dialog. */
  const [addOnEntry, setAddOnEntry] = useState<TourControlEntry | null>(null);

  const [togglingEntry, setTogglingEntry] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  /** Index của entry đang mở menu Actions. */
  const [menuIndex, setMenuIndex] = useState<number | null>(null);

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
        toast.error(getErrorMessage(error, 'Update failed!'));
      } finally {
        setTogglingEntry(null);
      }
    },
    [entries, id, controlMutate]
  );

  /** Rebuy +1 qua `POST .../entries/:entryId/rebuy` (ghi log REBUY, an toàn khi nhiều máy bấm cùng lúc). */
  const handleReBuy = useCallback(
    async (index: number) => {
      const entry = entries[index];
      if (!entry) return;

      try {
        if (entry.id) {
          await tourService.rebuyEntry(id, entry.id);
        } else {
          // Dự phòng cho entry chưa có id (dữ liệu cũ): ghi đè cả danh sách.
          const updated = entries.map((e, i) =>
            i === index ? { ...e, reBuyCount: (e.reBuyCount ?? 0) + 1 } : e
          );
          await tourService.updateEntries(id, updated);
        }
        controlMutate();
        toast.success('Re-buy success!');
      } catch (error) {
        console.error(error);
        toast.error(getErrorMessage(error, 'Re-buy failed!'));
      }
    },
    [entries, id, controlMutate]
  );

  /**
   * Lưu thay đổi từ dialog Update Players:
   * xoá từng entry bị bỏ chọn (DELETE) rồi thêm từng player mới (POST) → log ghi rõ từng người.
   * Nếu có entry bị bỏ mà chưa có id (dữ liệu cũ) thì dự phòng ghi đè cả danh sách (PATCH).
   */
  const handleUpdateEntries = useCallback(
    async ({ added, removed, next }: PlayerDialogChanges) => {
      if (!added.length && !removed.length) {
        dialog.onFalse();
        return;
      }

      if (removed.some((e) => !e.id)) {
        try {
          await tourService.updateEntries(id, next);
          controlMutate();
          dialog.onFalse();
          toast.success('Players updated!');
        } catch (error) {
          console.error(error);
          toast.error(getErrorMessage(error, 'Update failed!'));
        }
        return;
      }

      const failed: string[] = [];

      // Gọi tuần tự để log đúng thứ tự và không tranh chấp.
      // eslint-disable-next-line no-restricted-syntax
      for (const entry of removed) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await tourService.removeEntry(id, entry.id!);
        } catch (error) {
          console.error(error);
          failed.push(entry.name || '—');
        }
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const dto of added) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await tourService.addEntry(id, dto);
        } catch (error) {
          console.error(error);
          failed.push(dto.name || '—');
        }
      }

      controlMutate();

      if (failed.length) {
        toast.error(`Could not update: ${failed.join(', ')}`);
      } else {
        dialog.onFalse();
        toast.success('Players updated!');
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

  const handleOpenMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>, index: number) => {
      setMenuIndex(index);
      popover.onOpen(event);
    },
    [popover]
  );

  // Không reset menuIndex khi đóng để menu không đổi nội dung trong lúc đang fade-out.
  const handleCloseMenu = useCallback(() => {
    popover.onClose();
  }, [popover]);

  const handleMenuReBuy = useCallback(() => {
    if (menuIndex === null || !isRegOpen) return;
    const index = menuIndex;
    handleCloseMenu();
    handleReBuy(index);
  }, [menuIndex, isRegOpen, handleCloseMenu, handleReBuy]);

  const handleMenuInfo = useCallback(() => {
    if (menuIndex === null) return;
    setInfoEntry(entries[menuIndex] ?? null);
    handleCloseMenu();
    infoDialog.onTrue();
  }, [menuIndex, entries, handleCloseMenu, infoDialog]);

  const handleMenuAddOn = useCallback(() => {
    if (menuIndex === null) return;
    setAddOnEntry(entries[menuIndex] ?? null);
    handleCloseMenu();
    addOnDialog.onTrue();
  }, [menuIndex, entries, handleCloseMenu, addOnDialog]);

  /**
   * Thêm một lần add-on cho entry đang chọn.
   * Tìm lại entry theo playerId (hoặc tên) trong danh sách MỚI NHẤT, vì danh sách có thể
   * đã đổi thứ tự / cập nhật real-time trong lúc dialog mở. Throw để dialog giữ mở khi lỗi.
   */
  const updateAddOn = useCallback(
    async (
      makeAddOn: (current: number[]) => number[],
      successMessage: string,
      errorMessage: string
    ) => {
      if (!addOnEntry) return;

      const index = entries.findIndex((e) =>
        addOnEntry.playerId != null ? e.playerId === addOnEntry.playerId : e.name === addOnEntry.name
      );
      if (index === -1) {
        toast.error('Player is no longer in this tournament!');
        throw new Error('Entry not found');
      }

      try {
        const updated = entries.map((e, i) =>
          i === index ? { ...e, addOn: makeAddOn(e.addOn ?? []) } : e
        );
        await tourService.updateEntries(id, updated);
        controlMutate();
        toast.success(successMessage);
      } catch (error) {
        console.error(error);
        toast.error(getErrorMessage(error, errorMessage));
        throw error;
      }
    },
    [addOnEntry, entries, id, controlMutate]
  );

  const handleSubmitAddOn = useCallback(
    (chips: number) =>
      updateAddOn((current) => [...current, chips], `Added ${fNumber(chips)} chips!`, 'Add-on failed!'),
    [updateAddOn]
  );

  /** Xoá toàn bộ add-on của entry đang chọn. */
  const handleResetAddOn = useCallback(
    () => updateAddOn(() => [], 'Add-on reset!', 'Reset add-on failed!'),
    [updateAddOn]
  );

  const handleMenuDelete = useCallback(() => {
    if (menuIndex === null) return;
    const index = menuIndex;
    handleCloseMenu();
    handleOpenDelete(index);
  }, [menuIndex, handleCloseMenu, handleOpenDelete]);

  const handleDeleteEntry = useCallback(async () => {
    if (deleteIndex === null) return;

    const entry = entries[deleteIndex];

    try {
      if (entry?.id) {
        // Xoá qua DELETE (ghi log REMOVE, có thể hoàn tác ở tab Log).
        await tourService.removeEntry(id, entry.id);
      } else {
        // Dự phòng cho entry chưa có id (dữ liệu cũ).
        const updated = entries.filter((_, i) => i !== deleteIndex);
        await tourService.updateEntries(id, updated);
      }
      controlMutate();
      confirm.onFalse();
      setDeleteIndex(null);
      toast.success('Delete success!');
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Delete failed!'));
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
            <Table size="small" sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 56 }} />
                  <TableCell>Player Name</TableCell>
                  <TableCell align="right" sx={{ width: 120 }}>
                    Add-on
                  </TableCell>
                  <TableCell align="right" sx={{ width: 120 }}>
                    In Game
                  </TableCell>
                  <TableCell align="right" sx={{ width: 88 }}>
                    Actions
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

                    <TableCell>
                      {entry.name || '—'}
                      {(entry.reBuyCount ?? 0) > 0 && (
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{ ml: 0.5, color: 'text.secondary' }}
                        >
                          ({entry.reBuyCount})
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {sumAddOn(entry.addOn) > 0 ? fNumber(sumAddOn(entry.addOn)) : '—'}
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
                      <IconButton
                        color={popover.open && menuIndex === index ? 'inherit' : 'default'}
                        onClick={(event) => handleOpenMenu(event, index)}
                        disabled={togglingEntry === index}
                      >
                        <Iconify icon="eva:more-vertical-fill" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </Box>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={handleCloseMenu}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem onClick={handleMenuInfo}>
            <Iconify icon="solar:info-circle-bold" />
            Info
          </MenuItem>

          <MenuItem onClick={handleMenuReBuy} disabled={!isRegOpen}>
            <Iconify icon="mingcute:add-line" />
            {isRegOpen ? 'Re-buy' : 'Re-buy (reg closed)'}
          </MenuItem>

          <MenuItem onClick={handleMenuAddOn}>
            <Iconify icon="solar:add-circle-bold" />
            Add-on
          </MenuItem>

          <MenuItem onClick={handleMenuDelete} sx={{ color: 'error.main' }}>
            <Iconify icon="mingcute:delete-2-line" />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <TournamentPlayerInfoDialog
        open={infoDialog.value}
        onClose={infoDialog.onFalse}
        entry={infoEntry}
      />

      <TournamentPlayerAddOnDialog
        open={addOnDialog.value}
        onClose={addOnDialog.onFalse}
        entry={addOnEntry}
        onSubmit={handleSubmitAddOn}
        onReset={handleResetAddOn}
      />

      <TournamentPlayerDialog
        open={dialog.value}
        onClose={dialog.onFalse}
        currentEntries={entries}
        onSave={handleUpdateEntries}
        allowAddNew={isRegOpen}
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
