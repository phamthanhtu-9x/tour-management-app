'use client';

import type { RunningTourItem } from 'src/services/types';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useGetRunningTours, useGetDashboardSummary } from 'src/actions/dashboard';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { RunningTourCard } from '../running-tour-card';
import { DashboardSummaryCard } from '../dashboard-summary-card';

// ----------------------------------------------------------------------

const GRID_SX = {
  gap: 3,
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
} as const;

/** Trang Dashboard: các tour đang chạy (gồm cả đang tạm dừng). */
export function DashboardView() {
  const router = useRouter();

  const {
    runningTours,
    runningToursTotal,
    runningToursLoading,
    runningToursError,
    runningToursEmpty,
    runningToursMutate,
  } = useGetRunningTours();

  const { summary, summaryLoading } = useGetDashboardSummary();

  const handleClick = useCallback(
    (tour: RunningTourItem) => router.push(paths.dashboard.tournament.details(tour.id)),
    [router]
  );

  const renderContent = () => {
    if (runningToursLoading) {
      return (
        <Box sx={GRID_SX}>
          {[0, 1, 2].map((i) => (
            <Card key={i} sx={{ p: 2.5 }}>
              <Skeleton width="60%" height={28} />
              <Skeleton width="40%" sx={{ mt: 2 }} />
              <Skeleton width="70%" height={44} />
              <Skeleton width="50%" />
              <Skeleton width="100%" height={32} sx={{ mt: 3 }} />
            </Card>
          ))}
        </Box>
      );
    }

    if (runningToursError && !runningTours.length) {
      return (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => runningToursMutate()}>
              Retry
            </Button>
          }
        >
          Could not load running tournaments.
        </Alert>
      );
    }

    if (runningToursEmpty) {
      return (
        <Card>
          <EmptyContent
            title="No tournament is running"
            description="Start a tournament clock and it will show up here."
            action={
              <Button
                component={RouterLink}
                href={paths.dashboard.tournament.root}
                variant="contained"
                sx={{ mt: 3 }}
                startIcon={<Iconify icon="solar:cup-star-bold" />}
              >
                Go to tournaments
              </Button>
            }
            sx={{ py: 10 }}
          />
        </Card>
      );
    }

    return (
      <Box sx={GRID_SX}>
        {runningTours.map((tour) => (
          <RunningTourCard key={tour.id} tour={tour} onClick={handleClick} />
        ))}
      </Box>
    );
  };

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: { xs: 3, md: 5 }, display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
        <Typography variant="h4">Running tournaments</Typography>
        {!runningToursLoading && runningToursTotal > 0 && (
          <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
            ({runningToursTotal})
          </Typography>
        )}
      </Box>

      {renderContent()}

      {/* ---- Thống kê tổng (dưới Running tournaments) ---- */}
      <Box
        sx={{
          mt: { xs: 4, md: 6 },
          gap: 3,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
        }}
      >
        <DashboardSummaryCard
          title="Tournaments"
          value={summary?.totalTours}
          icon="solar:cup-star-bold"
          color="primary"
          href={paths.dashboard.tournament.root}
          loading={summaryLoading}
        />
        <DashboardSummaryCard
          title="Players"
          value={summary?.totalPlayers}
          icon="solar:users-group-rounded-bold"
          color="info"
          href={paths.dashboard.player}
          loading={summaryLoading}
        />
      </Box>
    </DashboardContent>
  );
}
