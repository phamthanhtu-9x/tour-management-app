'use client';

import type { TourControlEntry } from 'src/services/types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useGetPlayer } from 'src/actions/player';

import { getFileUrl } from 'src/utils/file-url';
import { fNumber } from 'src/utils/format-number';
import { formatPhone } from 'src/utils/format-phone';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  /** Entry đang xem trong tour – dùng `playerId` để gọi GET /players/:id. */
  entry?: TourControlEntry | null;
};

/**
 * Thông tin người chơi của một entry trong tour: tên, avatar, số điện thoại, point.
 * - Có playerId → lấy chi tiết từ `GET /players/:id` (point chỉ có ở đây).
 * - Không có playerId (khách vãng lai) hoặc player đã bị xoá (404) → hiển thị dữ liệu của entry.
 */
export function TournamentPlayerInfoDialog({ open, onClose, entry }: Props) {
  const playerId = entry?.playerId;

  const { player, playerLoading, playerError } = useGetPlayer(open ? playerId : undefined);

  const isGuest = playerId == null;

  const displayName = player?.name || entry?.name || '—';
  const avatarUrl = getFileUrl(player?.avatar ?? entry?.avatar);
  const point = player ? fNumber(player.point ?? 0) : '—';

  /** Chỉ sửa được khi entry có hồ sơ player còn tồn tại. */
  const canUpdate = !isGuest && !!player && !playerError;

  const handleUpdate = () => {
    if (playerId == null) return;
    // Đóng dialog trước khi mở tab mới.
    onClose();
    // KHÔNG dùng 'noopener': token đăng nhập nằm trong sessionStorage, chỉ được chép sang tab mới
    // khi tab đó mở từ tab hiện tại. Cắt liên kết opener ngay sau khi mở cho an toàn.
    const tab = window.open(paths.dashboard.playerEdit(playerId), '_blank');
    if (tab) tab.opener = null;
  };

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Player info
        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {playerLoading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Stack spacing={3} alignItems="center" sx={{ py: 2 }}>
            {isGuest && (
              <Alert severity="info" sx={{ width: 1 }}>
                This entry is not linked to a player profile, so no point is available.
              </Alert>
            )}

            {!isGuest && playerError && (
              <Alert severity="warning" sx={{ width: 1 }}>
                Player profile not found. It may have been deleted.
              </Alert>
            )}

            <Avatar alt={displayName} src={avatarUrl} sx={{ width: 96, height: 96 }}>
              {!avatarUrl ? (displayName[0] ?? '?').toUpperCase() : undefined}
            </Avatar>

            <Stack spacing={2} sx={{ width: 1 }}>
              <InfoRow label="Name" value={displayName} />
              <InfoRow label="Phone" value={formatPhone(player?.phone) || '—'} />
              <InfoRow label="Point" value={point} />
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Close
        </Button>

        {/* Mở trang Player ở tab mới, tự tìm player này và mở dialog Edit */}
        {canUpdate && (
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:pen-bold" />}
            onClick={handleUpdate}
          >
            Update
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        variant="subtitle2"
        sx={{ textAlign: 'right', wordBreak: 'break-word', fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </Typography>
    </Box>
  );
}
