---
name: add-locale
description: Thêm hoặc cập nhật bản dịch i18n cho các ngôn ngữ (vi, en, fr, cn, ar) theo chuẩn locales của Minimals UI. Dùng khi cần thêm chuỗi dịch mới, thêm key navbar, hoặc bổ sung ngôn ngữ (vd "thêm bản dịch tiếng Việt cho menu booking").
---

# Add / Update Locale (i18n)

Thêm hoặc sửa bản dịch. Đọc kèm `.claude/rules/routing-i18n.md`.

## Cấu trúc

```
src/locales/langs/
├── en/{common.json, navbar.json}
├── vi/{common.json, navbar.json}
├── fr/...
├── cn/...
└── ar/...
```

- Ngôn ngữ fallback: `fallbackLng` (hiện là `'en'`) khai trong `src/locales/config-locales.ts`.
- Ngôn ngữ hỗ trợ liệt kê trong `src/locales/all-langs.ts`.

## Đầu vào cần xác nhận

1. Thêm key mới hay sửa key cũ?
2. Key thuộc namespace nào (`common` hay `navbar`)?
3. Bản dịch cho từng ngôn ngữ (ít nhất `vi` và `en`).

## Quy tắc bắt buộc

1. **Đồng bộ key trên MỌI ngôn ngữ** — mỗi key thêm vào `vi` phải có mặt ở `en`, `fr`, `cn`, `ar`. Thiếu key ở một ngôn ngữ sẽ fallback và lệch UI.
2. Giữ nguyên cấu trúc nested JSON hiện có:
   ```json
   {
     "app": "Ứng dụng",
     "blog": { "title": "Blog", "caption": "..." }
   }
   ```
3. Dùng trong component qua hook `useTranslate(ns)` (định nghĩa tại `src/locales/use-locales.ts`):
   ```tsx
   import { useTranslate } from 'src/locales';

   const { t, onChangeLang, currentLang } = useTranslate('navbar');
   t('app');
   ```
   Hook trả về `{ t, i18n, onChangeLang, currentLang }`. Tham số `ns` là namespace (`common` | `navbar`).

## Quy trình thêm ngôn ngữ mới

1. Tạo thư mục `src/locales/langs/<lang>/` với đủ file JSON (`common.json`, `navbar.json`).
2. Copy toàn bộ key từ `en/` rồi dịch.
3. Đăng ký ngôn ngữ trong `all-langs.ts` (value, label, countryCode, adapterLocale, icon, numberFormat...).
4. Kiểm tra `config-locales.ts` (`fallbackLng`, `changeLangMessages`) nếu cần đổi fallback hoặc thêm thông báo đổi ngôn ngữ cho ngôn ngữ mới.

> Các màn hình nghiệp vụ (player, tournament) hiện đang hardcode chuỗi tiếng Anh. Khi chuyển một màn sang i18n, thay chuỗi bằng `t('...')` và thêm key cho đủ 5 ngôn ngữ.

## Kiểm tra cuối

1. So khớp số lượng key giữa các file cùng namespace.
2. `yarn ts` sạch.
3. Đổi ngôn ngữ trên UI, xác nhận chuỗi hiển thị đúng, không lộ key thô.
