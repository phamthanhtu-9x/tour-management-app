'use client';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Form, Field } from 'src/components/hook-form';

import { LANDING_COLORS as C } from './landing-tokens';
import { LANDING_CONTACT, LANDING_PRODUCT_NAME } from './landing-config';

// ----------------------------------------------------------------------

export type ContactSchemaType = zod.infer<typeof ContactSchema>;

export const ContactSchema = zod.object({
  name: zod.string().trim().min(1, { message: 'Nhập tên của bạn.' }).max(100),
  reply: zod
    .string()
    .trim()
    .min(1, { message: 'Nhập email hoặc số điện thoại để chúng tôi trả lời.' })
    .max(150),
  message: zod
    .string()
    .trim()
    .min(10, { message: 'Nội dung cần ít nhất 10 ký tự.' })
    .max(2000, { message: 'Nội dung tối đa 2.000 ký tự.' }),
});

// ----------------------------------------------------------------------

/**
 * Form liên hệ của landing page (trang tĩnh, không có backend gửi mail):
 * bấm "Gửi email" sẽ mở ứng dụng email của người dùng với người nhận, tiêu đề và nội dung điền sẵn.
 */
export function LandingContactForm() {
  const methods = useForm<ContactSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(ContactSchema),
    defaultValues: { name: '', reply: '', message: '' },
  });

  const onSubmit = methods.handleSubmit((data) => {
    const subject = `[${LANDING_PRODUCT_NAME}] Liên hệ từ ${data.name}`;
    const body = [
      data.message,
      '',
      '---',
      `Tên: ${data.name}`,
      `Liên hệ lại qua: ${data.reply}`,
    ].join('\n');

    window.location.href = `mailto:${LANDING_CONTACT.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  });

  return (
    <Box
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 2,
        bgcolor: C.paper,
        color: C.ink,
        // Màu cố định cho ô nhập – không theo chế độ sáng/tối của app (landing luôn dùng bảng màu riêng).
        colorScheme: 'light',
        '& .MuiInputBase-root': { bgcolor: '#fff', color: C.ink },
        '& .MuiInputBase-input::placeholder': { color: C.muted, opacity: 1 },
        '& .MuiInputLabel-root': { color: C.muted },
        '& .MuiInputLabel-root.Mui-focused': { color: C.crimson },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#8E7A81' },
        '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.ink },
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: C.crimson,
          borderWidth: 2,
        },
        '& .MuiFormHelperText-root': { color: C.muted },
        '& .MuiInputLabel-root.Mui-error, & .MuiFormHelperText-root.Mui-error': {
          color: '#B3261E',
        },
        '& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline': {
          borderColor: '#B3261E',
        },
      }}
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <Box sx={{ display: 'grid', gap: 2.5 }}>
          <Field.Text name="name" label="Tên của bạn" autoComplete="name" />
          <Field.Text
            name="reply"
            label="Email hoặc số điện thoại"
            autoComplete="email"
            helperText="Để chúng tôi liên hệ lại với bạn."
          />
          <Field.Text
            name="message"
            label="Nội dung"
            multiline
            minRows={4}
            placeholder="Bạn muốn dùng cho CLB nào, khoảng bao nhiêu bàn, cần hỗ trợ gì…"
          />

          <Button
            type="submit"
            size="large"
            variant="contained"
            sx={{
              justifySelf: 'start',
              bgcolor: C.crimson,
              color: '#fff',
              '&:hover': { bgcolor: '#A52A48' },
              '&:focus-visible': { outline: `3px solid ${C.gold}`, outlineOffset: 3 },
            }}
          >
            Gửi email
          </Button>

          <Typography variant="body2" sx={{ color: C.muted }}>
            Nút Gửi email sẽ mở ứng dụng email trên máy bạn với nội dung đã điền sẵn.
          </Typography>
        </Box>
      </Form>
    </Box>
  );
}
