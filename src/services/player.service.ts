import type { InsertPlayerDto, UpdatePlayerDto, PlayerListParams } from './types';

import { downloadBlob, parseBlobError, getFilenameFromDisposition } from 'src/utils/download-blob';

import { apiClient } from './api-client';

// ----------------------------------------------------------------------

export const playerService = {
  /** GET /players — Danh sách người chơi (phân trang, `search` theo tên hoặc số điện thoại) */
  getPlayers: (params?: PlayerListParams) =>
    apiClient.get('/players', { params }).then((res) => res.data),

  /** POST /players — Tạo mới một người chơi */
  insertPlayer: (body: InsertPlayerDto) =>
    apiClient.post('/players', body).then((res) => res.data),

  /** GET /players/{id} — Chi tiết người chơi */
  getPlayerById: (id: number) => apiClient.get(`/players/${id}`).then((res) => res.data),

  /** PATCH /players/{id} — Cập nhật người chơi */
  updatePlayer: (id: number, body: UpdatePlayerDto) =>
    apiClient.patch(`/players/${id}`, body).then((res) => res.data),

  /**
   * GET /players/export?search= — Xuất danh sách player ra file .xlsx (không phân trang)
   * rồi tải xuống. Có `search` → chỉ xuất player khớp (cùng quy tắc tìm kiếm với danh sách).
   * Lỗi được ném ra ở dạng `{ statusCode, message }` như các API khác.
   */
  exportPlayers: async (search?: string) => {
    const keyword = search?.trim();
    try {
      const res = await apiClient.get('/players/export', {
        params: keyword ? { search: keyword } : undefined,
        responseType: 'blob', // BẮT BUỘC – server trả file trực tiếp
      });

      const filename =
        getFilenameFromDisposition(res.headers['content-disposition']) ??
        'danh-sach-player.xlsx';

      downloadBlob(res.data as Blob, filename);
      return filename;
    } catch (error) {
      // Interceptor axios reject `error.response.data` – ở đây là Blob chứa JSON lỗi.
      throw await parseBlobError(error);
    }
  },

  /** DELETE /players/{id}/delete — Xóa người chơi */
  deletePlayer: (id: number) =>
    apiClient.delete(`/players/${id}/delete`).then((res) => res.data),
};
