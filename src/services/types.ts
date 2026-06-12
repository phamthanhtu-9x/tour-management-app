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
};

export type UpdateTourDto = {
  title?: string;
  desc?: string;
  startingStack?: number;
  /** Idx của level mà thời gian đăng ký (re-entry) kết thúc */
  regEnd?: number;
  /** Danh sách level của tour (nếu có, sẽ thay thế toàn bộ level hiện tại) */
  levels?: TourLevelItemDto[];
};

export type SetLevelDto = {
  /** Số thứ tự (idx) của level muốn nhảy tới */
  level: number;
};

/** Body cho cập nhật danh sách entries (người chơi) của control */
export type UpdateEntriesDto = string[];

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
};

export type UpdatePlayerDto = {
  name?: string;
  avatar?: string;
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
