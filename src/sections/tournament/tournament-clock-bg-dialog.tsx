'use client';

import type { ClockBackground } from './tournament-clock-backgrounds';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';

import { CLOCK_BACKGROUNDS } from './tournament-clock-backgrounds';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  /** Id nền đang dùng. */
  value: string;
  onChange: (id: string) => void;
  /**
   * Phần tử để gắn dialog vào – truyền khung Clock khi đang fullscreen,
   * vì dialog gắn vào body sẽ không hiện trong chế độ fullscreen.
   */
  container?: HTMLElement | null;
};

export function TournamentClockBgDialog({ open, onClose, value, onChange, container }: Props) {
  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={open}
      onClose={onClose}
      container={container ?? undefined}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Clock background
        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Saved on this device only, for this tournament.
        </Typography>

        <Box
          sx={{
            gap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
          }}
        >
          {CLOCK_BACKGROUNDS.map((bg) => (
            <BackgroundOption
              key={bg.id}
              bg={bg}
              selected={bg.id === value}
              onSelect={() => onChange(bg.id)}
            />
          ))}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

type OptionProps = {
  bg: ClockBackground;
  selected: boolean;
  onSelect: () => void;
};

function BackgroundOption({ bg, selected, onSelect }: OptionProps) {
  return (
    <ButtonBase
      onClick={onSelect}
      aria-pressed={selected}
      sx={{
        p: 0.5,
        width: 1,
        borderRadius: 1.5,
        display: 'block',
        textAlign: 'left',
        border: '2px solid',
        borderColor: selected ? 'primary.main' : 'transparent',
        transition: (theme) => theme.transitions.create('border-color'),
        '&:hover': { borderColor: selected ? 'primary.main' : 'divider' },
      }}
    >
      <Box
        sx={{
          width: 1,
          borderRadius: 1,
          overflow: 'hidden',
          position: 'relative',
          aspectRatio: '16 / 9',
          bgcolor: bg.color,
          ...(bg.thumb && {
            backgroundImage: `url(${bg.thumb})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }),
        }}
      >
        {selected && (
          <Box
            sx={{
              top: 6,
              right: 6,
              width: 24,
              height: 24,
              display: 'flex',
              position: 'absolute',
              borderRadius: '50%',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.contrastText',
              bgcolor: 'primary.main',
            }}
          >
            <Iconify icon="eva:checkmark-fill" width={16} />
          </Box>
        )}
      </Box>

      <Typography variant="body2" sx={{ mt: 0.75, px: 0.5, fontWeight: selected ? 600 : 400 }}>
        {bg.label}
      </Typography>
    </ButtonBase>
  );
}
