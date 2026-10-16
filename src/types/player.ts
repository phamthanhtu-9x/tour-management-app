// ----------------------------------------------------------------------

export type IPlayerItem = {
  id: number;
  name?: string;
  avatar?: string | null;
  /** Điểm của người chơi (số thực, không âm). */
  point?: number | null;
  /** Số điện thoại (server đã chuẩn hoá, bỏ khoảng trắng / dấu chấm / gạch...). */
  phone?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
