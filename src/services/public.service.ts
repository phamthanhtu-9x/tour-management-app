import { apiClient } from './api-client';

// ----------------------------------------------------------------------

/** API công khai – không cần đăng nhập. */
export const publicService = {
  /**
   * GET /public/users/{slug}/players?search= — Tra cứu người chơi của một user.
   * - search: tên (≥ 2 ký tự, không dấu) hoặc số điện thoại ĐẦY ĐỦ.
   * - Tối đa 20 kết quả, số điện thoại đã che. Giới hạn 30 lần/phút mỗi IP (429).
   */
  searchPlayers: (slug: string, search: string) =>
    apiClient
      .get(`/public/users/${encodeURIComponent(slug)}/players`, { params: { search } })
      .then((res) => res.data),
};
