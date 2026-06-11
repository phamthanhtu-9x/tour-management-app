import { CONFIG } from 'src/config-global';

import { DefaultBlindView } from 'src/sections/default-blind/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Default blind | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <DefaultBlindView />;
}
