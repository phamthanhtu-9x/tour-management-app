import type { ApiResponse, UserProfile, UpdateUserDto } from './types';

import { apiClient } from './api-client';

// ----------------------------------------------------------------------

export const userService = {
  /** GET /users/me — Lấy thông tin người dùng đang đăng nhập */
  getMe: () => apiClient.get<ApiResponse<UserProfile>>('/users/me').then((res) => res.data),

  /** PATCH /users/me — Cập nhật thông tin cá nhân */
  updateProfile: (body: UpdateUserDto) =>
    apiClient.patch<ApiResponse<UserProfile>>('/users/me', body).then((res) => res.data),
};
