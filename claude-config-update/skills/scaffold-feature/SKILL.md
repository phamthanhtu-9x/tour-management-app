---
name: scaffold-feature
description: Sinh trọn một module quản lý (CRUD) theo chuẩn dự án — types → service → actions → sections (list view + form dialog) → app route → paths → nav. Dùng khi cần tạo một tính năng quản lý mới (vd "tạo module quản lý bàn chơi", "thêm CRUD cho sự kiện").
---

# Scaffold Feature (CRUD module)

Tạo một module CRUD hoàn chỉnh theo đúng kiến trúc dự án. Đọc kèm `.claude/rules/architecture.md` và `.claude/rules/data-fetching.md`.

**Mẫu tham chiếu (đọc trước khi viết):**
- Dạng **bảng + dialog** (mặc định): `sections/player/` (`view/player-list-view.tsx`, `player-table-row.tsx`, `player-form-dialog.tsx`, `player-details-dialog.tsx`), `actions/player.ts`, `services/player.service.ts`, `app/dashboard/player/page.tsx`.
- Dạng **card grid + trang chi tiết**: `sections/tournament/` (`view/tournament-view.tsx`, `view/tournament-details-view.tsx`, `tournament-card.tsx`, `tournament-form-dialog.tsx`), `app/dashboard/tournament/[id]/page.tsx`.

## Đầu vào cần xác nhận với người dùng

1. **Tên feature** (số ít, kebab-case): vd `table`, `event`.
2. **Endpoint backend** + DTO — tra trong `swagger.json`. Nếu backend chưa có API, hỏi lại trước khi làm.
3. **Các field** của entity (name, type, required?).
4. **Dạng UI**: bảng + dialog (mặc định) hay card + trang chi tiết? Có cần dialog xem chi tiết không?

## Thứ tự thực hiện

### Bước 1 — Types

- `src/types/<feature>.ts`:
  ```ts
  // ----------------------------------------------------------------------

  export type I<Feature>Item = {
    id: number;
    name?: string;
    // ...field theo swagger
    createdAt?: string;
    updatedAt?: string;
  };
  ```
- `src/services/types.ts`: thêm block `// ---- <Feature> ----` với `Insert<Feature>Dto`, `Update<Feature>Dto`.

### Bước 2 — Service: `src/services/<feature>.service.ts`

Theo mẫu `player.service.ts` (getXs / insertX / getXById / updateX / deleteX). Thêm `export * from './<feature>.service';` vào `src/services/index.ts`. Chi tiết: skill `add-data-action`.

### Bước 3 — Actions: `src/actions/<feature>.ts`

Tối thiểu `useGet<Feature>s(params)` (phân trang); thêm `useGet<Feature>(id)` nếu có dialog/trang chi tiết. Theo mẫu `actions/player.ts`.

### Bước 4 — Sections: `src/sections/<feature>/`

```
sections/<feature>/
├── view/
│   ├── index.ts                        # export * from './<feature>-list-view';
│   └── <feature>-list-view.tsx         # 'use client'
├── <feature>-table-row.tsx             # (hoặc <feature>-card.tsx)
├── <feature>-form-dialog.tsx           # RHF + Zod, gọi service (skill add-form)
└── <feature>-details-dialog.tsx        # tuỳ chọn
```

List view (dạng bảng) – khung chính:
```tsx
'use client';

import type { I<Feature>Item } from 'src/types/<feature>';

import { useState, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { useGet<Feature>s } from 'src/actions/<feature>';
import { <feature>Service } from 'src/services';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { <Feature>TableRow } from '../<feature>-table-row';
import { <Feature>FormDialog } from '../<feature>-form-dialog';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Name' },
  { id: 'createdAt', label: 'Created at', width: 200 },
  { id: '', label: '', width: 88 },
];

// ----------------------------------------------------------------------

export function <Feature>ListView() {
  const table = useTable({ defaultOrderBy: 'name', defaultRowsPerPage: 10 });

  const { <feature>s, <feature>sTotal, <feature>sLoading, <feature>sEmpty, <feature>sMutate } =
    useGet<Feature>s({ page: table.page + 1, limit: table.rowsPerPage });

  const formDialog = useBoolean();
  const confirm = useBoolean();
  const [selected, setSelected] = useState<I<Feature>Item | null>(null);

  // handleOpenCreate / handleOpenEdit / handleOpenDelete (useCallback)

  const handleDelete = useCallback(async () => {
    if (!selected) return;
    try {
      await <feature>Service.delete<Feature>(selected.id);
      toast.success('Delete success!');
      confirm.onFalse();
      <feature>sMutate();
    } catch (error) {
      console.error(error);
      toast.error('Delete failed!');
    }
  }, [confirm, <feature>sMutate, selected]);

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="<Feature>"
          links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: '<Feature>' }]}
          action={/* Button "New <feature>" → handleOpenCreate */}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Card>{/* Scrollbar > Table > TableHeadCustom + TableBody(rows, TableEmptyRows, TableNoData) + TablePaginationCustom count={<feature>sTotal} */}</Card>
      </DashboardContent>

      <<Feature>FormDialog
        open={formDialog.value}
        onClose={formDialog.onFalse}
        current<Feature>={selected}
        onSuccess={<feature>sMutate}
      />

      <ConfirmDialog open={confirm.value} onClose={confirm.onFalse} title="Delete" /* content + action */ />
    </>
  );
}
```
Copy phần thân bảng / phân trang từ `player-list-view.tsx` rồi đổi tên, đừng tự chế lại.

Dạng card: theo `tournament-view.tsx` (`Grid` + `<Feature>Card` + `TablePaginationCustom`), click card → `router.push(paths.dashboard.<feature>.details(id))`.

### Bước 5 — Paths: `src/routes/paths.ts`

Trong `paths.dashboard`:
```ts
// chỉ có list
<feature>: `${ROOTS.DASHBOARD}/<feature>`,

// có trang chi tiết
<feature>: {
  root: `${ROOTS.DASHBOARD}/<feature>`,
  details: (id: number) => `${ROOTS.DASHBOARD}/<feature>/${id}`,
},
```
Tên key camelCase nếu feature nhiều từ (vd `defaultBlind` ↔ `/default-blind`).

### Bước 6 — App route: `src/app/dashboard/<feature>/`

```
app/dashboard/<feature>/
├── page.tsx           # list
└── [id]/page.tsx      # chỉ khi có trang chi tiết
```

`page.tsx`:
```tsx
import { CONFIG } from 'src/config-global';

import { <Feature>ListView } from 'src/sections/<feature>/view';

// ----------------------------------------------------------------------

export const metadata = { title: `<Feature> | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <<Feature>ListView />;
}
```

`[id]/page.tsx`: export thêm `dynamic = CONFIG.isStaticExport ? 'auto' : 'force-dynamic'`, nhận `params: { id: string }`, render `<<Feature>DetailsView id={Number(params.id)} />` (xem `app/dashboard/tournament/[id]/page.tsx`).

### Bước 7 — Navigation: `src/layouts/config-nav-dashboard.tsx`

Thêm item phẳng vào nhóm `Management` (dùng icon có sẵn trong `ICONS` hoặc thêm mới):
```tsx
{ title: '<Feature>', path: paths.dashboard.<feature>, icon: ICONS.<icon> },
// hoặc paths.dashboard.<feature>.root nếu là object
```

## Kiểm tra cuối

1. `yarn ts` — type check sạch.
2. `yarn lint:fix` — lint sạch.
3. `yarn dev`, vào `/dashboard/<feature>`: list hiển thị, tạo / sửa / xoá hoạt động và danh sách tự refresh, menu sidebar có item mới.

## Lưu ý

- Không tạo `new/` và `[id]/edit/` page, không thêm `demo`/`MOCK_ID` trừ khi người dùng yêu cầu.
- Không dùng `endpoints`/`fetcher` của `utils/axios.ts`; không lấy các module demo của Minimals (product, user, invoice...) làm mẫu.
- Giữ comment phân cách `// ------`, tên file kebab-case, thứ tự import theo `.claude/rules/conventions.md`.
