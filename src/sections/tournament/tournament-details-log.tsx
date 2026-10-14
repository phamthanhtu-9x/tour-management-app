'use client';

import type { EntryLogAction, IEntryLogItem, ITourLogState } from 'src/types/tour-socket';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha } from '@mui/material/styles';

import { fDateTime, fToNow } from 'src/utils/format-time';

import { tourService } from 'src/services';
import { useGetTourControl, useGetTourEntryLogs } from 'src/actions/tournament';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

/** Chu kỳ gọi lại REST log khi mất WebSocket (ms). */
const LOG_POLL_MS = 5000;

const ACTION_CONFIG: Record<
  EntryLogAction,
  { icon: string; color: 'success' | 'error' | 'info' | 'warning' }
> = {
  ADD: { icon: 'solar:user-plus-bold', color: 'success' },
  REMOVE: { icon: 'solar:user-minus-bold', color: 'error' },
  REBUY: { icon: 'solar:restart-bold', color: 'info' },
  BULK_UPDATE: { icon: 'solar:users-group-rounded-bold', color: 'warning' },
};

/** Nội dung hiển thị của một dòng log (tiếng Việt, theo gợi ý trong TOUR_ENTRIES_LOG.md). */
function renderLogMessage(log: IEntryLogItem) {
  const name = <strong>{log.entryName || '—'}</strong>;

  switch (log.action) {
    case 'ADD':
      return <>Đã thêm {name}</>;
    case 'REMOVE':
      return <>Đã xoá {name}</>;
    case 'REBUY':
      return <>{name} rebuy</>;
    case 'BULK_UPDATE':
      return <>Cập nhật danh sách người chơi</>;
    default:
      return <>{log.action}</>;
  }
}

/** Mô tả ngắn (không JSX) cho hộp xác nhận hoàn tác. */
function describeLog(log: IEntryLogItem): string {
  const name = log.entryName || '—';
  switch (log.action) {
    case 'ADD':
      return `Đã thêm ${name}`;
    case 'REMOVE':
      return `Đã xoá ${name}`;
    case 'REBUY':
      return `${name} rebuy`;
    default:
      return 'Cập nhật danh sách người chơi';
  }
}

/** Kết quả nếu hoàn tác một log (bảng "Hoàn tác sẽ…" trong TOUR_ENTRIES_LOG.md). */
function describeUndoEffect(log: IEntryLogItem): string {
  const name = log.entryName || '—';
  switch (log.action) {
    case 'ADD':
      return `${name} sẽ bị xoá khỏi danh sách.`;
    case 'REMOVE':
      return `${name} sẽ được thêm lại vào danh sách.`;
    case 'REBUY':
      return `Số lần rebuy của ${name} sẽ giảm 1.`;
    default:
      return 'Danh sách người chơi sẽ được khôi phục như trước lần cập nhật.';
  }
}

/** Lỗi từ server: axios interceptor reject `error.response.data` = { statusCode, message, details }. */
function parseError(error: unknown): {
  status?: number;
  message?: string;
  blockingLogIds?: number[];
} {
  const e = error as {
    statusCode?: number;
    message?: unknown;
    details?: { blockingLogIds?: number[] };
  } | null;
  const message = Array.isArray(e?.message) ? e?.message.join(', ') : e?.message;

  return {
    status: e?.statusCode,
    message: typeof message === 'string' ? message : undefined,
    blockingLogIds: Array.isArray(e?.details?.blockingLogIds)
      ? e?.details?.blockingLogIds
      : undefined,
  };
}

/** Mục tiêu hoàn tác đang chờ xác nhận: thao tác gần nhất hoặc một log cụ thể. */
type UndoTarget =
  | { kind: 'latest'; log: IEntryLogItem | null }
  | { kind: 'log'; log: IEntryLogItem };

// ----------------------------------------------------------------------

type Props = {
  id: number;
  /** Log real-time từ WebSocket (event `tour-log`). */
  tourLog?: ITourLogState | null;
  /** WebSocket đã kết nối hay chưa. */
  wsConnected?: boolean;
  /** Join lại room để server gửi lại snapshot (dùng khi cần tải lại). */
  onResync?: () => void;
};

export function TournamentDetailsLog({ id, tourLog, wsConnected, onResync }: Props) {
  const hasSocketLog = !!(wsConnected && tourLog?.ready);

  // REST: dự phòng khi chưa có / mất WebSocket.
  const {
    logs: restLogs,
    canUndo: restCanUndo,
    undoableLogIds: restUndoableLogIds,
    logsLoading,
    logsMutate,
  } = useGetTourEntryLogs(id, { refreshInterval: hasSocketLog ? 0 : LOG_POLL_MS });
  const { controlMutate } = useGetTourControl(id);

  // Socket vừa rớt → lấy lại log qua REST ngay.
  useEffect(() => {
    if (!wsConnected) logsMutate();
  }, [wsConnected, logsMutate]);

  const logs = hasSocketLog ? tourLog!.logs : restLogs;
  const canUndo = hasSocketLog ? tourLog!.canUndo : restCanUndo;
  const undoableLogIds = hasSocketLog ? tourLog!.undoableLogIds : restUndoableLogIds;

  const undoableSet = useMemo(() => new Set(undoableLogIds), [undoableLogIds]);

  /** Thao tác "gần nhất": log mới nhất chưa hoàn tác. */
  const latestLog = useMemo(() => logs.find((l) => !l.undoneAt) ?? null, [logs]);

  // Các log đang chặn (từ lỗi 409) – tô sáng; tự hết khi chúng đã được hoàn tác.
  const [blockingIds, setBlockingIds] = useState<number[]>([]);
  const activeBlocking = useMemo(() => {
    const set = new Set(blockingIds);
    return new Set(logs.filter((l) => set.has(l.id) && !l.undoneAt).map((l) => l.id));
  }, [blockingIds, logs]);

  const [target, setTarget] = useState<UndoTarget | null>(null);
  const [undoing, setUndoing] = useState(false);

  const reload = useCallback(() => {
    controlMutate();
    logsMutate();
    onResync?.();
  }, [controlMutate, logsMutate, onResync]);

  const handleConfirmUndo = useCallback(async () => {
    if (!target) return;

    setUndoing(true);
    try {
      if (target.kind === 'log') {
        await tourService.undoEntryLog(id, target.log.id);
      } else {
        await tourService.undoEntries(id);
      }
      // Entries + log tự cập nhật qua tour-state / tour-log; REST làm mới khi không có socket.
      if (!hasSocketLog) reload();
      setBlockingIds([]);
      toast.success('Đã hoàn tác!');
      setTarget(null);
    } catch (error) {
      console.error(error);
      const { status, message, blockingLogIds } = parseError(error);

      if (status === 409 && blockingLogIds?.length) {
        // Bị chặn bởi thao tác phía sau → tô sáng để người dùng hoàn tác chúng trước.
        setBlockingIds(blockingLogIds);
        toast.warning(message || 'Cần hoàn tác các thao tác phía sau trước.');
      } else if (status === 409 || status === 404) {
        toast.warning('Dữ liệu đã thay đổi, đang tải lại…');
        reload();
      } else if (status === 400) {
        // Đã được hoàn tác (thiết bị khác) / không còn gì để hoàn tác – UI tự cập nhật.
        toast.info(message || 'Thao tác này đã được hoàn tác.');
        if (!hasSocketLog) reload();
      } else {
        toast.error(message || 'Hoàn tác thất bại!');
        return; // giữ hộp xác nhận để thử lại
      }
      setTarget(null);
    } finally {
      setUndoing(false);
    }
  }, [target, id, hasSocketLog, reload]);

  const loading = !hasSocketLog && logsLoading;
  const targetLog = target?.log ?? null;

  return (
    <>
      <Card>
        <Box
          sx={{
            p: 2.5,
            gap: 2,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="subtitle1">Nhật ký thao tác người chơi</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Hoàn tác dùng chung cho mọi thiết bị và không thể làm lại. Reset clock sẽ xoá toàn bộ
              nhật ký.
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="solar:undo-left-round-bold" />}
            disabled={!canUndo || undoing}
            onClick={() => setTarget({ kind: 'latest', log: latestLog })}
            sx={{ flexShrink: 0 }}
          >
            Hoàn tác gần nhất
          </Button>
        </Box>

        <Divider />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={28} />
          </Box>
        ) : logs.length === 0 ? (
          <EmptyContent
            title="Chưa có thao tác nào"
            description="Thêm / xoá / rebuy người chơi ở tab Player sẽ được ghi lại tại đây."
            sx={{ py: 8 }}
          />
        ) : (
          <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
            {logs.map((log) => (
              <LogRow
                key={log.id}
                log={log}
                undoable={undoableSet.has(log.id)}
                blocking={activeBlocking.has(log.id)}
                disabled={undoing}
                onUndo={() => setTarget({ kind: 'log', log })}
              />
            ))}
          </Stack>
        )}
      </Card>

      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        title={target?.kind === 'latest' ? 'Hoàn tác thao tác gần nhất' : 'Hoàn tác thao tác'}
        content={
          targetLog ? (
            <>
              Hoàn tác: <strong>{describeLog(targetLog)}</strong>?
              <br />
              {describeUndoEffect(targetLog)} Không thể làm lại sau khi hoàn tác.
            </>
          ) : (
            'Hoàn tác thao tác gần nhất? Không thể làm lại sau khi hoàn tác.'
          )
        }
        action={
          <LoadingButton
            variant="contained"
            color="warning"
            loading={undoing}
            onClick={handleConfirmUndo}
          >
            Hoàn tác
          </LoadingButton>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

type LogRowProps = {
  log: IEntryLogItem;
  /** Server cho phép hoàn tác log này (nằm trong undoableLogIds). */
  undoable: boolean;
  /** Log đang chặn việc hoàn tác log khác (tô sáng sau lỗi 409). */
  blocking: boolean;
  disabled: boolean;
  onUndo: () => void;
};

function LogRow({ log, undoable, blocking, disabled, onUndo }: LogRowProps) {
  const config = ACTION_CONFIG[log.action] ?? ACTION_CONFIG.BULK_UPDATE;
  const undone = !!log.undoneAt;

  return (
    <Box
      sx={{
        px: 2.5,
        py: 1.5,
        gap: 2,
        display: 'flex',
        alignItems: 'center',
        borderLeft: '3px solid',
        borderColor: blocking ? 'warning.main' : 'transparent',
        transition: (theme) => theme.transitions.create(['background-color', 'border-color']),
        ...(blocking && {
          bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
        }),
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          display: 'flex',
          borderRadius: '50%',
          alignItems: 'center',
          justifyContent: 'center',
          color: `${config.color}.main`,
          bgcolor: (theme) => theme.vars.palette[config.color].lighter,
          opacity: undone ? 0.48 : 1,
        }}
      >
        <Iconify icon={config.icon} width={20} />
      </Box>

      <Box sx={{ flex: '1 1 auto', minWidth: 0, opacity: undone ? 0.48 : 1 }}>
        <Typography
          variant="body2"
          sx={{ textDecoration: undone ? 'line-through' : 'none', wordBreak: 'break-word' }}
        >
          {renderLogMessage(log)}
        </Typography>

        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {fToNow(log.createdAt)} · {fDateTime(log.createdAt)}
        </Typography>
      </Box>

      {undone ? (
        <Label
          variant="soft"
          color="default"
          title={`Hoàn tác lúc ${fDateTime(log.undoneAt)}`}
          sx={{ flexShrink: 0 }}
        >
          Đã hoàn tác
        </Label>
      ) : (
        <Tooltip title={undoable ? '' : 'Cần hoàn tác các thao tác phía sau trước'}>
          {/* span để Tooltip vẫn hoạt động khi nút bị disable */}
          <Box component="span" sx={{ flexShrink: 0 }}>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:undo-left-round-bold" width={16} />}
              disabled={!undoable || disabled}
              onClick={onUndo}
            >
              Hoàn tác
            </Button>
          </Box>
        </Tooltip>
      )}
    </Box>
  );
}
