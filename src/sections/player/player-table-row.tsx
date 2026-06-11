import type { IPlayerItem } from 'src/types/player';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { fDate } from 'src/utils/format-time';
import { getFileUrl } from 'src/utils/file-url';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IPlayerItem;
  onView: (player: IPlayerItem) => void;
  onEdit: (player: IPlayerItem) => void;
  onDelete: (player: IPlayerItem) => void;
};

export function PlayerTableRow({ row, onView, onEdit, onDelete }: Props) {
  const popover = usePopover();

  const displayName = row.name || '—';
  const avatarUrl = getFileUrl(row.avatar);

  return (
    <>
      <TableRow>
        <TableCell sx={{ width: 80, pr: 0 }}>
          <Avatar alt={displayName} src={avatarUrl} sx={{ width: 40, height: 40 }}>
            {!avatarUrl ? (displayName[0] ?? '?').toUpperCase() : undefined}
          </Avatar>
        </TableCell>

        <TableCell>
          <Stack spacing={0.5}>
            <Box component="span">{displayName}</Box>
          </Stack>
        </TableCell>

        <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
          {fDate(row.createdAt) ?? '—'}
        </TableCell>

        <TableCell align="right" sx={{ pr: 1 }}>
          <IconButton
            color={popover.open ? 'inherit' : 'default'}
            onClick={popover.onOpen}
          >
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem onClick={() => { popover.onClose(); onView(row); }}>
            <Iconify icon="solar:eye-bold" />
            View
          </MenuItem>

          <MenuItem onClick={() => { popover.onClose(); onEdit(row); }}>
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>

          <MenuItem
            onClick={() => { popover.onClose(); onDelete(row); }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}
