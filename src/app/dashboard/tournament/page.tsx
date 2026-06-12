import { CONFIG } from 'src/config-global';

import { TournamentView } from 'src/sections/tournament/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Tournament | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <TournamentView />;
}
