// ----------------------------------------------------------------------

/** Lấy tên file từ header Content-Disposition (`attachment; filename="abc.xlsx"`). */
export function getFilenameFromDisposition(header: string | null | undefined): string | null {
  if (!header) return null;

  // Ưu tiên filename*=UTF-8''... (tên có dấu), sau đó filename="..."
  const encoded = header.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
  if (encoded?.[1]) {
    try {
      return decodeURIComponent(encoded[1].trim().replace(/^"|"$/g, ''));
    } catch {
      // bỏ qua, thử dạng thường
    }
  }

  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain?.[1]?.trim() || null;
}

/** Kích hoạt tải một Blob trong trình duyệt. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Thu hồi sau một nhịp để trình duyệt kịp bắt đầu tải.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Lỗi của API trả file: với `responseType: 'blob'`, body lỗi (JSON) cũng là Blob.
 * Đọc ra `{ statusCode, message }` giống các API khác; không đọc được thì trả nguyên lỗi.
 */
export async function parseBlobError(error: unknown): Promise<unknown> {
  if (typeof Blob !== 'undefined' && error instanceof Blob) {
    try {
      return JSON.parse(await error.text());
    } catch {
      return { message: undefined };
    }
  }
  return error;
}
