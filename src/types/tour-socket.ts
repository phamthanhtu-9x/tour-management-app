// Types cho WebSocket Tour (real-time tour control + levels).
// Tham chiếu: TOUR_WEBSOCKET.md
// ----------------------------------------------------------------------

/** Một người chơi trong danh sách entries của tour. */
export interface ITourSocketPlayerEntry {
  /**
   * Id người chơi trong bảng players (không có nếu là khách vãng lai).
   * Server kiểm tra playerId tồn tại và thuộc về user khi ghi entries.
   */
  playerId?: number;
  name: string;
  avatar?: string;
  isEliminated: boolean;
  reBuyCount: number;
  /**
   * Số chip của từng lần add-on (mỗi phần tử = 1 lần), ví dụ [10000, 10000].
   * Tổng chip add-on = tổng các phần tử. Mặc định [].
   */
  addOn: number[];
}

// ----------------------------------------------------------------------

/**
 * Trạng thái clock real-time của tour (event `tour-state`).
 * Server push mỗi khi state thay đổi (start, pause, resume, next, prev,
 * set-level, reset, update entries, update gtd).
 */
export interface ITourState {
  /** ID của tour */
  tourId: number;
  /** Level hiện tại (idx, 1-based) */
  currentLevel: number;
  /** Tour đang pause hay đang chạy */
  isPaused: boolean;
  /** Tour đã được start và chưa bị reset hay chưa */
  isRunning: boolean;
  /**
   * Tổng số giây đã trôi trong level hiện tại.
   * QUAN TRỌNG: server tính bằng Date.now() của server, client không tự tính.
   * Mọi thiết bị nhận cùng một giá trị → đồng bộ.
   */
  elapsedSeconds: number;
  /** Tổng số level của tour */
  totalLevels: number;
  /** Danh sách người chơi */
  entries: ITourSocketPlayerEntry[];
  /** Chuỗi GTD (giải thưởng), ví dụ '100/60/40/25/15/10' */
  gtd: string | null;
  /** Idx của level mà đăng ký (re-entry) kết thúc. null = không giới hạn. */
  regEnd: number | null;
  /**
   * Đăng ký còn mở hay không – do SERVER tính:
   * `regEnd === null || currentLevel <= regEnd` (mở tới hết level regEnd).
   */
  isRegOpen: boolean;
}

// ----------------------------------------------------------------------

export type TourSocketLevelType = 'BLIND' | 'BREAK';

/** Một level trong cấu trúc tour (từ event `tour-levels`). */
export interface ITourSocketLevelData {
  id: number;
  /** Tên level, vd 'Level 1', 'Break' */
  name: string | null;
  type: TourSocketLevelType;
  /** Thứ tự (1-based) */
  idx: number;
  /** Thời lượng (phút) */
  duration: number;
  /** Chỉ có với type=BLIND */
  smallBlind: number | null;
  /** Chỉ có với type=BLIND */
  bigBlind: number | null;
  /** Chỉ có với type=BLIND */
  ante: number | null;
}

/** Payload của event `tour-levels`. */
export interface ITourLevelsPayload {
  tourId: number;
  levels: ITourSocketLevelData[];
}

// ----------------------------------------------------------------------

/** Payload của event `tour-error`. */
export interface ITourSocketError {
  message: string;
}

// ----------------------------------------------------------------------

/** Events client gửi lên server. */
export interface TourClientToServerEvents {
  'join-tour': (data: { tourId: number }) => void;
  'leave-tour': (data: { tourId: number }) => void;
}

/** Events server gửi xuống client. */
export interface TourServerToClientEvents {
  'tour-state': (state: ITourState) => void;
  'tour-levels': (payload: ITourLevelsPayload) => void;
  'tour-error': (error: ITourSocketError) => void;
}
