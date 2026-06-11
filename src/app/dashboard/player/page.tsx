import { CONFIG } from 'src/config-global';

import { PlayerView } from 'src/sections/player/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Player | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <PlayerView />;
}
