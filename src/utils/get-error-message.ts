// ----------------------------------------------------------------------

/**
 * Lấy message lỗi từ response server.
 * Axios interceptor (`src/utils/axios.ts`) reject `error.response.data`, thường có dạng
 * `{ statusCode, message }` với `message` là string hoặc string[] (lỗi validate của NestJS).
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { message?: unknown } | null)?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message) return message;
  return fallback;
}
