import { useState, useEffect, useCallback } from 'react';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

/** Nền mặc định: màu trơn cũ của màn hình Clock. */
export const DEFAULT_CLOCK_BG_ID = 'default';
export const DEFAULT_CLOCK_BG_COLOR = '#BE3455';

export type ClockBackground = {
  id: string;
  label: string;
  /** Ảnh hiển thị (WebP 3840×2160). null = màu trơn. */
  src: string | null;
  /** Ảnh thu nhỏ cho hộp chọn (WebP 480×270). */
  thumb: string | null;
  /** Màu chủ đạo – nền tạm trong lúc ảnh đang tải. */
  color: string;
};

const BG_DIR = `${CONFIG.assetsDir}/assets/background/tournament-bg`;

const image = (id: string, file: string, label: string, color: string): ClockBackground => ({
  id,
  label,
  src: `${BG_DIR}/${file}.webp`,
  thumb: `${BG_DIR}/thumbs/${file}.webp`,
  color,
});

/**
 * Danh sách nền cho màn hình Clock.
 * Ảnh gốc PNG 4K nằm cùng thư mục; bản .webp và thumbs/ là bản đã tối ưu để hiển thị.
 */
export const CLOCK_BACKGROUNDS: ClockBackground[] = [
  {
    id: DEFAULT_CLOCK_BG_ID,
    label: 'Default',
    src: null,
    thumb: null,
    color: DEFAULT_CLOCK_BG_COLOR,
  },
  image('crimson-rose', 'poker_clock_bg_01_crimson_rose', 'Crimson Rose', '#6B1D2F'),
  image('burgundy-gold', 'poker_clock_bg_02_burgundy_gold', 'Burgundy Gold', '#4D0D1A'),
  image('green-felt', 'poker_clock_bg_03_green_felt', 'Green Felt', '#104729'),
  image('navy-gold', 'poker_clock_bg_04_navy_gold', 'Navy Gold', '#101A36'),
  image('black-gold', 'poker_clock_bg_05_black_gold', 'Black Gold', '#181411'),
  image('royal-purple', 'poker_clock_bg_06_royal_purple', 'Royal Purple', '#32154A'),
  image('neon-night', 'poker_clock_bg_07_neon_night', 'Neon Night', '#110F1B'),
  image('deep-teal', 'poker_clock_bg_08_deep_teal', 'Deep Teal', '#083E44'),
];

export function getClockBackground(id: string | null | undefined): ClockBackground {
  return CLOCK_BACKGROUNDS.find((bg) => bg.id === id) ?? CLOCK_BACKGROUNDS[0];
}

// ----------------------------------------------------------------------

const storageKey = (tourId: number) => `tour-clock-bg:${tourId}`;

/**
 * Nền Clock đã chọn cho một tour – lưu trên trình duyệt của máy này (localStorage),
 * không đồng bộ giữa các thiết bị. Lỗi storage (private mode...) → dùng nền mặc định.
 */
export function useClockBackground(tourId: number | undefined) {
  const [bgId, setBgId] = useState<string>(DEFAULT_CLOCK_BG_ID);

  // Đọc lựa chọn đã lưu sau khi mount (tránh lệch SSR / hydration).
  useEffect(() => {
    if (tourId == null) return;
    try {
      const saved = window.localStorage.getItem(storageKey(tourId));
      setBgId(
        saved && CLOCK_BACKGROUNDS.some((bg) => bg.id === saved) ? saved : DEFAULT_CLOCK_BG_ID
      );
    } catch {
      setBgId(DEFAULT_CLOCK_BG_ID);
    }
  }, [tourId]);

  const changeBackground = useCallback(
    (id: string) => {
      setBgId(id);
      if (tourId == null) return;
      try {
        if (id === DEFAULT_CLOCK_BG_ID) window.localStorage.removeItem(storageKey(tourId));
        else window.localStorage.setItem(storageKey(tourId), id);
      } catch {
        // Không lưu được (storage bị chặn) – vẫn đổi nền cho phiên hiện tại.
      }
    },
    [tourId]
  );

  return { background: getClockBackground(bgId), changeBackground };
}
