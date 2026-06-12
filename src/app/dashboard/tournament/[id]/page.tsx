import { CONFIG } from 'src/config-global';

import { TournamentDetailsView } from 'src/sections/tournament/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Tournament details | Dashboard - ${CONFIG.appName}` };

export const dynamic = CONFIG.isStaticExport ? 'auto' : 'force-dynamic';

// ----------------------------------------------------------------------

type Props = {
  params: { id: string };
};

export default function Page({ params }: Props) {
  const { id } = params;

  return <TournamentDetailsView id={Number(id)} />;
}
