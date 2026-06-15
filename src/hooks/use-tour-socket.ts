import type { Socket } from 'socket.io-client';
import type {
  ITourState,
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
};

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
    const socket: Socket<TourServerToClientEvents, TourClientToServerEvents> = io(getWsUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

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
    });

    // Cleanup khi unmount hoặc tourId thay đổi.
    return () => {
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
      error: null,
      connected: true,
    });

    // Join room mới.
    tourIdRef.current = newTourId;
    socket.emit('join-tour', { tourId: newTourId });
  }, []);

  // -------------------------------------------------------

  return { ...state, switchTour };
}
