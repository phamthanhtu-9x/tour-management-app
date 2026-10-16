import { apiClient } from './api-client';

// ----------------------------------------------------------------------

export const dashboardService = {
  /**
   * GET /dashboard/running-tours — Tour đang chạy (gồm cả đang tạm dừng) của người dùng,
   * kèm level/blind hiện tại, level kế tiếp, số người chơi.
   */
  getRunningTours: () => apiClient.get('/dashboard/running-tours').then((res) => res.data),

  /** GET /dashboard/summary — Tổng số tour đã tạo và tổng số player của người dùng. */
  getSummary: () => apiClient.get('/dashboard/summary').then((res) => res.data),
};
