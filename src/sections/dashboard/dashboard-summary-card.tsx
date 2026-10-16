import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { RouterLink } from 'src/routes/components';

import { fNumber } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  title: string;
  /** null/undefined → hiển thị "—". */
  value?: number | null;
  icon: string;
  color: 'primary' | 'info' | 'success' | 'warning';
  href: string;
  loading?: boolean;
};

/** Ô thống kê trên trang Dashboard – bấm để mở trang danh sách tương ứng. */
export function DashboardSummaryCard({ title, value, icon, color, href, loading }: Props) {
  return (
    <Card>
      <CardActionArea
        component={RouterLink}
        href={href}
        sx={{ p: 3, gap: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            flexShrink: 0,
            display: 'flex',
            borderRadius: 1.5,
            alignItems: 'center',
            justifyContent: 'center',
            color: `${color}.main`,
            bgcolor: (theme) => theme.vars.palette[color].lighter,
          }}
        >
          <Iconify icon={icon} width={32} />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            {title}
          </Typography>

          {loading ? (
            <Skeleton width={64} height={44} />
          ) : (
            <Typography variant="h3" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {value != null ? fNumber(value) : '—'}
            </Typography>
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
}
