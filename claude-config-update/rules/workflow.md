# Quy trình làm việc & Bảo mật

## Lệnh thường dùng

| Lệnh | Mô tả |
|------|-------|
| `yarn dev` | Chạy dev server tại `localhost:8082` |
| `yarn build` | Build production |
| `yarn lint` | Kiểm tra ESLint |
| `yarn lint:fix` | Tự sửa lỗi ESLint |
| `yarn fm:check` | Kiểm tra Prettier |
| `yarn fm:fix` | Tự format code |
| `yarn ts` | Kiểm tra TypeScript (không emit) |
| `yarn ts:watch` | Watch mode TypeScript |
| `yarn re:start` | Xoá node_modules + .next, cài lại, chạy dev |

## Trước khi commit

1. `yarn lint:fix` – sửa lỗi lint
2. `yarn fm:fix` – format code
3. `yarn ts` – chạy type check

## Cấu trúc thư mục `src/`

```
src/
├── _mock/          Mock data của template (không dùng cho feature thật)
├── actions/        SWR hooks đọc dữ liệu (tournament.ts, player.ts, setup.ts...)
├── app/            Next.js App Router pages (feature thật: dashboard/tournament, player, default-blind)
├── assets/         Static assets
├── auth/           Auth components, contexts (jwt mặc định), guards
├── components/     Shared UI components
├── config-global.ts Global app config (serverUrl, appName, isStaticExport...)
├── global.css
├── hooks/          Custom React hooks (use-boolean, use-set-state...)
├── layouts/        Layout + config-nav-dashboard.tsx (menu sidebar)
├── lib/            Third-party init
├── locales/        i18n
├── routes/         paths.ts + hooks + components
├── sections/       UI nghiệp vụ theo feature (feature thật: tournament, player, default-blind)
├── services/       Gọi REST API backend: api-client, *.service.ts, types.ts, response-helper.ts
├── theme/          MUI theme
├── types/          Type entity (tournament.ts, player.ts, tour-socket.ts...)
└── utils/          Utility (axios.ts = axios instance, format-time, change-case...)
```

Phần lớn các thư mục còn lại trong `sections/` và `app/` (mail, chat, kanban, product, job...) là demo của template Minimals – không dùng làm mẫu cho feature mới.

## Playbook: Khởi tạo dự án

```sh
git clone <repo>
cd tour-management-app
yarn install
# tạo file .env với NEXT_PUBLIC_SERVER_URL=<url backend>
yarn dev
# Mở http://localhost:8082
```

## Bảo mật

1. **KHÔNG hardcode secrets** (API keys, tokens, passwords) trong code.
2. Biến môi trường nằm trong file `.env` ở gốc dự án (đã có trong `.gitignore`). Client-side dùng prefix `NEXT_PUBLIC_*`:
   ```env
   NEXT_PUBLIC_SERVER_URL=https://api.example.com
   ```
3. Server-side secrets dùng `process.env.*` (không prefix `NEXT_PUBLIC_`).
4. Không đọc / in nội dung `.env` ra output; chỉ cần biết tên biến.

## Node.js version

Yêu cầu **Node.js 20.x** (khai trong `package.json` `engines`). Package manager: Yarn 1.22.
