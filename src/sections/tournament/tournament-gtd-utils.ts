// ----------------------------------------------------------------------

/** Ký hiệu La Mã cho thứ hạng (dùng chung với bảng GTD trên Clock). */
export const GTD_ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export function gtdRankLabel(index: number): string {
  return GTD_ROMAN[index] ?? `${index + 1}`;
}

/** Parse chuỗi GTD "10/5/3/3/1" → [10, 5, 3, 3, 1] (bỏ phần tử không hợp lệ / ≤ 0). */
export function parseGtdRanks(gtd?: string | null): number[] {
  if (!gtd) return [];
  return gtd
    .split('/')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/** [10, 5, 3, 3, 1] → "10/5/3/3/1" */
export function formatGtdRanks(ranks: number[]): string {
  return ranks.join('/');
}

// ----------------------------------------------------------------------

/**
 * Tỉ lệ chia điểm (%) theo số top. Số top tăng theo tổng GTD:
 * < 10 → 3 top, 10–29 → 5 top, 30–59 → 7 top, ≥ 60 → 9 top.
 */
const GTD_TIERS: { minTotal: number; percents: number[] }[] = [
  { minTotal: 60, percents: [30, 18, 13, 10, 8, 6, 5, 5, 5] },
  { minTotal: 30, percents: [35, 20, 14, 10, 8, 7, 6] },
  { minTotal: 10, percents: [45, 23, 14, 10, 8] },
  { minTotal: 0, percents: [50, 30, 20] },
];

/** Chia `total` theo tỉ lệ, làm tròn số nguyên bằng phương pháp phần dư lớn nhất. */
function distribute(total: number, percents: number[]): number[] {
  const sum = percents.reduce((a, b) => a + b, 0);
  const exact = percents.map((p) => (total * p) / sum);
  const result = exact.map(Math.floor);

  let remainder = total - result.reduce((a, b) => a + b, 0);
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);

  for (let k = 0; remainder > 0; k = (k + 1) % order.length, remainder -= 1) {
    result[order[k].i] += 1;
  }

  // Đảm bảo top trên luôn ≥ top dưới
  return result.sort((a, b) => b - a);
}

/**
 * Tự tính cơ cấu GTD từ tổng điểm. Nếu tổng quá nhỏ khiến top cuối = 0 thì giảm số top.
 * Ví dụ: 22 → [10, 5, 3, 2, 2].
 */
export function autoCalculateGtd(total: number): number[] {
  const value = Math.floor(total);
  if (!Number.isFinite(value) || value <= 0) return [];

  const tier = GTD_TIERS.find((t) => value >= t.minTotal) ?? GTD_TIERS[GTD_TIERS.length - 1];

  for (let n = Math.min(tier.percents.length, value); n >= 1; n -= 1) {
    const ranks = distribute(value, tier.percents.slice(0, n));
    if (ranks[ranks.length - 1] >= 1) return ranks;
  }

  return [value];
}
