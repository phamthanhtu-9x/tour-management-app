import type { InsertPlayerDto, UpdatePlayerDto, PaginationParams } from './types';

import { apiClient } from './api-client';

// ----------------------------------------------------------------------

export const playerService = {
  /** GET /players — Lấy danh sách người chơi (có phân trang) */
  getPlayers: (params?: PaginationParams) =>
    apiClient.get('/players', { params }).then((res) => res.data),

  /** POST /players — Tạo mới một người chơi */
  insertPlayer: (body: InsertPlayerDto) =>
    apiClient.post('/players', body).then((res) => res.data),

  /** GET /players/{id} — Chi tiết người chơi */
  getPlayerById: (id: number) => apiClient.get(`/players/${id}`).then((res) => res.data),

  /** PATCH /players/{id} — Cập nhật người chơi */
  updatePlayer: (id: number, body: UpdatePlayerDto) =>
    apiClient.patch(`/players/${id}`, body).then((res) => res.data),

  /** DELETE /players/{id}/delete — Xóa người chơi */
  deletePlayer: (id: number) =>
    apiClient.delete(`/players/${id}/delete`).then((res) => res.data),
};
