'use client';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';

import { useTabs } from 'src/hooks/use-tabs';

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
  const tabs = useTabs('clock');

  const { tournament, tournamentLoading } = useGetTournament(id);

  const renderTabs = (
    <Tabs value={tabs.value} onChange={tabs.onChange} sx={{ mb: { xs: 3, md: 5 } }}>
      {TOURNAMENT_DETAILS_TABS.map((tab) => (
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

      {tabs.value === 'clock' && (
        <TournamentDetailsClock tournament={tournament} loading={tournamentLoading} />
      )}

      {tabs.value === 'control' && <TournamentDetailsControl />}

      {tabs.value === 'blind' && <TournamentDetailsBlind />}

      {tabs.value === 'player' && <TournamentDetailsPlayer />}
    </DashboardContent>
  );
}
