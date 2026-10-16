import type { RunningTourItem, RunningTourLevel } from 'src/services/types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { fNumber } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type StatusColor = 'success' | 'warning' | 'default';

const STATUS_CONFIG: Record<string, { label: string; color: StatusColor }> = {
  RUNNING: { label: 'Running', color: 'success' },
  PAUSED: { label: 'Paused', color: 'warning' },
};

/** "200 / 400" cho level BLIND, null nếu là BREAK / thiếu dữ liệu. */
function formatBlinds(level: RunningTourLevel | null): string | null {
  if (!level || level.type === 'BREAK') return null;
  return `${fNumber(level.smallBlind ?? 0)} / ${fNumber(level.bigBlind ?? 0)}`;
}

/** Mô tả ngắn một level: "Break" hoặc "200 / 400 · Ante 400". */
function describeLevel(level: RunningTourLevel | null): string {
  if (!level) return '—';
  if (level.type === 'BREAK') return level.name || 'Break';
  const blinds = formatBlinds(level);
  return level.ante ? `${blinds} · Ante ${fNumber(level.ante)}` : (blinds ?? '—');
}

// ----------------------------------------------------------------------

type Props = {
  tour: RunningTourItem;
  onClick: (tour: RunningTourItem) => void;
};

export function RunningTourCard({ tour, onClick }: Props) {
  const status: { label: string; color: StatusColor } = STATUS_CONFIG[tour.status] ?? {
    label: tour.status || '—',
    color: 'default',
  };
  const isBreak = tour.level?.type === 'BREAK';
  const blinds = formatBlinds(tour.level);

  return (
    <Card sx={{ height: 1 }}>
      <CardActionArea onClick={() => onClick(tour)} sx={{ height: 1, p: 2.5 }}>
        {/* ---- Tên + trạng thái ---- */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="subtitle1" noWrap sx={{ flex: '1 1 auto', minWidth: 0 }}>
            {tour.title || '—'}
          </Typography>
          <Label variant="soft" color={status.color} sx={{ flexShrink: 0 }}>
            {status.label}
          </Label>
        </Box>

        {/* ---- Level hiện tại ---- */}
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {tour.level?.name || `Level ${tour.currentLevel}`} · {tour.currentLevel} /{' '}
          {tour.totalLevels}
        </Typography>

        <Typography
          variant="h4"
          sx={{
            mt: 0.5,
            fontVariantNumeric: 'tabular-nums',
            color: isBreak ? 'info.main' : 'text.primary',
          }}
        >
          {isBreak ? 'Break' : (blinds ?? '—')}
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary', minHeight: 22 }}>
          {!isBreak && tour.level?.ante ? `Ante ${fNumber(tour.level.ante)}` : ' '}
        </Typography>

        <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }} noWrap>
          Next: {tour.nextLevel ? describeLevel(tour.nextLevel) : 'Last level'}
        </Typography>

        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

        {/* ---- Người chơi + đăng ký ---- */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Iconify
              icon="solar:users-group-rounded-bold"
              width={20}
              sx={{ color: 'text.secondary' }}
            />
            <Typography variant="subtitle2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {fNumber(tour.remainingPlayers)} / {fNumber(tour.entriesCount)}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              players
            </Typography>
          </Box>

          <Label variant="soft" color={tour.isRegOpen ? 'info' : 'default'}>
            {tour.isRegOpen ? 'Reg open' : 'Reg closed'}
          </Label>
        </Stack>
      </CardActionArea>
    </Card>
  );
}
