import type { ApiResponse, PaginatedData, PaginationMeta } from './types';

// ----------------------------------------------------------------------

/**
 * Bóc `data` từ envelope `ApiResponse<T>`.
 * Hỗ trợ cả response đã unwrap (data trực tiếp) và response còn nguyên envelope.
 *
 * @returns `T | null` — null nếu response không có data.
 */
export function extractData<T>(res: unknown): T | null {
  if (res === null || res === undefined) return null;

  // Nếu response là envelope ApiResponse, bóc data
  const data = (res as ApiResponse<T>)?.data;

  // Nếu có data thì trả về data, ngược lại fallback về chính res (đã unwrap)
  return (data !== undefined ? data : res) as T | null;
}

// ----------------------------------------------------------------------

/**
 * Bóc `data.items` từ envelope phân trang `ApiResponse<PaginatedData<T>>`.
 * Hỗ trợ nhiều dạng: envelope đầy đủ, đã unwrap còn `PaginatedData`, hoặc mảng trực tiếp.
 *
 * @returns `T[]` — mảng rỗng nếu không có items.
 */
export function extractItems<T>(res: unknown): T[] {
  if (res === null || res === undefined) return [];

  // Response dạng ApiResponse<PaginatedData<T>>
  const data = (res as ApiResponse<PaginatedData<T>>)?.data;

  if (data) {
    if (Array.isArray(data?.items)) return data.items;
    // Trường hợp data là mảng trực tiếp
    if (Array.isArray(data)) return data;
  }

  // Fallback: response đã unwrap là PaginatedData
  const paginated = res as PaginatedData<T>;
  if (Array.isArray(paginated?.items)) return paginated.items;

  // Fallback cuối: response là mảng trực tiếp
  if (Array.isArray(res)) return res;

  return [];
}

// ----------------------------------------------------------------------

/**
 * Bóc `data.meta` từ envelope phân trang.
 *
 * @returns `PaginationMeta | null` — null nếu không có meta.
 */
export function extractMeta(res: unknown): PaginationMeta | null {
  if (res === null || res === undefined) return null;

  // Response dạng ApiResponse<PaginatedData<T>>
  const data = (res as ApiResponse<PaginatedData<unknown>>)?.data;
  if (data?.meta) return data.meta;

  // Fallback: response đã unwrap là PaginatedData
  const paginated = res as PaginatedData<unknown>;
  if (paginated?.meta) return paginated.meta;

  return null;
}
