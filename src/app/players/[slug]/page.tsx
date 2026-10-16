import { CONFIG } from 'src/config-global';

import { PublicPlayerSearchView } from 'src/sections/public-player/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Player lookup - ${CONFIG.appName}` };

export const dynamic = CONFIG.isStaticExport ? 'auto' : 'force-dynamic';

// ----------------------------------------------------------------------

type Props = {
  params: { slug: string };
};

export default function Page({ params }: Props) {
  return <PublicPlayerSearchView slug={decodeURIComponent(params.slug)} />;
}
