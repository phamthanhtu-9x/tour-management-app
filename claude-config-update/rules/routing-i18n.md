# Routing & i18n

## Routing

### Paths tập trung – `src/routes/paths.ts`

Mọi đường dẫn khai báo trong object `paths`. Không hardcode string path ở nơi khác.

```ts
// ĐÚNG
router.push(paths.dashboard.tournament.details(tournament.id));

// SAI
router.push(`/dashboard/tournament/${id}`);
```

### Cấu trúc paths (thực tế dự án)

```ts
dashboard: {
  root: ROOTS.DASHBOARD,
  // Feature chỉ có 1 màn list (tạo/sửa bằng dialog) → string
  player: `${ROOTS.DASHBOARD}/player`,
  defaultBlind: `${ROOTS.DASHBOARD}/default-blind`,
  // Feature có trang chi tiết → object
  tournament: {
    root: `${ROOTS.DASHBOARD}/tournament`,
    details: (id: number) => `${ROOTS.DASHBOARD}/tournament/${id}`,
  },
},
```

- Feature mới chỉ có list → khai báo string. Có trang chi tiết / trang con → object với `root` + hàm `(id: number) => ...`.
- id kiểu `number` (theo backend).
- Không thêm `demo` / `MOCK_ID` cho feature thật.

### Navigation hooks

Import từ `src/routes/hooks` (không import từ `next/navigation`):
```ts
import { useRouter, usePathname, useSearchParams } from 'src/routes/hooks';
```

### Link component

```tsx
import { RouterLink } from 'src/routes/components';

<Button component={RouterLink} href={paths.dashboard.tournament.root}>
  Tournaments
</Button>
```

### Menu sidebar – `src/layouts/config-nav-dashboard.tsx`

Thêm item phẳng vào nhóm `Management` (icon lấy từ `ICONS`, thêm icon mới nếu cần):
```tsx
{ title: 'Player', path: paths.dashboard.player, icon: ICONS.user },
```

## i18n (Quốc tế hoá)

### Thư mục locale

```
src/locales/
├── all-langs.ts          # Danh sách ngôn ngữ hỗ trợ
├── config-locales.ts     # fallbackLng ('en'), defaultNS, i18nOptions, changeLangMessages
├── i18n-provider.tsx
├── index.ts              # Barrel export
├── localization-provider.tsx
├── server.ts
├── use-locales.ts        # Hook useTranslate
├── utils/
└── langs/
    ├── en/ {common.json, navbar.json}
    ├── vi/ ...
    ├── fr/ ...
    ├── cn/ ...
    └── ar/ ...
```

### Sử dụng

```tsx
import { useTranslate } from 'src/locales';

const { t, onChangeLang, currentLang } = useTranslate('navbar'); // ns: 'common' | 'navbar'

t('app');
```

Hook trả `{ t, i18n, onChangeLang, currentLang }`. Không có hook `useLocales`.

### Thêm bản dịch

1. Thêm key vào **tất cả** `langs/<lang>/<ns>.json` (vi, en, fr, cn, ar) – cùng bộ key.
2. Giữ cấu trúc nested JSON hiện có, key camelCase hoặc snake_case.
3. Ngôn ngữ fallback: `fallbackLng` trong `config-locales.ts` (hiện là `'en'`).
4. Chi tiết quy trình: skill `add-locale`.

> Lưu ý: các màn hình nghiệp vụ hiện tại (player, tournament) đang hardcode chuỗi tiếng Anh. Chỉ dùng `t()` khi task yêu cầu đa ngôn ngữ.
