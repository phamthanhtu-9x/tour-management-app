import type {
  AddEntryDto,
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

  /**
   * PATCH /tours/{id}/control/entries — Ghi đè toàn bộ entries (log BULK_UPDATE).
   * PHẢI gửi kèm `id` của entry đang có, nếu không server coi là entry mới.
   * Thêm / xoá / rebuy hãy dùng addEntry / removeEntry / rebuyEntry.
   */
  updateEntries: (id: number, body: UpdateEntriesDto) =>
    apiClient.patch(`/tours/${id}/control/entries`, body).then((res) => res.data),

  // ------------------------------- Entries (có log + undo) -------------------------------

  /** POST /tours/{id}/control/entries — Thêm một entry (ghi log ADD) */
  addEntry: (id: number, body: AddEntryDto) =>
    apiClient.post(`/tours/${id}/control/entries`, body).then((res) => res.data),

  /** DELETE /tours/{id}/control/entries/{entryId} — Xoá một entry (ghi log REMOVE) */
  removeEntry: (id: number, entryId: string) =>
    apiClient.delete(`/tours/${id}/control/entries/${entryId}`).then((res) => res.data),

  /** POST /tours/{id}/control/entries/{entryId}/rebuy — Rebuy: +1 reBuyCount (ghi log REBUY) */
  rebuyEntry: (id: number, entryId: string) =>
    apiClient.post(`/tours/${id}/control/entries/${entryId}/rebuy`).then((res) => res.data),

  /** POST /tours/{id}/control/entries/undo — Hoàn tác thao tác entries gần nhất chưa hoàn tác */
  undoEntries: (id: number) =>
    apiClient.post(`/tours/${id}/control/entries/undo`).then((res) => res.data),

  /**
   * POST /tours/{id}/control/entries/logs/{logId}/undo — Hoàn tác đúng một log.
   * 409 + details.blockingLogIds nếu còn thao tác phía sau phụ thuộc chưa hoàn tác.
   */
  undoEntryLog: (id: number, logId: number) =>
    apiClient.post(`/tours/${id}/control/entries/logs/${logId}/undo`).then((res) => res.data),

  /** GET /tours/{id}/control/entries/logs — Log thao tác entries (mới nhất trước) */
  getEntryLogs: (id: number) =>
    apiClient.get(`/tours/${id}/control/entries/logs`).then((res) => res.data),

  /** PATCH /tours/{id}/control/gtd — Cập nhật chuỗi GTD (giải thưởng) của control */
  updateGtd: (id: number, body: UpdateGtdDto) =>
    apiClient.patch(`/tours/${id}/control/gtd`, body).then((res) => res.data),
};
