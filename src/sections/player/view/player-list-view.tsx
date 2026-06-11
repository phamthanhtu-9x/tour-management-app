'use client';

import type { IPlayerItem } from 'src/types/player';

import { useState, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { useGetPlayers } from 'src/actions/player';
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

const TABLE_HEAD = [
  { id: 'avatar', label: '', width: 80 },
  { id: 'name', label: 'Name' },
  { id: 'createdAt', label: 'Created at', width: 200 },
  { id: '', label: '', width: 88 },
];

// ----------------------------------------------------------------------

export function PlayerListView() {
  const table = useTable({ defaultOrderBy: 'name', defaultRowsPerPage: 10 });

  const { players, playersTotal, playersLoading, playersEmpty, playersMutate } = useGetPlayers({
    page: table.page + 1,
    limit: table.rowsPerPage,
  });

  const formDialog = useBoolean();
  const detailsDialog = useBoolean();
  const confirm = useBoolean();

  const [selectedPlayer, setSelectedPlayer] = useState<IPlayerItem | null>(null);

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
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleOpenCreate}
            >
              New player
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 640 }}>
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
