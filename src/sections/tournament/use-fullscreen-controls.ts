import type { RefObject } from 'react';

import { useRef, useState, useEffect } from 'react';

// ----------------------------------------------------------------------

/** Thời gian không thao tác trước khi ẩn nút thoát + con trỏ chuột (ms). */
const IDLE_MS = 3000;

const NAV_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

/**
 * Khi đang fullscreen: hiện nút thoát mỗi khi có tương tác (chuột, chạm, phím remote),
 * tự ẩn sau IDLE_MS. Bấm phím mũi tên sẽ focus vào nút để remote TV chọn bằng OK/Enter.
 * Con trỏ chuột trên khung Clock cũng ẩn theo.
 */
export function useFullscreenControls(
  active: boolean,
  containerRef: RefObject<HTMLElement>,
  buttonRef: RefObject<HTMLElement | SVGElement>
) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const container = containerRef.current;

    if (!active || !container) {
      setVisible(false);
      return undefined;
    }

    const show = () => {
      setVisible(true);
      container.style.cursor = '';
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        container.style.cursor = 'none';
        buttonRef.current?.blur();
      }, IDLE_MS);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      show();
      if (NAV_KEYS.includes(event.key)) {
        // Đợi nút hiện ra rồi mới focus
        requestAnimationFrame(() => buttonRef.current?.focus());
      }
    };

    // Mới vào fullscreen: hiện nút một lúc để người dùng biết cách thoát
    show();

    document.addEventListener('mousemove', show);
    document.addEventListener('pointerdown', show);
    document.addEventListener('touchstart', show, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timerRef.current);
      container.style.cursor = '';
      document.removeEventListener('mousemove', show);
      document.removeEventListener('pointerdown', show);
      document.removeEventListener('touchstart', show);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, containerRef, buttonRef]);

  return visible;
}
