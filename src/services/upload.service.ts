import type { UploadResponse } from './types';

import { apiClient } from './api-client';

// ----------------------------------------------------------------------

export const uploadService = {
  /** POST /upload — Tải lên một file ảnh (multipart/form-data, mỗi lần 1 file) */
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient
      .post<UploadResponse>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },
};
