'use client';

import type { ITournamentItem } from 'src/types/tournament';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { useGetTournaments } from 'src/actions/tournament';
import { tourService } from 'src/services';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { TablePaginationCustom } from 'src/components/table';

import { TournamentCard } from '../tournament-card';
import { TournamentFormDialog } from '../tournament-form-dialog';

// ----------------------------------------------------------------------

const PAGE_SIZE = 12;

// ----------------------------------------------------------------------

export function TournamentView() {
  const router = useRouter();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZE);

  const { tournaments, tournamentsTotal, tournamentsLoading, tournamentsEmpty, tournamentsMutate } =
    useGetTournaments({ page: page + 1, limit: rowsPerPage });

  const formDialog = useBoolean();
  const confirm = useBoolean();

  const [selectedTournament, setSelectedTournament] = useState<ITournamentItem | null>(null);

  const handleOpenCreate = useCallback(() => {
    setSelectedTournament(null);
    formDialog.onTrue();
  }, [formDialog]);

  const handleOpenEdit = useCallback(
    (tournament: ITournamentItem) => {
      setSelectedTournament(tournament);
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleClickCard = useCallback(
    (tournament: ITournamentItem) => {
      router.push(paths.dashboard.tournament.details(tournament.id));
    },
    [router]
  );

  const handleOpenDelete = useCallback(
    (tournament: ITournamentItem) => {
      setSelectedTournament(tournament);
      confirm.onTrue();
    },
    [confirm]
  );

  const handleDelete = useCallback(async () => {
    if (!selectedTournament) return;

    try {
      await tourService.deleteTour(selectedTournament.id);
      toast.success('Delete success!');
      confirm.onFalse();
      tournamentsMutate();
    } catch (error) {
      console.error(error);
      toast.error('Delete failed!');
    }
  }, [confirm, tournamentsMutate, selectedTournament]);

  return (
    <>
      <DashboardContent maxWidth="xl">
        <CustomBreadcrumbs
          heading="Tournament"
          links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Tournament' }]}
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleOpenCreate}
            >
              New tournament
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        {tournamentsEmpty && !tournamentsLoading ? (
          <Card sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
            No tournament found.
          </Card>
        ) : (
          <Grid container spacing={3}>
            {tournaments.map((tournament) => (
              <Grid key={tournament.id} xs={12} sm={6} md={4} lg={3} sx={{p: 1.5}}>
                <TournamentCard tournament={tournament} onClick={handleClickCard} />
              </Grid>
            ))}
          </Grid>
        )}

        {tournamentsTotal > 0 && (
          <Box sx={{ mt: 3 }}>
            <TablePaginationCustom
              page={page}
              count={tournamentsTotal}
              rowsPerPage={rowsPerPage}
              onPageChange={(_e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[8, 12, 24]}
            />
          </Box>
        )}
      </DashboardContent>

      <TournamentFormDialog
        open={formDialog.value}
        onClose={formDialog.onFalse}
        currentTournament={selectedTournament}
        onSuccess={tournamentsMutate}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong>{selectedTournament?.title}</strong>?
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
