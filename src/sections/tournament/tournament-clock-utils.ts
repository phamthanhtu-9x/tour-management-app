import type { TourLevelItemDto } from 'src/services/types';

// ----------------------------------------------------------------------

/** Format smallBlind/bigBlind/ante thành chuỗi "s/b/a", lược ante nếu = 0. */
export function formatBlinds(level: TourLevelItemDto): string {
  const { smallBlind, bigBlind, ante } = level;
  const sb = smallBlind ?? 0;
  const bb = bigBlind ?? 0;
  const a = ante ?? 0;
  return a > 0 ? `${sb}/${bb}/${a}` : `${sb}/${bb}`;
}

/** Tìm level BLIND kế tiếp (idx > currentIdx, type 'BLIND'), null nếu không có. */
export function findNextBlindLevel(levels: TourLevelItemDto[], currentIdx: number): TourLevelItemDto | null {
  return (
    levels
      .filter((l) => l.type !== 'BREAK' && l.idx > currentIdx)
      .sort((a, b) => a.idx - b.idx)[0] ?? null
  );
}

/** Tìm level kế tiếp bất kể loại (idx > currentIdx), null nếu không có. */
export function findNextLevel(levels: TourLevelItemDto[], currentIdx: number): TourLevelItemDto | null {
  return (
    levels
      .filter((l) => l.idx > currentIdx)
      .sort((a, b) => a.idx - b.idx)[0] ?? null
  );
}

/** Số thứ tự của BLIND level đó trong danh sách BLIND levels (bắt đầu từ 1). */
export function getBlindLevelNumber(level: TourLevelItemDto, allLevels: TourLevelItemDto[]): number | null {
  if (level.type === 'BREAK') return null;
  const blindLevels = allLevels.filter((l) => l.type !== 'BREAK').sort((a, b) => a.idx - b.idx);
  const pos = blindLevels.findIndex((l) => l.idx === level.idx);
  return pos === -1 ? null : pos + 1;
}

/** Chuỗi blinds hiển thị cho một level: 'Break' nếu BREAK, '—' nếu null, ngược lại "s/b/a". */
export function blindsLabel(level: TourLevelItemDto | null | undefined): string {
  if (!level) return '—';
  if (level.type === 'BREAK') return 'Break';
  return formatBlinds(level);
}

/** Trả về label cho current/next level: "Level {n}", "Break", hoặc "—". */
export function levelLabel(level: TourLevelItemDto | null, allLevels: TourLevelItemDto[]): string {
  if (!level) return '—';
  if (level.type === 'BREAK') return 'Break';
  const num = getBlindLevelNumber(level, allLevels);
  return num != null ? `Level ${num}` : '—';
}

/** Trả về blinds string cho một level: "small/big/ante" hoặc "small/big", '' nếu là break, '—' nếu null. */
export function levelBlindsLabel(level: TourLevelItemDto | null): string {
  if (!level) return '—';
  if (level.type === 'BREAK') return '';
  return formatBlinds(level);
}

/**
 * Tính tổng số giây từ thời điểm hiện tại cho tới khi bắt đầu level BREAK gần nhất.
 *
 * - Nếu currentLevel là BLIND: tính từ vị trí elapsed hiện tại → hết level → qua các level trung gian → đến break.
 * - Nếu currentLevel là BREAK: tính từ vị trí elapsed hiện tại → hết break → qua các BLIND → đến break kế tiếp.
 * - Nếu không còn break nào phía sau: trả về null.
 *
 * @param levels      Danh sách tất cả level (đã sắp xếp theo idx).
 * @param currentIdx  idx của level hiện tại.
 * @param elapsedInLevel Số giây đã trôi qua trong level hiện tại.
 * @returns Tổng số giây tới break kế tiếp, hoặc null nếu không có break nào.
 */
export function getSecondsToNextBreak(
  levels: TourLevelItemDto[],
  currentIdx: number,
  elapsedInLevel: number,
): number | null {
  const sorted = [...levels].sort((a, b) => a.idx - b.idx);

  // Tìm level hiện tại
  const currentLevel = sorted.find((l) => l.idx === currentIdx);
  if (!currentLevel) return null;

  const currentDurationSeconds = (currentLevel.duration ?? 0) * 60;

  // Remaining trong level hiện tại
  const remaining = Math.max(0, currentDurationSeconds - elapsedInLevel);

  if (currentLevel.type === 'BREAK') {
    // Đang ở break: cần tìm break kế tiếp sau break hiện tại.
    // Bắt đầu tính từ level ngay sau break hiện tại.
    const startIdx = sorted.indexOf(currentLevel) + 1;
    let total = remaining; // thời gian còn lại của break hiện tại
    for (let i = startIdx; i < sorted.length; i += 1) {
      total += (sorted[i].duration ?? 0) * 60;
      if (sorted[i].type === 'BREAK') {
        // Trả về thời gian tới break đó (không tính duration của break đó)
        return total - (sorted[i].duration ?? 0) * 60;
      }
    }
    return null; // không còn break phía sau
  }

  // Đang ở BLIND: tìm break kế tiếp, cộng dồn duration các level giữa.
  const startIdx = sorted.indexOf(currentLevel) + 1;
  let total = remaining;
  for (let i = startIdx; i < sorted.length; i += 1) {
    const level = sorted[i];
    if (level.type === 'BREAK') {
      return total;
    }
    total += (level.duration ?? 0) * 60;
  }

  return null; // không còn break nào
}

/**
 * Tính tổng số giây từ thời điểm hiện tại cho tới khi kết thúc level đăng ký cuối (regEnd).
 *
 * regEnd là `idx` của level mà sau khi level đó kết thúc thì đăng ký đóng.
 *
 * - Nếu đang ở level trước regEnd: remaining hiện tại + tổng duration các level tới hết regEnd.
 * - Nếu đang ở chính level regEnd: chỉ còn remaining của level đó.
 * - Nếu đã qua regEnd (currentIdx > regEnd): trả về null (đăng ký đã đóng).
 *
 * @param levels      Danh sách tất cả level.
 * @param currentIdx  idx của level hiện tại.
 * @param regEndIdx   idx của level đăng ký cuối (regEnd).
 * @param elapsedInLevel Số giây đã trôi qua trong level hiện tại.
 * @returns Tổng số giây tới khi đăng ký đóng, hoặc null nếu đã đóng / không xác định.
 */
export function getSecondsToRegEnd(
  levels: TourLevelItemDto[],
  currentIdx: number,
  regEndIdx: number | null | undefined,
  elapsedInLevel: number,
): number | null {
  if (regEndIdx == null) return null;

  const sorted = [...levels].sort((a, b) => a.idx - b.idx);

  const currentLevel = sorted.find((l) => l.idx === currentIdx);
  if (!currentLevel) return null;

  // Đã qua regEnd level → đăng ký đã đóng.
  if (currentIdx > regEndIdx) return null;

  const currentDurationSeconds = (currentLevel.duration ?? 0) * 60;
  const remaining = Math.max(0, currentDurationSeconds - elapsedInLevel);

  // Đang ở chính regEnd level → chỉ còn remaining của level này.
  if (currentIdx === regEndIdx) return remaining;

  // Cộng dồn duration các level sau current cho tới hết regEnd level.
  let total = remaining;
  for (let i = 0; i < sorted.length; i += 1) {
    const level = sorted[i];
    if (level.idx > currentIdx && level.idx <= regEndIdx) {
      total += (level.duration ?? 0) * 60;
    }
  }

  return total;
}
