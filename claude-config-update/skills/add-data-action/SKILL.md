---
name: add-data-action
description: Thêm method gọi API vào service (src/services) và SWR hook đọc dữ liệu (src/actions) theo chuẩn dự án. Dùng khi cần nối một API backend mới (vd "thêm hook lấy danh sách level mặc định", "thêm API cập nhật GTD").
---

# Add Data Action (service method + SWR hook)

Nối một API backend vào frontend đúng pattern dự án. Đọc kèm `.claude/rules/data-fetching.md`. Mẫu tham chiếu: `src/services/player.service.ts` + `src/actions/player.ts`.

## Đầu vào cần xác nhận

1. Feature / resource nào? (file `src/services/<feature>.service.ts`, `src/actions/<feature>.ts`)
2. Endpoint: method + path + body + response — đối chiếu trong `swagger.json` ở gốc dự án.
3. Là API **đọc** (cần SWR hook) hay **ghi** (chỉ cần service method, gọi trực tiếp từ section)?
4. Với API đọc: list có phân trang / single theo id / khác?

## Quy trình

### 1. Type

- Entity trả về: `src/types/<feature>.ts` → `export type IXItem = { id: number; ... }`.
- DTO request (body/query): `src/services/types.ts`, trong block `// ---- <Feature> ----` → `InsertXDto`, `UpdateXDto`, ...

### 2. Service method — `src/services/<feature>.service.ts`

```ts
import type { InsertXDto, UpdateXDto, PaginationParams } from './types';

import { apiClient } from './api-client';

// ----------------------------------------------------------------------

export const <feature>Service = {
  /** GET /<resources> — Lấy danh sách (có phân trang) */
  getXs: (params?: PaginationParams) =>
    apiClient.get('/<resources>', { params }).then((res) => res.data),

  /** GET /<resources>/{id} — Chi tiết */
  getXById: (id: number) => apiClient.get(`/<resources>/${id}`).then((res) => res.data),

  /** POST /<resources> — Tạo mới */
  insertX: (body: InsertXDto) => apiClient.post('/<resources>', body).then((res) => res.data),

  /** PATCH /<resources>/{id} — Cập nhật */
  updateX: (id: number, body: UpdateXDto) =>
    apiClient.patch(`/<resources>/${id}`, body).then((res) => res.data),

  /** DELETE /<resources>/{id}/delete — Xoá */
  deleteX: (id: number) => apiClient.delete(`/<resources>/${id}/delete`).then((res) => res.data),
};
```

- File mới → thêm `export * from './<feature>.service';` vào `src/services/index.ts`.
- Path, HTTP method đúng theo `swagger.json` (backend dùng `PATCH` cho update, `DELETE /{id}/delete` cho xoá).

### 3. SWR hook (chỉ cho API đọc) — `src/actions/<feature>.ts`

Header file:
```ts
import type { IXItem } from 'src/types/<feature>';
import type { PaginationParams } from 'src/services/types';

import useSWR from 'swr';
import { useMemo } from 'react';

import { <feature>Service, extractData, extractItems, extractMeta } from 'src/services';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};
```

**List hook (phân trang):**
```ts
/** Danh sách X (có phân trang). Truyền null để skip fetch. */
export function useGetXs(params?: PaginationParams | null) {
  const key: any = params ? ['xs', params] : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    key,
    () => <feature>Service.getXs(params!),
    swrOptions
  );

  const memoizedValue = useMemo(() => {
    const xs = extractItems<IXItem>(data);
    const meta = extractMeta(data);

    return {
      xs,
      xsTotal: meta?.totalItems ?? 0,
      xsMeta: meta,
      xsLoading: isLoading,
      xsError: error,
      xsValidating: isValidating,
      xsEmpty: !isLoading && !xs.length,
      xsMutate: mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}
```

**Single hook:**
```ts
/** Chi tiết một X. Chỉ fetch khi có id. */
export function useGetX(id: number | undefined) {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    id ? ['x', id] : null,
    () => <feature>Service.getXById(id!),
    swrOptions
  );

  const memoizedValue = useMemo(() => {
    const x = extractData<IXItem>(data);

    return {
      x,
      xLoading: isLoading,
      xError: error,
      xValidating: isValidating,
      xMutate: mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}
```

**Danh sách con không phân trang** (vd levels của 1 tour): như single hook nhưng dùng `extractItems<T>(data)` và trả thêm `xsEmpty`. Xem `useGetTourLevels` trong `src/actions/tournament.ts`.

### 4. Dùng

- Đọc: gọi hook trong `sections/<feature>/view/*.tsx`.
- Ghi: gọi `await <feature>Service.insertX/updateX/deleteX(...)` trong section/dialog (try/catch + `toast`), xong gọi `xsMutate()` hoặc `onSuccess?.()`.

## Quy tắc bắt buộc

- Không dùng `endpoints` / `fetcher` của `src/utils/axios.ts`; không gọi `apiClient` ngoài thư mục `services/`.
- SWR key là mảng `['<resource>', ...args]`; `null` khi chưa đủ tham số.
- Return là object phẳng qua `useMemo`, có hậu tố `Loading/Error/Validating/Empty/Mutate` (+ `Total/Meta` cho list phân trang), không có tiền tố `data`.
- id kiểu `number`.
- Mỗi hook / method có JSDoc 1 dòng; phân cách hooks bằng `// ------`.

## Kiểm tra cuối

1. `yarn ts` sạch.
2. `yarn lint:fix`.
3. Mở màn hình dùng hook: loading / empty / dữ liệu hiển thị đúng; thao tác ghi xong danh sách tự refresh.
