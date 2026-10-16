'use client';

import type { PublicPlayerItem } from 'src/services/types';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { getFileUrl } from 'src/utils/file-url';
import { fNumber } from 'src/utils/format-number';

import { extractItems, publicService } from 'src/services';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

/** Ký tự được phép gõ: chữ số, '+' và các ký tự phân cách (server tự bỏ). */
const ALLOWED_CHARS = /[^\d+\s.\-()]/g;
const MAX_INPUT_LENGTH = 20;

/** Bỏ ký tự phân cách → chỉ còn chữ số (và '+' ở đầu). */
const normalizePhone = (value: string) => value.replace(/[\s.\-()]/g, '');

/** Số điện thoại đầy đủ: 8–15 chữ số, có thể có '+' ở đầu (cùng luật với server). */
const PHONE_REGEX = /^\+?\d{8,15}$/;

type SearchError = { status?: number; message: string };

/** Lỗi từ server: axios interceptor reject `error.response.data` = { statusCode, message }. */
function toSearchError(error: unknown): SearchError {
  const e = error as { statusCode?: number; message?: unknown } | null;
  const status = e?.statusCode;
  const raw = Array.isArray(e?.message) ? e?.message.join(', ') : e?.message;

  if (status === 429) {
    return { status, message: 'Too many searches. Please wait a minute and try again.' };
  }
  if (status === 400) {
    return { status, message: typeof raw === 'string' && raw ? raw : 'Invalid search keyword.' };
  }
  return { status, message: 'Something went wrong. Please try again.' };
}

// ----------------------------------------------------------------------

type Props = {
  slug: string;
};

/**
 * Trang công khai: người chơi tự tra cứu thông tin của mình theo tên hoặc số điện thoại.
 * Chỉ gọi API khi bấm Search / Enter (server giới hạn 30 lần/phút mỗi IP).
 */
export function PublicPlayerSearchView({ slug }: Props) {
  const [query, setQuery] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PublicPlayerItem[] | null>(null);
  const [searchedFor, setSearchedFor] = useState('');
  const [resultOpen, setResultOpen] = useState(false);
  const [error, setError] = useState<SearchError | null>(null);
  const [slugNotFound, setSlugNotFound] = useState(false);

  const handleSearch = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault();

      // Chỉ tra cứu theo số điện thoại đầy đủ.
      const keyword = normalizePhone(query.trim());
      if (!PHONE_REGEX.test(keyword)) {
        setInputError('Enter your full phone number (8–15 digits).');
        return;
      }

      setInputError(null);
      setError(null);
      setLoading(true);

      try {
        const res = await publicService.searchPlayers(slug, keyword);
        setResults(extractItems<PublicPlayerItem>(res));
        setSearchedFor(keyword);
        setResultOpen(true);
      } catch (err) {
        console.error(err);
        const parsed = toSearchError(err);
        if (parsed.status === 404) {
          setSlugNotFound(true);
        } else {
          setError(parsed);
        }
      } finally {
        setLoading(false);
      }
    },
    [query, slug]
  );

  if (slugNotFound) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
        <EmptyContent
          filled
          title="Link not found"
          description="This player lookup link does not exist. Please check the link with the organizer."
          sx={{ py: 10 }}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={1} sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4">Player lookup</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Enter your full phone number to see your info.
        </Typography>
      </Stack>

      <Box component="form" onSubmit={handleSearch} noValidate sx={{ display: 'flex', gap: 1.5 }}>
        <TextField
          fullWidth
          autoFocus
          value={query}
          onChange={(e) => {
            // Chỉ nhận chữ số, '+' và ký tự phân cách.
            setQuery(e.target.value.replace(ALLOWED_CHARS, '').slice(0, MAX_INPUT_LENGTH));
            if (inputError) setInputError(null);
          }}
          type="tel"
          autoComplete="tel"
          placeholder="Phone number, e.g. 0912 345 678"
          error={!!inputError}
          helperText={inputError}
          inputProps={{ enterKeyHint: 'search', inputMode: 'tel', 'aria-label': 'Phone number' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="solar:phone-bold" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        <LoadingButton
          type="submit"
          size="large"
          variant="contained"
          loading={loading}
          sx={{ flexShrink: 0, height: 56 }}
        >
          Search
        </LoadingButton>
      </Box>

      {error && (
        <Alert severity={error.status === 429 ? 'warning' : 'error'} sx={{ mt: 3 }}>
          {error.message}
        </Alert>
      )}

      {/* Kết quả tra cứu hiển thị trong dialog */}
      <Dialog fullWidth maxWidth="xs" open={resultOpen} onClose={() => setResultOpen(false)}>
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {results?.length ? 'Player info' : 'No player found'}
          <IconButton aria-label="Close" onClick={() => setResultOpen(false)}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pb: 3 }}>
          {results?.length ? (
            <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
              {results.map((player, index) => (
                <PlayerResultRow key={player.id ?? `${player.name}-${index}`} player={player} />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No player is registered with {searchedFor}. Check the number, or ask the organizer
              which number they saved for you.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}

// ----------------------------------------------------------------------

function PlayerResultRow({ player }: { player: PublicPlayerItem }) {
  const name = player.name || '—';
  const avatarUrl = getFileUrl(player.avatar);

  return (
    <Box sx={{ py: 2, gap: 2, display: 'flex', alignItems: 'center' }}>
      <Avatar alt={name} src={avatarUrl} sx={{ width: 48, height: 48 }}>
        {!avatarUrl ? (name[0] ?? '?').toUpperCase() : undefined}
      </Avatar>

      <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
        <Typography variant="subtitle1" noWrap>
          {name}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {player.phone || '—'}
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          Point
        </Typography>
        <Typography variant="h6" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {fNumber(player.point ?? 0)}
        </Typography>
      </Box>
    </Box>
  );
}
