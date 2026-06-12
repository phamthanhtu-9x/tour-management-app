import type { ITournamentItem } from 'src/types/tournament';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useGetTournament } from 'src/actions/tournament';

import { fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  tournamentId?: number;
  /** Dữ liệu sẵn có từ list, hiển thị ngay trong lúc fetch chi tiết. */
  fallback?: ITournamentItem | null;
};

export function TournamentDetailsDialog({ open, onClose, tournamentId, fallback }: Props) {
  const { tournament, tournamentLoading } = useGetTournament(open ? tournamentId : undefined);

  const data = tournament ?? fallback ?? null;

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Tournament details
        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {tournamentLoading && !data ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Stack spacing={2.5} sx={{ py: 1 }}>
            <DetailRow label="ID" value={data ? `#${data.id}` : '—'} />

            <Divider />

            <DetailRow label="Title" value={data?.title || '—'} />

            <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                Description
              </Typography>
              <Typography variant="subtitle2" sx={{ wordBreak: 'break-word' }}>
                {data?.desc || '—'}
              </Typography>
            </Box>

            <DetailRow
              label="Starting stack"
              value={data?.startingStack != null ? data.startingStack.toLocaleString() : '—'}
            />

            <Divider />

            <DetailRow label="Created at" value={fDateTime(data?.createdAt) ?? '—'} />
            <DetailRow label="Updated at" value={fDateTime(data?.updatedAt) ?? '—'} />
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
