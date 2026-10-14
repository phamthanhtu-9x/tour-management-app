import type { ITourLevelsPayload } from 'src/types/tour-socket';

import { useMemo, useEffect } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useGetTourLevels } from 'src/actions/tournament';

import { mapSocketLevels } from './tournament-clock-utils';
import { TournamentBlindEditForm } from './tournament-blind-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: number;
  /** Real-time levels từ WebSocket (ưu tiên dùng khi connected). */
  tourLevels?: ITourLevelsPayload | null;
  /** WebSocket đã kết nối hay chưa. */
  wsConnected?: boolean;
};

export function TournamentDetailsBlind({ id, tourLevels, wsConnected }: Props) {
  const { levels: restLevels, levelsLoading, levelsMutate } = useGetTourLevels(id);

  // Mỗi lần mở tab: lấy lại levels từ server, tránh sửa trên bản cache cũ.
  useEffect(() => {
    levelsMutate();
  }, [levelsMutate]);

  const hasSocketLevels = !!(wsConnected && tourLevels);

  // Socket ưu tiên (real-time khi thiết bị khác lưu), fallback REST.
  const levels = useMemo(
    () => (hasSocketLevels ? mapSocketLevels(tourLevels!) : restLevels),
    [hasSocketLevels, tourLevels, restLevels]
  );

  if (!hasSocketLevels && levelsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <TournamentBlindEditForm
      tourId={id}
      currentLevels={levels}
      onSaved={() => levelsMutate()}
    />
  );
}
