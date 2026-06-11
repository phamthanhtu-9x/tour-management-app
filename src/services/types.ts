// Types sinh từ swagger.json (Poker Tour Management API)
// ----------------------------------------------------------------------

/** Tham số phân trang dùng chung */
export type PaginationParams = {
  page?: number;
  limit?: number;
};

// ---------------------------------- Auth ----------------------------------

export type AuthDTO = {
  email: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
};

// ---------------------------------- User ----------------------------------

export type UpdateUserDto = {
  displayName?: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
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

export type UploadResponse = {
  url?: string;
  [key: string]: unknown;
};
