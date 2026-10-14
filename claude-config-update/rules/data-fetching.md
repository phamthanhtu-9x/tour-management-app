# Data Fetching (Services + SWR)

## Tổng quan

Dữ liệu đi qua 2 lớp:

| Lớp | Vị trí | Vai trò |
|-----|--------|---------|
| **Services** | `src/services/<feature>.service.ts` | Gọi REST API thật (GET/POST/PATCH/DELETE) qua `apiClient`. Mỗi method trả `res.data` (envelope `ApiResponse<T>`). |
| **Actions** | `src/actions/<feature>.ts` | SWR hooks để **đọc** dữ liệu, gọi method của service làm fetcher. |

Quy tắc:
- **Đọc (GET) trong component** → luôn dùng hook trong `src/actions/`.
- **Ghi (thêm / sửa / xoá / thao tác control)** → gọi thẳng `xxxService.method()` từ section/form/dialog, sau đó gọi `xxxMutate()` của hook để làm mới dữ liệu.
- **Không** dùng `endpoints` + `fetcher` trong `src/utils/axios.ts` cho API mới — đó là phần mock của template Minimals. `utils/axios.ts` chỉ còn giữ `axiosInstance` (baseURL = `CONFIG.serverUrl` ← `NEXT_PUBLIC_SERVER_URL`).
- Token JWT đã được gắn sẵn vào `axios.defaults.headers.common` (xem `src/auth/context/jwt/utils.ts`), service không tự set header.

## 1. Service — `src/services/<feature>.service.ts`

```ts
import type { InsertPlayerDto, UpdatePlayerDto, PaginationParams } from './types';

import { apiClient } from './api-client';

// ----------------------------------------------------------------------

export const playerService = {
  /** GET /players — Lấy danh sách người chơi (có phân trang) */
  getPlayers: (params?: PaginationParams) =>
    apiClient.get('/players', { params }).then((res) => res.data),

  /** POST /players — Tạo mới một người chơi */
  insertPlayer: (body: InsertPlayerDto) =>
    apiClient.post('/players', body).then((res) => res.data),

  /** GET /players/{id} — Chi tiết người chơi */
  getPlayerById: (id: number) => apiClient.get(`/players/${id}`).then((res) => res.data),

  /** PATCH /players/{id} — Cập nhật người chơi */
  updatePlayer: (id: number, body: UpdatePlayerDto) =>
    apiClient.patch(`/players/${id}`, body).then((res) => res.data),

  /** DELETE /players/{id}/delete — Xóa người chơi */
  deletePlayer: (id: number) =>
    apiClient.delete(`/players/${id}/delete`).then((res) => res.data),
};
```

Quy ước:
- Tên object: `<feature>Service` (camelCase). Tên method: `getXs`, `getXById`, `insertX`, `updateX`, `deleteX`, thêm method đặc thù nếu cần (vd `startClock`).
- Mỗi method có JSDoc `/** METHOD /path — mô tả */`.
- DTO request (`InsertXDto`, `UpdateXDto`, ...) và các type dùng chung khai báo trong `src/services/types.ts`, theo từng block `// ---- <Feature> ----`.
- Sau khi tạo service mới: thêm `export * from './<feature>.service';` vào `src/services/index.ts`.

### Type dùng chung (`src/services/types.ts`)

```ts
type PaginationParams = { page?: number; limit?: number };
type ApiResponse<T> = { statusCode: number; message: string; data: T };
type PaginatedData<T> = { items: T[]; meta: PaginationMeta };
type PaginationMeta = { totalItems; itemCount; itemsPerPage; totalPages; currentPage };
```

### Bóc envelope (`src/services/response-helper.ts`)

| Hàm | Dùng cho | Trả về |
|-----|---------|--------|
| `extractItems<T>(res)` | Response danh sách / phân trang | `T[]` (rỗng nếu không có) |
| `extractMeta(res)` | Response phân trang | `PaginationMeta \| null` |
| `extractData<T>(res)` | Response 1 object | `T \| null` |

## 2. Action — `src/actions/<feature>.ts`

```ts
import type { IPlayerItem } from 'src/types/player';
import type { PaginationParams } from 'src/services/types';

import useSWR from 'swr';
import { useMemo } from 'react';

import { playerService, extractData, extractItems, extractMeta } from 'src/services';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

/** Danh sách người chơi (có phân trang). Truyền null để skip fetch. */
export function useGetPlayers(params?: PaginationParams | null) {
  const key: any = params ? ['players', params] : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    key,
    () => playerService.getPlayers(params!),
    swrOptions
  );

  const memoizedValue = useMemo(() => {
    const players = extractItems<IPlayerItem>(data);
    const meta = extractMeta(data);

    return {
      players,
      playersTotal: meta?.totalItems ?? 0,
      playersMeta: meta,
      playersLoading: isLoading,
      playersError: error,
      playersValidating: isValidating,
      playersEmpty: !isLoading && !players.length,
      playersMutate: mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

/** Chi tiết một người chơi. Chỉ fetch khi có id. */
export function useGetPlayer(id: number | undefined) {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    id ? ['player', id] : null,
    () => playerService.getPlayerById(id!),
    swrOptions
  );

  const memoizedValue = useMemo(() => {
    const player = extractData<IPlayerItem>(data);

    return {
      player,
      playerLoading: isLoading,
      playerError: error,
      playerValidating: isValidating,
      playerMutate: mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}
```

### Quy ước quan trọng

1. **SWR key là mảng** `['<resource>', ...args]` (vd `['players', params]`, `['tournament', id]`, `['tournament-levels', id]`). Key `null` → SWR không fetch (dùng khi chưa có `id`/`params`).
2. **Fetcher** là arrow gọi service: `() => xxxService.getX(...)`. Không dùng `fetcher` của `utils/axios.ts`.
3. **swrOptions cố định** như trên. Hook search có thể thêm `keepPreviousData: true`.
4. **Return value**: object phẳng qua `useMemo`, key camelCase theo tên dữ liệu, không có tiền tố `data`:
   - List: `{ xs, xsTotal, xsMeta, xsLoading, xsError, xsValidating, xsEmpty, xsMutate }`
   - Single: `{ x, xLoading, xError, xValidating, xMutate }`
   - Luôn trả `xxxMutate` để màn hình làm mới sau khi ghi.
5. **id kiểu `number`** (theo backend). Hook single nhận `id: number | undefined`.
6. JSDoc 1 dòng mô tả trên mỗi hook, phân cách hooks bằng `// ------`.

## 3. Ghi dữ liệu (thêm / sửa / xoá) từ section

```ts
import { playerService } from 'src/services';

const handleDelete = useCallback(async () => {
  if (!selected) return;
  try {
    await playerService.deletePlayer(selected.id);
    toast.success('Delete success!');
    confirm.onFalse();
    playersMutate();
  } catch (error) {
    console.error(error);
    toast.error('Delete failed!');
  }
}, [confirm, playersMutate, selected]);
```

- Gọi service trong `try/catch`, báo `toast.success` / `toast.error`.
- Sau khi thành công: gọi `xxxMutate()` (hoặc callback `onSuccess` truyền từ view vào dialog/form).

## Các bước thêm API mới

1. Đối chiếu endpoint + DTO trong `swagger.json`.
2. Khai báo DTO trong `src/services/types.ts`; type entity (`IXItem`) trong `src/types/<feature>.ts`.
3. Thêm method vào `src/services/<feature>.service.ts` (tạo file + export trong `services/index.ts` nếu chưa có).
4. Nếu là API đọc dùng trong UI → thêm SWR hook trong `src/actions/<feature>.ts`.
5. Dùng hook trong `sections/<feature>/view/*.tsx`; thao tác ghi gọi service trực tiếp.
