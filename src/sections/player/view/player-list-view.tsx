'use client';

import type { IPlayerItem } from 'src/types/player';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useDebounce } from 'src/hooks/use-debounce';

import { getErrorMessage } from 'src/utils/get-error-message';

import { useGetPlayer, useGetPlayers } from 'src/actions/player';
import { playerService } from 'src/services';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { PlayerTableRow } from '../player-table-row';
import { PlayerFormDialog } from '../player-form-dialog';
import { PlayerDetailsDialog } from '../player-details-dialog';

// ----------------------------------------------------------------------

/** Ẩn cột avatar / point / created at trên mobile (< sm) cho bảng gọn hơn. */
const HIDE_ON_MOBILE = { display: { xs: 'none', sm: 'table-cell' } };

const TABLE_HEAD = [
  { id: 'avatar', label: '', width: 80, sx: HIDE_ON_MOBILE },
  { id: 'name', label: 'Name' },
  { id: 'point', label: 'Point', width: 120, align: 'right', sx: HIDE_ON_MOBILE },
  { id: 'createdAt', label: 'Created at', width: 200, sx: HIDE_ON_MOBILE },
  { id: '', label: '', width: 88 },
];

// ----------------------------------------------------------------------

export function PlayerListView() {
  const table = useTable({ defaultOrderBy: 'name', defaultRowsPerPage: 10 });

  // Tìm theo tên (không dấu) hoặc số điện thoại – đợi 300ms sau khi ngừng gõ mới gọi API.
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery.trim(), 300);

  const { onResetPage } = table;
  useEffect(() => {
    onResetPage();
  }, [debouncedSearch, onResetPage]);

  const { players, playersTotal, playersLoading, playersEmpty, playersMutate } = useGetPlayers({
    page: table.page + 1,
    limit: table.rowsPerPage,
    search: debouncedSearch || undefined,
  });

  const formDialog = useBoolean();
  const detailsDialog = useBoolean();
  const confirm = useBoolean();

  const [selectedPlayer, setSelectedPlayer] = useState<IPlayerItem | null>(null);

  // ---- Mở từ link `?edit=<id>` (vd nút Update ở dialog Player info của tournament) ----
  // Đọc query bằng window (không dùng useSearchParams để khỏi cần Suspense boundary).
  const [editId, setEditId] = useState<number | undefined>(undefined);
  const editHandledRef = useRef(false);

  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get('edit'));
    if (Number.isInteger(id) && id > 0) setEditId(id);
  }, []);

  const { player: editPlayer, playerError: editPlayerError } = useGetPlayer(editId);

  useEffect(() => {
    if (editId == null || editHandledRef.current) return;
    if (!editPlayer && !editPlayerError) return; // đang tải

    editHandledRef.current = true;

    // Bỏ `edit` khỏi URL để tải lại trang không mở dialog lần nữa.
    const url = new URL(window.location.href);
    url.searchParams.delete('edit');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);

    if (editPlayer) {
      // Lọc bảng đúng player này (ưu tiên số điện thoại vì không trùng) rồi mở dialog Edit.
      setSearchQuery(editPlayer.phone || editPlayer.name || '');
      setSelectedPlayer(editPlayer);
      formDialog.onTrue();
    } else {
      toast.error('Player not found. It may have been deleted.');
    }
  }, [editId, editPlayer, editPlayerError, formDialog]);

  const handleOpenCreate = useCallback(() => {
    setSelectedPlayer(null);
    formDialog.onTrue();
  }, [formDialog]);

  const handleOpenEdit = useCallback(
    (player: IPlayerItem) => {
      setSelectedPlayer(player);
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleOpenView = useCallback(
    (player: IPlayerItem) => {
      setSelectedPlayer(player);
      detailsDialog.onTrue();
    },
    [detailsDialog]
  );

  const handleOpenDelete = useCallback(
    (player: IPlayerItem) => {
      setSelectedPlayer(player);
      confirm.onTrue();
    },
    [confirm]
  );

  // ---- Xuất Excel ----
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await playerService.exportPlayers(debouncedSearch);
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Export failed!'));
    } finally {
      setExporting(false);
    }
  }, [debouncedSearch]);

  const handleDelete = useCallback(async () => {
    if (!selectedPlayer) return;

    try {
      await playerService.deletePlayer(selectedPlayer.id);
      toast.success('Delete success!');
      confirm.onFalse();
      playersMutate();
    } catch (error) {
      console.error(error);
      toast.error('Delete failed!');
    }
  }, [confirm, playersMutate, selectedPlayer]);

  const notFound = playersEmpty;

  // Server-side pagination: `players` đã là dữ liệu của đúng trang hiện tại.

  return (
    <>
      <DashboardContent maxWidth="xl">
        <CustomBreadcrumbs
          heading="Player"
          links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Player' }]}
          action={
            <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
              {/* Xuất theo đúng từ khoá đang tìm trên màn hình; trống → xuất tất cả */}
              <LoadingButton
                variant="outlined"
                color="inherit"
                loading={exporting}
                startIcon={<Iconify icon="solar:export-bold" />}
                onClick={handleExport}
              >
                Export Excel
              </LoadingButton>
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleOpenCreate}
              >
                New player
              </Button>
            </Stack>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Box sx={{ p: 2.5 }}>
            <TextField
              fullWidth
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value.slice(0, 100))}
              placeholder="Search by name or phone..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: { xs: 0, sm: 640 } }}>
              <TableHeadCustom headLabel={TABLE_HEAD} rowCount={players.length} />

              <TableBody>
                {players.map((row) => (
                  <PlayerTableRow
                    key={row.id}
                    row={row}
                    onView={handleOpenView}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                  />
                ))}

                <TableEmptyRows height={table.dense ? 56 : 76} emptyRows={emptyRows(table.page, table.rowsPerPage, playersTotal)} />

                <TableNoData notFound={notFound && !playersLoading} />
              </TableBody>
            </Table>
          </Scrollbar>

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={playersTotal}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      <PlayerFormDialog
        open={formDialog.value}
        onClose={formDialog.onFalse}
        currentPlayer={selectedPlayer}
        onSuccess={playersMutate}
      />

      <PlayerDetailsDialog
        open={detailsDialog.value}
        onClose={detailsDialog.onFalse}
        playerId={selectedPlayer?.id}
        fallback={selectedPlayer}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong>{selectedPlayer?.name}</strong>?
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </>
  );
}
