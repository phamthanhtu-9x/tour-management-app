import type { AuthDTO, ApiResponse, LoginResponseData } from './types';

import { apiClient } from './api-client';

// ----------------------------------------------------------------------

export const authService = {
  /** POST /auth/register */
  register: (body: AuthDTO) =>
    apiClient
      .post<ApiResponse<LoginResponseData>>('/auth/register', body)
      .then((res) => res.data),

  /** POST /auth/login */
  login: (body: AuthDTO) =>
    apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', body).then((res) => res.data),
};
