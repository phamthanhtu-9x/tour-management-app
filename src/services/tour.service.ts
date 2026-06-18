import type {
  SetLevelDto,
  InsertTourDto,
  UpdateTourDto,
  UpdateGtdDto,
  UpdateEntriesDto,
  PaginationParams,
} from './types';

import { apiClient } from './api-client';

// ----------------------------------------------------------------------

export const tourService = {
  /** GET /tours — Lấy danh sách tour (có phân trang) */
  getTours: (params?: PaginationParams) =>
    apiClient.get('/tours', { params }).then((res) => res.data),

  /** POST /tours — Tạo mới một tour */
  insertTour: (body: InsertTourDto) => apiClient.post('/tours', body).then((res) => res.data),

  /** GET /tours/{id} — Chi tiết tour */
  getTourById: (id: number) => apiClient.get(`/tours/${id}`).then((res) => res.data),

  /** PATCH /tours/{id} — Cập nhật tour */
  updateTour: (id: number, body: UpdateTourDto) =>
    apiClient.patch(`/tours/${id}`, body).then((res) => res.data),

  /** GET /tours/{id}/levels — Danh sách level của tour */
  getTourLevels: (id: number) => apiClient.get(`/tours/${id}/levels`).then((res) => res.data),

  /** GET /tours/{id}/control — Thông tin điều khiển clock của tour */
  getTourControl: (id: number) => apiClient.get(`/tours/${id}/control`).then((res) => res.data),

  /** DELETE /tours/{id}/delete — Xóa tour */
  deleteTour: (id: number) => apiClient.delete(`/tours/${id}/delete`).then((res) => res.data),

  // ------------------------------- Control -------------------------------

  /** PATCH /tours/{id}/control/start — Bắt đầu chạy clock */
  startClock: (id: number) =>
    apiClient.patch(`/tours/${id}/control/start`).then((res) => res.data),

  /** PATCH /tours/{id}/control/pause — Tạm dừng clock */
  pauseClock: (id: number) =>
    apiClient.patch(`/tours/${id}/control/pause`).then((res) => res.data),

  /** PATCH /tours/{id}/control/resume — Tiếp tục clock */
  resumeClock: (id: number) =>
    apiClient.patch(`/tours/${id}/control/resume`).then((res) => res.data),

  /** PATCH /tours/{id}/control/next — Chuyển sang level kế tiếp */
  nextLevel: (id: number) =>
    apiClient.patch(`/tours/${id}/control/next`).then((res) => res.data),

  /** PATCH /tours/{id}/control/prev — Quay về level trước đó */
  prevLevel: (id: number) =>
    apiClient.patch(`/tours/${id}/control/prev`).then((res) => res.data),

  /** PATCH /tours/{id}/control/set-level — Nhảy tới một level cụ thể */
  setLevel: (id: number, body: SetLevelDto) =>
    apiClient.patch(`/tours/${id}/control/set-level`, body).then((res) => res.data),

  /** PATCH /tours/{id}/control/reset — Reset clock về trạng thái ban đầu */
  resetClock: (id: number) =>
    apiClient.patch(`/tours/${id}/control/reset`).then((res) => res.data),

  /** PATCH /tours/{id}/control/forward — Tua tới 5 giây trong level hiện tại */
  forwardTime: (id: number) =>
    apiClient.patch(`/tours/${id}/control/forward`).then((res) => res.data),

  /** PATCH /tours/{id}/control/rewind — Tua lùi 5 giây trong level hiện tại */
  rewindTime: (id: number) =>
    apiClient.patch(`/tours/${id}/control/rewind`).then((res) => res.data),

  /** PATCH /tours/{id}/control/entries — Cập nhật danh sách entries (người chơi) */
  updateEntries: (id: number, body: UpdateEntriesDto) =>
    apiClient.patch(`/tours/${id}/control/entries`, body).then((res) => res.data),

  /** PATCH /tours/{id}/control/gtd — Cập nhật chuỗi GTD (giải thưởng) của control */
  updateGtd: (id: number, body: UpdateGtdDto) =>
    apiClient.patch(`/tours/${id}/control/gtd`, body).then((res) => res.data),
};
