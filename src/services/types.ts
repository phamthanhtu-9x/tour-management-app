import type { IUndoState, IEntryLogItem } from 'src/types/tour-socket';

// Types sinh từ swagger.json (Poker Tour Management API)
// ----------------------------------------------------------------------

/** Tham số phân trang dùng chung */
export type PaginationParams = {
  page?: number;
  limit?: number;
};

/** Envelope chuẩn mà backend trả về cho mọi response */
export type ApiResponse<T> = {
  statusCode: number;
  message: string;
  data: T;
};

/** Meta phân trang trong response pagination */
export type PaginationMeta = {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
};

/** Response có phân trang: data chứa items + meta */
export type PaginatedData<T> = {
  items: T[];
  meta: PaginationMeta;
};

// ---------------------------------- Auth ----------------------------------

export type AuthDTO = {
  email: string;
  password: string;
};

/** data của response /auth/login và /auth/register */
export type LoginResponseData = {
  access_token: string;
};

// ---------------------------------- User ----------------------------------

export type UpdateUserDto = {
  displayName?: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
};

/** Thông tin user trả về từ /users/me */
export type UserProfile = {
  id?: number;
  email?: string;
  displayName?: string;
  avatar?: string | null;
  firstName?: string;
  lastName?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

// ---------------------------------- Tour ----------------------------------

export type TourControlEntry = {
  /** uuid do server sinh – dùng cho xoá / rebuy. PHẢI giữ nguyên khi ghi lại entries (PATCH). */
  id?: string;
  /** Id người chơi trong bảng players (không có nếu là khách vãng lai). PHẢI giữ nguyên khi ghi lại entries. */
  playerId?: number;
  name?: string;
  avatar?: string;
  isEliminated?: boolean;
  reBuyCount?: number;
  /** Số chip của từng lần add-on (mỗi phần tử = 1 lần). Mặc định []. PHẢI giữ nguyên khi ghi lại entries. */
  addOn?: number[];
};

export type TourControlData = {
  entries?: TourControlEntry[];
  /** Idx của level đang chạy hiện tại */
  currentLevel?: number;
  /** Clock có đang chạy hay không (true = running, false = paused/chưa start) */
  isRunning?: boolean;
  /** Chuỗi GTD (giải thưởng) dạng "10/5/3/3/1" */
  gtd?: string;
  /** Số giây đã trôi qua của level hiện tại (từ REST control) */
  elapsedSeconds?: number;
  /** Tour đang pause hay không (nếu REST control có trả về). */
  isPaused?: boolean;
  /** Idx của level mà đăng ký kết thúc. null = không giới hạn. */
  regEnd?: number | null;
  /** Đăng ký còn mở hay không (server tính). */
  isRegOpen?: boolean;
  [key: string]: unknown;
};

export type TourLevelType = 'BLIND' | 'BREAK';

export type TourLevelItemDto = {
  name?: string;
  type: TourLevelType;
  idx: number;
  duration: number;
  smallBlind?: number;
  bigBlind?: number;
  ante?: number;
};

export type InsertTourDto = {
  title?: string;
  desc?: string;
  startingStack?: number;
};

export type UpdateTourDto = {
  title?: string;
  desc?: string;
  startingStack?: number;
  /**
   * Idx của level mà thời gian đăng ký (re-entry) kết thúc.
   * Số nguyên >= 1 và <= số level; gửi `null` để bỏ giới hạn.
   */
  regEnd?: number | null;
  /** Danh sách level của tour (nếu có, sẽ thay thế toàn bộ level hiện tại) */
  levels?: TourLevelItemDto[];
};

export type SetLevelDto = {
  /** Số thứ tự (idx) của level muốn nhảy tới */
  level: number;
};

/** Body thêm một entry – `POST /tours/:id/control/entries`. */
export type AddEntryDto = {
  /** Id người chơi (phải thuộc về user hiện tại). Bỏ trống nếu là khách vãng lai. */
  playerId?: number;
  name: string;
  avatar?: string;
  isEliminated?: boolean;
  reBuyCount?: number;
  /** Số chip của từng lần add-on (số nguyên >= 1). */
  addOn?: number[];
};

/** data của `GET /tours/:id/control/entries/logs`. */
export type EntryLogsData = IUndoState & {
  logs: IEntryLogItem[];
};

/** Body cho cập nhật danh sách entries (người chơi) của control */
export type UpdateEntriesDto = TourControlEntry[];

/** Body cho cập nhật chuỗi GTD (giải thưởng) của control */
export type UpdateGtdDto = {
  gtd: string;
};

// ---------------------------------- Setup ----------------------------------

export type DefaultLevelItemDto = {
  name?: string;
  type: TourLevelType;
  idx: number;
  duration: number;
  smallBlind?: number;
  bigBlind?: number;
  ante?: number;
};

export type SetDefaultLevelDto = {
  levels: DefaultLevelItemDto[];
};

// ---------------------------------- Player ----------------------------------

export type InsertPlayerDto = {
  name?: string;
  avatar?: string;
  /** Điểm của người chơi (số thực, không âm). Mặc định 0. */
  point?: number;
};

export type UpdatePlayerDto = {
  name?: string;
  avatar?: string;
  /** Điểm của người chơi (số thực, không âm). */
  point?: number;
};

// ---------------------------------- Upload ----------------------------------

export type UploadFileData = {
  filename?: string;
  originalName?: string;
  mimetype?: string;
  size?: number;
  path?: string;
  [key: string]: unknown;
};

export type UploadResponse = ApiResponse<UploadFileData>;
