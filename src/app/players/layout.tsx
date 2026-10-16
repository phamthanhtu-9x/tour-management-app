import { SimpleLayout } from 'src/layouts/simple';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

/** Trang công khai (không cần đăng nhập) – không bọc AuthGuard. */
export default function Layout({ children }: Props) {
  return <SimpleLayout>{children}</SimpleLayout>;
}
