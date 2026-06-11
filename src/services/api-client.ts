// API client dùng chung cho toàn bộ services.
//
// Dùng lại axios instance tại `src/utils/axios.ts`. Instance này được JWT auth
// context (`src/auth/context/jwt/utils.ts` -> setSession) gắn sẵn header
// `Authorization: Bearer <token>` qua `axios.defaults.headers.common`, nên mọi
// request từ service đều tự động đính kèm token khi người dùng đã đăng nhập.
//
// Base URL lấy từ biến môi trường NEXT_PUBLIC_SERVER_URL (xem file .env).
// ----------------------------------------------------------------------

import axiosInstance from 'src/utils/axios';

// ----------------------------------------------------------------------

export const apiClient = axiosInstance;

export default apiClient;
