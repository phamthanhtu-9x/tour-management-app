import type { UpdateUserDto } from './types';

import { apiClient } from './api-client';

// ----------------------------------------------------------------------

export const userService = {
  /** GET /users/me — Lấy thông tin người dùng đang đăng nhập */
  getMe: () => apiClient.get('/users/me').then((res) => res.data),

  /** PATCH /users/me — Cập nhật thông tin cá nhân */
  updateProfile: (body: UpdateUserDto) =>
    apiClient.patch('/users/me', body).then((res) => res.data),
};
