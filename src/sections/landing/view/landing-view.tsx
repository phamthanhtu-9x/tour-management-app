'use client';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

import { LandingFelt } from '../landing-felt';
import { LandingCinematic } from '../landing-cinematic';
import { LandingClockDemo } from '../landing-clock-demo';
import { LandingContactForm } from '../landing-contact-form';
import { LANDING_COLORS as C } from '../landing-tokens';
import { bodyFont, displayFont } from '../landing-fonts';
import { LANDING_CONTACT, LANDING_PRODUCT_NAME } from '../landing-config';

// ----------------------------------------------------------------------

const display = displayFont.style.fontFamily;

const HEADLINE = 'Đồng hồ trên TV, điều khiển trên điện thoại.';
const LEAD = `${LANDING_PRODUCT_NAME} giúp chủ giải poker lên cấu trúc blind, quản lý người chơi, re-buy, add-on và chiếu đồng hồ lên màn hình lớn. Mọi thiết bị luôn hiện cùng một trạng thái.`;

/**
 * Chọn bản mở đầu bằng CSS (không cần JS → không nháy lúc tải):
 * - Desktop (md+) và không bật "giảm chuyển động" → bản điện ảnh.
 * - Còn lại → bản tĩnh.
 */
const CINEMATIC_ONLY = {
  display: { xs: 'none', md: 'block' },
  '@media (prefers-reduced-motion: reduce)': { display: 'none' },
};
const STATIC_ONLY = {
  display: { xs: 'block', md: 'none' },
  '@media (prefers-reduced-motion: reduce)': { display: 'block' },
};

/** Vòng focus rõ ràng cho bàn phím, dùng chung cho nút / link trên nền tối và sáng. */
const focusRing = {
  '&:focus-visible': { outline: `3px solid ${C.gold}`, outlineOffset: 3 },
};

const STAGES = [
  {
    name: 'Trước giải',
    lead: 'Chuẩn bị trong vài phút.',
    items: [
      'Tạo giải với stack khởi điểm và level kết thúc đăng ký.',
      'Lên cấu trúc blind và giờ nghỉ, hoặc dùng mẫu blind mặc định của bạn.',
      'Chọn người chơi từ danh sách CLB, tìm nhanh theo tên hoặc số điện thoại.',
    ],
  },
  {
    name: 'Trong giải',
    lead: 'Điều khiển từ bất kỳ thiết bị nào.',
    items: [
      'Bắt đầu, tạm dừng, chuyển level hay tua 5 giây chỉ với một chạm.',
      'Ghi re-buy, add-on và người bị loại ngay tại bàn.',
      'Tổng chip, stack trung bình và cơ cấu giải thưởng tự tính.',
      'Bấm nhầm? Xem nhật ký thao tác và hoàn tác từng bước.',
    ],
  },
  {
    name: 'Sau giải',
    lead: 'Người chơi tự tra cứu.',
    items: [
      'Ghi điểm tích luỹ cho từng người chơi trong CLB.',
      'Chia sẻ một đường link để người chơi tra điểm bằng tên hoặc số điện thoại, không cần đăng nhập.',
      'Số điện thoại luôn được che khi tra cứu công khai.',
    ],
  },
];

const DEVICES = [
  {
    icon: 'solar:tv-bold',
    name: 'TV hoặc máy chiếu',
    text: 'Đồng hồ toàn màn hình với blind, level tiếp theo, giờ nghỉ và giải thưởng. Chọn nền theo phong cách CLB.',
  },
  {
    icon: 'solar:smartphone-2-bold',
    name: 'Điện thoại',
    text: 'Start, Pause, Next level, re-buy và add-on ngay tại bàn, không cần chạy lại máy chiếu.',
  },
  {
    icon: 'solar:laptop-minimalistic-bold',
    name: 'Máy tính',
    text: 'Quản lý người chơi, cấu trúc blind và theo dõi các giải đang chạy trên Dashboard.',
  },
];

// ----------------------------------------------------------------------

export function LandingView() {
  const { authenticated } = useAuthContext();

  const contacts = [
    LANDING_CONTACT.email && {
      icon: 'solar:letter-bold',
      label: LANDING_CONTACT.email,
      href: `mailto:${LANDING_CONTACT.email}`,
    },
    LANDING_CONTACT.phone && {
      icon: 'solar:phone-bold',
      label: LANDING_CONTACT.phone,
      href: `tel:${LANDING_CONTACT.phone.replace(/[^\d+]/g, '')}`,
    },
    LANDING_CONTACT.zalo && {
      icon: 'solar:chat-round-dots-bold',
      label: `Zalo ${LANDING_CONTACT.zalo}`,
      href: `https://zalo.me/${LANDING_CONTACT.zalo.replace(/\D/g, '')}`,
    },
    LANDING_CONTACT.facebook && {
      icon: 'ic:baseline-facebook',
      label: 'Facebook',
      href: LANDING_CONTACT.facebook,
    },
  ].filter(Boolean) as { icon: string; label: string; href: string }[];

  // ---- Nút chính: liên hệ (khách) / vào dashboard (đã đăng nhập) ----
  const renderPrimaryCta = (size: 'medium' | 'large' = 'large') =>
    authenticated ? (
      <Button
        component={RouterLink}
        href={paths.dashboard.root}
        size={size}
        variant="contained"
        sx={{ bgcolor: C.gold, color: C.wine, '&:hover': { bgcolor: '#E2C277' }, ...focusRing }}
      >
        Vào Dashboard
      </Button>
    ) : (
      <Button
        href="#contact"
        size={size}
        variant="contained"
        sx={{ bgcolor: C.gold, color: C.wine, '&:hover': { bgcolor: '#E2C277' }, ...focusRing }}
      >
        Liên hệ
      </Button>
    );

  return (
    <Box className={bodyFont.className} sx={{ bgcolor: C.paper, color: C.ink, minHeight: '100vh' }}>
      {/* ================= Header + Hero (nền đỏ rượu) ================= */}
      <Box component="header" sx={{ bgcolor: C.wine, color: '#fff' }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              py: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Typography
              component="span"
              sx={{ fontFamily: display, fontWeight: 800, fontSize: { xs: 22, md: 26 } }}
            >
              {LANDING_PRODUCT_NAME}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              {authenticated ? (
                <Button
                  component={RouterLink}
                  href={paths.dashboard.root}
                  variant="outlined"
                  sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', ...focusRing }}
                >
                  Vào Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    component={RouterLink}
                    href={paths.auth.jwt.signIn}
                    sx={{ color: '#fff', ...focusRing }}
                  >
                    Đăng nhập
                  </Button>
                  <Button
                    href="#contact"
                    variant="contained"
                    sx={{
                      bgcolor: C.gold,
                      color: C.wine,
                      '&:hover': { bgcolor: '#E2C277' },
                      ...focusRing,
                    }}
                  >
                    Liên hệ
                  </Button>
                </>
              )}
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* ================= Mở đầu (bản tĩnh): mobile + giảm chuyển động ================= */}
      <Box sx={{ bgcolor: C.wine, color: '#fff', ...STATIC_ONLY }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              pt: { xs: 4, md: 8 },
              pb: { xs: 7, md: 12 },
              display: 'grid',
              gap: { xs: 5, md: 7 },
              alignItems: 'center',
              gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
            }}
          >
            <Box>
              <Typography
                component="h1"
                sx={{
                  fontFamily: display,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  fontSize: { xs: 46, sm: 60, md: 72 },
                  maxWidth: 520,
                }}
              >
                {HEADLINE}
              </Typography>

              <Typography
                sx={{
                  mt: 3,
                  maxWidth: 460,
                  fontSize: { xs: 16, md: 18 },
                  lineHeight: 1.65,
                  color: 'rgba(255,255,255,0.78)',
                }}
              >
                {LEAD}
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
                {renderPrimaryCta()}
                {!authenticated && (
                  <Button
                    component={RouterLink}
                    href={paths.auth.jwt.signIn}
                    size="large"
                    variant="outlined"
                    sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', ...focusRing }}
                  >
                    Đăng nhập
                  </Button>
                )}
              </Stack>
            </Box>

            <LandingClockDemo />
          </Box>
        </Container>
      </Box>

      {/* ================= Mở đầu (bản điện ảnh): desktop, có cuộn ================= */}
      <Box sx={CINEMATIC_ONLY}>
        <LandingCinematic
          headline={HEADLINE}
          lead={LEAD}
          actions={
            <>
              {renderPrimaryCta()}
              {!authenticated && (
                <Button
                  component={RouterLink}
                  href={paths.auth.jwt.signIn}
                  size="large"
                  variant="outlined"
                  sx={{ color: C.ivory, borderColor: 'rgba(244,235,221,0.45)', ...focusRing }}
                >
                  Đăng nhập
                </Button>
              )}
            </>
          }
        />
      </Box>

      <Box component="main">
        {/* ================= Ba giai đoạn của một giải ================= */}
        <Container maxWidth="lg" component="section" sx={{ py: { xs: 8, md: 12 } }}>
          <Typography
            component="h2"
            sx={{
              fontFamily: display,
              fontWeight: 800,
              lineHeight: 1.12,
              fontSize: { xs: 36, md: 48 },
              maxWidth: 640,
            }}
          >
            Theo bạn suốt một giải đấu
          </Typography>

          <Box
            component="ol"
            sx={{
              listStyle: 'none',
              p: 0,
              m: 0,
              mt: { xs: 5, md: 7 },
              display: 'grid',
              gap: { xs: 5, md: 6 },
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            }}
          >
            {STAGES.map((stage) => (
              <Box
                component="li"
                key={stage.name}
                sx={{ borderTop: `3px solid ${C.crimson}`, pt: 3 }}
              >
                <Typography
                  component="h3"
                  sx={{ fontFamily: display, fontWeight: 800, fontSize: 30, lineHeight: 1.15 }}
                >
                  {stage.name}
                </Typography>
                <Typography sx={{ mt: 1, fontWeight: 600, color: C.crimson }}>
                  {stage.lead}
                </Typography>

                <Box component="ul" sx={{ m: 0, mt: 2.5, pl: 2.25, color: C.muted }}>
                  {stage.items.map((item) => (
                    <Box component="li" key={item} sx={{ mb: 1.25, lineHeight: 1.6 }}>
                      {item}
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Container>

        {/* ================= Đồng bộ mọi thiết bị ================= */}
        <Box
          component="section"
          sx={{
            bgcolor: '#fff',
            borderTop: `1px solid ${C.line}`,
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          <Container maxWidth="lg" sx={{ py: { xs: 8, md: 11 } }}>
            <Box
              sx={{
                display: 'grid',
                gap: { xs: 4, md: 8 },
                gridTemplateColumns: { xs: '1fr', md: '4fr 8fr' },
              }}
            >
              <Box>
                <Typography
                  component="h2"
                  sx={{
                    fontFamily: display,
                    fontWeight: 800,
                    lineHeight: 1.12,
                    fontSize: { xs: 36, md: 44 },
                  }}
                >
                  Một người điều khiển, mọi màn hình cùng chạy
                </Typography>
                <Typography sx={{ mt: 2.5, color: C.muted, lineHeight: 1.65, maxWidth: 380 }}>
                  Bấm Pause trên điện thoại, đồng hồ trên TV dừng ngay. Thêm người chơi trên máy
                  tính, số người và stack trung bình trên màn hình lớn cập nhật theo.
                </Typography>
              </Box>

              <Stack spacing={0} divider={<Box sx={{ borderTop: `1px solid ${C.line}` }} />}>
                {DEVICES.map((device) => (
                  <Box
                    key={device.name}
                    sx={{ py: 3, display: 'flex', gap: 2.5, alignItems: 'flex-start' }}
                  >
                    <Iconify
                      icon={device.icon}
                      width={32}
                      sx={{ color: C.crimson, flexShrink: 0, mt: 0.25 }}
                    />
                    <Box>
                      <Typography component="h3" sx={{ fontWeight: 600, fontSize: 18 }}>
                        {device.name}
                      </Typography>
                      <Typography sx={{ mt: 0.5, color: C.muted, lineHeight: 1.6, maxWidth: 560 }}>
                        {device.text}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Container>
        </Box>

        {/* ================= Liên hệ (kết thúc trên nền nỉ) ================= */}
        <Box
          component="section"
          id="contact"
          aria-labelledby="contact-title"
          sx={{ color: '#fff' }}
        >
          <LandingFelt spotlight={false}>
            <Container maxWidth="lg" sx={{ py: { xs: 8, md: 11 } }}>
              <Box
                sx={{
                  display: 'grid',
                  gap: { xs: 5, md: 8 },
                  alignItems: 'start',
                  gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
                }}
              >
                <Box>
                  <Typography
                    id="contact-title"
                    component="h2"
                    sx={{
                      fontFamily: display,
                      fontWeight: 800,
                      lineHeight: 1.12,
                      fontSize: { xs: 38, md: 52 },
                    }}
                  >
                    Liên hệ với chúng tôi
                  </Typography>
                  <Typography
                    sx={{ mt: 2, color: 'rgba(255,255,255,0.78)', maxWidth: 420, lineHeight: 1.65 }}
                  >
                    Muốn dùng {LANDING_PRODUCT_NAME} cho CLB của bạn, hoặc cần hỗ trợ khi chạy giải?
                    Để lại lời nhắn, chúng tôi sẽ trả lời qua email hoặc số điện thoại bạn để lại.
                  </Typography>

                  {contacts.length > 0 && (
                    <Stack spacing={1.5} sx={{ mt: 4 }}>
                      {contacts.map((c) => (
                        <Link
                          key={c.href}
                          href={c.href}
                          target={c.href.startsWith('http') ? '_blank' : undefined}
                          rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          underline="hover"
                          sx={{
                            color: '#fff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            width: 'fit-content',
                            wordBreak: 'break-all',
                            ...focusRing,
                          }}
                        >
                          <Iconify icon={c.icon} width={20} sx={{ color: C.gold, flexShrink: 0 }} />
                          {c.label}
                        </Link>
                      ))}
                    </Stack>
                  )}

                  {authenticated && <Box sx={{ mt: 4 }}>{renderPrimaryCta('medium')}</Box>}
                </Box>

                <LandingContactForm />
              </Box>
            </Container>
          </LandingFelt>
        </Box>
      </Box>

      {/* ================= Footer ================= */}
      <Box
        component="footer"
        sx={{
          bgcolor: C.feltDeep,
          color: 'rgba(255,255,255,0.55)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 3, fontSize: 14 }}>
          © {new Date().getFullYear()} {LANDING_PRODUCT_NAME}
        </Container>
      </Box>
    </Box>
  );
}
