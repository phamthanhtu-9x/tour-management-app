// ----------------------------------------------------------------------

export type IPlayerItem = {
  id: number;
  name?: string;
  avatar?: string | null;
  /** Điểm của người chơi (số thực, không âm). */
  point?: number | null;
  createdAt?: string;
  updatedAt?: string;
};
