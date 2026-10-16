// ----------------------------------------------------------------------

/**
 * Hiển thị số điện thoại dễ đọc. Server lưu số đã chuẩn hoá (chỉ chữ số, +84 → 0):
 * - 10 số bắt đầu bằng 0: `0912 345 678`
 * - 11 số bắt đầu bằng 0: `0912 345 6789`
 * - Dạng khác (số quốc tế, số đã che như `0912***678`...): giữ nguyên.
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';

  if (/^0\d{9}$/.test(phone)) {
    return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  }

  if (/^0\d{10}$/.test(phone)) {
    return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  }

  return phone;
}
