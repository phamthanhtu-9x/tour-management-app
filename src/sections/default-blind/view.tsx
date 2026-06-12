'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';

import { useGetDefaultLevels } from 'src/actions/setup';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DefaultBlindEditForm } from './default-blind-edit-form';

// ----------------------------------------------------------------------

export function DefaultBlindView() {
  const { levels, levelsLoading, levelsMutate } = useGetDefaultLevels();

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Default blind"
        links={[{ name: 'Default blind' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {levelsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <DefaultBlindEditForm currentLevels={levels} onSaved={() => levelsMutate()} />
      )}
    </DashboardContent>
  );
}
