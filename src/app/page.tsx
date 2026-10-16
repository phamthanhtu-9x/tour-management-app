import { LandingView } from 'src/sections/landing/view';

// ----------------------------------------------------------------------

export const metadata = {
  title: 'Poker Tour Manager – Đồng hồ và quản lý giải poker',
  description:
    'Lên cấu trúc blind, quản lý người chơi, re-buy, add-on và chiếu đồng hồ giải poker lên màn hình lớn. Mọi thiết bị luôn đồng bộ.',
};

/** Trang chủ công khai (không cần đăng nhập). */
export default function Page() {
  return <LandingView />;
}
