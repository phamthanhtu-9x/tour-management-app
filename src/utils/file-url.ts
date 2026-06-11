import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

/**
 * Ghép đường dẫn file tương đối (vd "uploads/abc.jpg") với server URL
 * (`NEXT_PUBLIC_SERVER_URL`) để ra URL đầy đủ hiển thị được.
 *
 * - Trả về `undefined` nếu input rỗng.
 * - Giữ nguyên nếu đã là URL tuyệt đối (http/https) hoặc data URI.
 */
export function getFileUrl(path?: string | null): string | undefined {
  if (!path) return undefined;

  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }

  const base = (CONFIG.serverUrl || '').replace(/\/+$/, '');
  const rel = path.replace(/^\/+/, '');

  return base ? `${base}/${rel}` : `/${rel}`;
}
