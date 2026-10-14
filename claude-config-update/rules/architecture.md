# Kiến trúc phân lớp

Dự án dựa trên Minimals UI v6, phân thành các layer sau. Module tham chiếu chuẩn: **`player`** (CRUD dạng bảng + dialog) và **`tournament`** (dạng card + trang chi tiết).

## 1. App Router (`src/app`)

- **Vai trò:** Routing mỏng – chỉ đọc params, render View.
- Mỗi tính năng nằm trong `app/dashboard/<feature>/`:
  - `page.tsx` – list page (luôn có)
  - `[id]/page.tsx` – detail page (khi feature có trang chi tiết riêng, vd tournament)
  - `new/page.tsx`, `[id]/edit/page.tsx` – **chỉ** khi form quá lớn không vừa dialog. Mặc định tạo/sửa bằng dialog.
- **Mỗi page export:**
  ```ts
  export const metadata = { title: `... | Dashboard - ${CONFIG.appName}` };
  ```
  Page có dynamic params (`[id]`) export thêm:
  ```ts
  export const dynamic = CONFIG.isStaticExport ? 'auto' : 'force-dynamic';
  ```
- Page không chứa logic nghiệp vụ, không gọi API, không import `useSWR`/services. Param `id` chuyển sang `number` rồi truyền vào View:
  ```tsx
  type Props = { params: { id: string } };

  export default function Page({ params }: Props) {
    return <TournamentDetailsView id={Number(params.id)} />;
  }
  ```

## 2. Sections (`src/sections`)

- **Vai trò:** UI nghiệp vụ của một tính năng, trong `sections/<feature>/`.
- **Structure chuẩn (theo `sections/player`):**
  ```
  sections/<feature>/
  ├── view/
  │   ├── index.ts                     # barrel export
  │   ├── <feature>-list-view.tsx      # màn list (table hoặc card grid)
  │   └── <feature>-details-view.tsx   # (tuỳ chọn) trang chi tiết, nhận prop id
  ├── <feature>-table-row.tsx          # hàng của bảng (hoặc <feature>-card.tsx cho dạng card)
  ├── <feature>-form-dialog.tsx        # dialog tạo/sửa (RHF + Zod)
  └── <feature>-details-dialog.tsx     # (tuỳ chọn) dialog xem chi tiết
  ```
- **Quy ước View:**
  - `'use client'` ở dòng đầu tiên.
  - List view không nhận props; details view nhận `id: number` và tự fetch bằng hook `useGetX(id)`.
  - Bọc trong `<DashboardContent>`, có `<CustomBreadcrumbs heading links action>`.
  - View giữ state dialog (`useBoolean()`), item đang chọn (`useState<IXItem | null>`), và truyền `onSuccess={xsMutate}` xuống dialog.

## 3. Services (`src/services`)

- **Vai trò:** Gọi REST API của backend (Poker Tour Management API) qua `apiClient` (= axios instance trong `utils/axios.ts`, đã có baseURL + Bearer token).
- Mỗi resource một file `<feature>.service.ts` export object `<feature>Service`.
- DTO và type response chung trong `services/types.ts`; helper bóc envelope trong `services/response-helper.ts`.
- Mọi file phải được re-export trong `services/index.ts`.

## 4. Actions (`src/actions`)

- **Vai trò:** SWR hooks để **đọc** dữ liệu, fetcher là method của service.
- Xem chi tiết tại **[data-fetching.md](./data-fetching.md)**.

## 5. Components (`src/components`)

- **Vai trò:** UI dùng chung, không phụ thuộc tính năng. Mỗi thư mục có `index.ts` barrel export.
  | Thư mục | Chức năng |
  |---------|-----------|
  | `hook-form/` | `Form`, `Field.*`, `schemaHelper` (RHF wrappers) |
  | `custom-breadcrumbs/` | Breadcrumb |
  | `custom-dialog/` | `ConfirmDialog` (xác nhận xoá) |
  | `iconify/` | Icon wrapper |
  | `snackbar/` | Toast (`toast`) |
  | `empty-content/` | Trạng thái rỗng |
  | `table/` | `useTable`, `TableHeadCustom`, `TableNoData`, `TablePaginationCustom`... |
  | `scrollbar/` | Scrollbar bọc bảng |
  | `upload/` | Upload file |

## Data Flow

```
Page (app/) → View (sections/<f>/view/) → Section components (row/card/dialog)
                 │  đọc                        │  ghi (thêm/sửa/xoá)
                 ▼                             ▼
          Actions (SWR hooks) ───────► Services (<f>.service.ts) ──► apiClient (utils/axios.ts)
                                               │
                         Types: src/types/<f>.ts (entity) + src/services/types.ts (DTO)
```

## Nguyên tắc vàng

1. **Page mỏng** – chỉ routing + metadata.
2. **Đọc qua `actions/`, ghi qua `services/`.** Section được phép gọi trực tiếp `xxxService.insert/update/delete/...`, sau đó `mutate()` để refresh. Không gọi `apiClient`/`axios` trực tiếp trong section.
3. **Mọi đường dẫn qua `src/routes/paths.ts`**, không hardcode path string.
4. **Type entity trong `src/types/<feature>.ts`** (`IXItem`), **DTO request trong `src/services/types.ts`**.
5. **Comment phân cách `// -----`** giữa các block code chính.
