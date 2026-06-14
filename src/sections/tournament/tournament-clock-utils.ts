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
