import { Be_Vietnam_Pro, Big_Shoulders_Display } from 'next/font/google';

// ----------------------------------------------------------------------

/** Chữ đứng kiểu bảng điện tử – cho số đồng hồ và tiêu đề. Có dấu tiếng Việt. */
export const displayFont = Big_Shoulders_Display({
  subsets: ['latin', 'vietnamese'],
  weight: ['600', '800'],
  display: 'swap',
});

/** Chữ nội dung. */
export const bodyFont = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600'],
  display: 'swap',
});
