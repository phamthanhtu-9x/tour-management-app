'use client';

import { useEffect, useMemo } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { paths } from 'src/routes/paths';

import { useTabs } from 'src/hooks/use-tabs';
import { useTourSocket } from 'src/hooks/use-tour-socket';

import { useGetTournament } from 'src/actions/tournament';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TournamentDetailsClock } from '../tournament-details-clock';
import { TournamentDetailsControl } from '../tournament-details-control';
import { TournamentDetailsBlind } from '../tournament-details-blind';
import { TournamentDetailsPlayer } from '../tournament-details-player';

// ----------------------------------------------------------------------

const TOURNAMENT_DETAILS_TABS = [
  { label: 'Clock', value: 'clock' },
  { label: 'Control', value: 'control' },
  { label: 'Blind', value: 'blind' },
  { label: 'Player', value: 'player' },
];

// ----------------------------------------------------------------------

type Props = {
  id: number;
};

export function TournamentDetailsView({ id }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const tabs = useTabs('clock');

  const { tournament, tournamentLoading, tournamentMutate } = useGetTournament(id);

  // ---- WebSocket: real-time tour-state + tour-levels ----
  const { tourState, tourLevels, connected } = useTourSocket(id);

  // ---- On mobile: hide Clock tab, auto-switch to Control ----
  useEffect(() => {
    if (isMobile && tabs.value === 'clock') {
      tabs.setValue('control');
    }
  }, [isMobile, tabs]);

  const visibleTabs = useMemo(
    () =>
      isMobile
        ? TOURNAMENT_DETAILS_TABS.filter((t) => t.value !== 'clock')
        : TOURNAMENT_DETAILS_TABS,
    [isMobile]
  );

  const renderTabs = (
    <Tabs value={tabs.value} onChange={tabs.onChange} sx={{ mb: { xs: 3, md: 5 } }}>
      {visibleTabs.map((tab) => (
        <Tab key={tab.value} value={tab.value} label={tab.label} />
      ))}
    </Tabs>
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={tournament?.title || 'Tournament details'}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Tournament', href: paths.dashboard.tournament.root },
          { name: tournament?.title || '...' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {renderTabs}

      {!isMobile && tabs.value === 'clock' && (
        <TournamentDetailsClock
          tournament={tournament}
          loading={tournamentLoading}
          tourState={tourState}
          tourLevels={tourLevels}
          wsConnected={connected}
        />
      )}

      {tabs.value === 'control' && (
        <TournamentDetailsControl
          id={id}
          tournament={tournament}
          tournamentMutate={tournamentMutate}
          tournamentLoading={tournamentLoading}
          tourState={tourState}
          tourLevels={tourLevels}
          wsConnected={connected}
        />
      )}

      {tabs.value === 'blind' && <TournamentDetailsBlind id={id} />}

      {tabs.value === 'player' && <TournamentDetailsPlayer id={id} tourState={tourState} wsConnected={connected} />}
    </DashboardContent>
  );
}
