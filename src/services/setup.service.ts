import type { SetDefaultLevelDto } from './types';

import { apiClient } from './api-client';

// ----------------------------------------------------------------------

export const setupService = {
  /** GET /setup/default-level — Lấy cấu hình level mặc định của người dùng */
  getDefaultLevels: () => apiClient.get('/setup/default-level').then((res) => res.data),

  /** PUT /setup/default-level — Thay thế toàn bộ cấu hình level mặc định */
  setDefaultLevels: (body: SetDefaultLevelDto) =>
    apiClient.put('/setup/default-level', body).then((res) => res.data),
};
