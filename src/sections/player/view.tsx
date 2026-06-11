'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { varAlpha } from 'src/theme/styles';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function PlayerView() {
  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs heading="Player" links={[{ name: 'Player' }]} sx={{ mb: { xs: 3, md: 5 } }} />

      <Box
        sx={{
          width: 1,
          height: 320,
          borderRadius: 2,
          bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.04),
          border: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
        }}
      />
    </DashboardContent>
  );
}
