import type { Socket } from 'socket.io-client';
import type {
  ITourState,
  TourLogEvent,
  ITourLogState,
  ITourLevelsPayload,
  ITourSocketError,
  TourClientToServerEvents,
  TourServerToClientEvents,
} from 'src/types/tour-socket';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

import { CONFIG } from 'src/config-global';
import { STORAGE_KEY } from 'src/auth/context/jwt/constant';

// ----------------------------------------------------------------------

/** Lấy JWT token từ sessionStorage (do auth context quản lý). */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------------

/**
 * WebSocket URL (namespace /tour) – suy từ REST server URL.
 *
 * Nếu NEXT_PUBLIC_SERVER_URL = 'http://localhost:3002'
 *   → WS URL = 'http://localhost:3002/tour' (Socket.IO tự chọn ws/wss).
 *
 * Nếu cần override, đặt NEXT_PUBLIC_WS_URL trong .env.
 */
function getWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  const base = CONFIG.serverUrl || 'http://localhost:3002';
  return `${base}/tour`;
}

// ----------------------------------------------------------------------

export type TourSocketState = {
  /** Trạng thái clock hiện tại (từ event `tour-state`). */
  tourState: ITourState | null;
  /** Danh sách level hiện tại (từ event `tour-levels`). */
  tourLevels: ITourLevelsPayload | null;
  /** Log thao tác entries (event `tour-log`), mới nhất trước. */
  tourLog: ITourLogState;
  /** Lỗi từ server (event `tour-error`). */
  error: string | null;
  /** Socket đã kết nối thành công tới namespace /tour. */
  connected: boolean;
};

// ----------------------------------------------------------------------

export type UseTourSocketReturn = TourSocketState & {
  /**
   * Tham gia room của một tour khác – dùng khi component re-render với
   * tourId mới (navigation giữa các tour trong cùng page).
   */
  switchTour: (tourId: number) => void;
  /**
   * Join lại room hiện tại để server gửi lại snapshot (tour-state, tour-levels, tour-log).
   * Dùng khi dữ liệu có thể lệch, vd undo bị 409.
   */
  resync: () => void;
};

// ----------------------------------------------------------------------

const EMPTY_LOG: ITourLogState = { logs: [], canUndo: false, undoableLogIds: [], ready: false };

/** Áp event `tour-log` vào state log (theo reducer mẫu trong TOUR_ENTRIES_LOG.md). */
function applyLogEvent(state: ITourLogState, ev: TourLogEvent): ITourLogState {
  // Mọi event đều kèm trạng thái hoàn tác mới nhất.
  const undo = {
    canUndo: !!ev.canUndo,
    undoableLogIds: ev.undoableLogIds ?? [],
    ready: true,
  };

  switch (ev.type) {
    case 'snapshot':
      return { logs: ev.logs, ...undo };
    case 'created':
      return { logs: [ev.log, ...state.logs], ...undo };
    case 'undone':
      return { logs: state.logs.map((l) => (l.id === ev.log.id ? ev.log : l)), ...undo };
    case 'reset':
      return { logs: [], ...undo };
    default:
      return state;
  }
}

// ----------------------------------------------------------------------

/**
 * Kết nối WebSocket tới namespace /tour để nhận real-time:
 *   - `tour-state`:   trạng thái clock (currentLevel, isPaused, elapsedSeconds...)
 *   - `tour-levels`:  danh sách level (BLIND / BREAK)
 *   - `tour-error`:   lỗi auth / quyền / không tồn tại
 *
 * @param tourId – ID của tour cần theo dõi. Truyền `undefined` để không kết nối.
 *
 * @example
 * ```tsx
 * const { tourState, tourLevels, connected, error } = useTourSocket(tourId);
 * ```
 */
export function useTourSocket(tourId: number | undefined): UseTourSocketReturn {
  const [state, setState] = useState<TourSocketState>({
    tourState: null,
    tourLevels: null,
    tourLog: EMPTY_LOG,
    error: null,
    connected: false,
  });

  const socketRef = useRef<Socket<TourServerToClientEvents, TourClientToServerEvents> | null>(null);

  // Giữ currentTourId trong ref để callback reconnect có giá trị mới nhất.
  const tourIdRef = useRef(tourId);
  tourIdRef.current = tourId;

  // -------------------------------------------------------
  // Khởi tạo / huỷ socket
  // -------------------------------------------------------
  useEffect(() => {
    if (tourId == null) {
      // Không có tourId → không kết nối.
      return;
    }

    const token = getToken();

    // eslint-disable-next-line no-console
    console.log('[tour-socket] init', {
      tourId,
      wsUrl: getWsUrl(),
      hasToken: !!token,
      tokenPreview: token ? `${token.slice(0, 12)}...` : null,
    });

    if (!token) {
      // eslint-disable-next-line no-console
      console.warn('[tour-socket] NO TOKEN in sessionStorage → không kết nối');
      setState((s) => ({ ...s, error: 'Vui lòng đăng nhập', connected: false }));
      return;
    }

    // Tạo socket mới.
    // - auth dạng function: mỗi lần (re)connect đều đọc token mới nhất từ sessionStorage.
    // - Không giới hạn số lần reconnect: thiết bị mất mạng lâu vẫn tự nối lại.
    const socket: Socket<TourServerToClientEvents, TourClientToServerEvents> = io(getWsUrl(), {
      auth: (cb) => cb({ token: getToken() ?? '' }),
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    // Timer cho lần reconnect thủ công (khi server chủ động ngắt).
    let manualReconnectTimer: ReturnType<typeof setTimeout> | null = null;

    /** Kết nối lại thủ công nếu socket đang ngắt và còn token. */
    const reconnectIfNeeded = () => {
      if (socket.connected || socket.active || !getToken()) return;
      socket.connect();
    };

    socketRef.current = socket;

    // -------- connect --------
    socket.on('connect', () => {
      // eslint-disable-next-line no-console
      console.log('[tour-socket] ✅ connected', socket.id);
      setState((s) => ({ ...s, connected: true, error: null }));
      // Join room của tour hiện tại → server gửi ngay snapshot.
      socket.emit('join-tour', { tourId: tourIdRef.current! });
    });

    // -------- connect_error --------
    socket.on('connect_error', (err) => {
      // eslint-disable-next-line no-console
      console.error('[tour-socket] ❌ connect_error:', err.message, err);
      setState((s) => ({ ...s, connected: false, error: err.message }));
    });

    // -------- tour-state --------
    socket.on('tour-state', (payload: ITourState) => {
      // eslint-disable-next-line no-console
      console.log('[tour-socket] tour-state', payload);
      setState((s) => ({
        ...s,
        tourState: payload,
        error: null,
      }));
    });

    // -------- tour-levels --------
    socket.on('tour-levels', (payload: ITourLevelsPayload) => {
      // eslint-disable-next-line no-console
      console.log('[tour-socket] tour-levels', payload);
      setState((s) => ({
        ...s,
        tourLevels: payload,
      }));
    });

    // -------- tour-log --------
    // Listener đăng ký trước khi connect/join-tour nên không lỡ event `snapshot`.
    socket.on('tour-log', (ev: TourLogEvent) => {
      if (ev.tourId !== tourIdRef.current) return;
      setState((s) => ({ ...s, tourLog: applyLogEvent(s.tourLog, ev) }));
    });

    // -------- tour-error --------
    socket.on('tour-error', (err: ITourSocketError) => {
      // eslint-disable-next-line no-console
      console.error('[tour-socket] tour-error:', err.message);
      setState((s) => ({ ...s, error: err.message }));
    });

    // -------- disconnect --------
    socket.on('disconnect', (reason) => {
      // eslint-disable-next-line no-console
      console.warn('[tour-socket] disconnect:', reason);
      setState((s) => ({ ...s, connected: false }));

      // Server chủ động ngắt (vd token hết hạn) → Socket.IO KHÔNG tự reconnect.
      // Thử lại sau 3s với token mới nhất (auth function đọc lại sessionStorage).
      if (reason === 'io server disconnect') {
        if (manualReconnectTimer) clearTimeout(manualReconnectTimer);
        manualReconnectTimer = setTimeout(reconnectIfNeeded, 3000);
      }
    });

    // Tab / màn hình quay lại foreground hoặc có mạng lại → nối lại ngay nếu đang ngắt.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') reconnectIfNeeded();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', reconnectIfNeeded);

    // Cleanup khi unmount hoặc tourId thay đổi.
    return () => {
      if (manualReconnectTimer) clearTimeout(manualReconnectTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', reconnectIfNeeded);
      if (socket.connected) {
        socket.emit('leave-tour', { tourId: tourIdRef.current! });
      }
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [tourId]);

  // -------------------------------------------------------
  // switchTour – chuyển sang room tour khác mà không tạo
  // socket mới (dùng khi navigate giữa các tour trong cùng page).
  // -------------------------------------------------------
  const switchTour = useCallback((newTourId: number) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    // Rời room cũ.
    if (tourIdRef.current != null) {
      socket.emit('leave-tour', { tourId: tourIdRef.current });
    }

    // Reset state để không hiển thị data cũ trong lúc chờ snapshot.
    setState({
      tourState: null,
      tourLevels: null,
      tourLog: EMPTY_LOG,
      error: null,
      connected: true,
    });

    // Join room mới.
    tourIdRef.current = newTourId;
    socket.emit('join-tour', { tourId: newTourId });
  }, []);

  // -------------------------------------------------------

  const resync = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected || tourIdRef.current == null) return;
    socket.emit('join-tour', { tourId: tourIdRef.current });
  }, []);

  return { ...state, switchTour, resync };
}
