import type { IPlayerItem } from 'src/types/player';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useGetPlayer } from 'src/actions/player';

import { fDateTime } from 'src/utils/format-time';
import { getFileUrl } from 'src/utils/file-url';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  playerId?: number;
  /** Dữ liệu sẵn có từ list, hiển thị ngay trong lúc fetch chi tiết. */
  fallback?: IPlayerItem | null;
};

export function PlayerDetailsDialog({ open, onClose, playerId, fallback }: Props) {
  const { player, playerLoading } = useGetPlayer(open ? playerId : undefined);

  const data = player ?? fallback ?? null;

  const displayName = data?.name || '—';
  const avatarUrl = getFileUrl(data?.avatar);

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Player details
        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {playerLoading && !data ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Stack spacing={3} alignItems="center" sx={{ py: 2 }}>
            <Avatar alt={displayName} src={avatarUrl} sx={{ width: 96, height: 96 }}>
              {!avatarUrl ? (displayName[0] ?? '?').toUpperCase() : undefined}
            </Avatar>

            <Stack spacing={2} sx={{ width: 1 }}>
              <DetailRow label="ID" value={data ? `#${data.id}` : '—'} />
              <DetailRow label="Name" value={displayName} />
              <DetailRow label="Created at" value={fDateTime(data?.createdAt) ?? '—'} />
              <DetailRow label="Updated at" value={fDateTime(data?.updatedAt) ?? '—'} />
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="subtitle2" sx={{ textAlign: 'right', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  );
}
