# Entries: Thêm / Xoá / Rebuy + Log & Undo – Tài liệu tích hợp Frontend

Tài liệu này mô tả cách frontend thao tác danh sách người chơi (entries) của một tour, hiển thị **log thao tác** real-time và **hoàn tác (undo)**.

> Đọc kèm [`TOUR_WEBSOCKET.md`](./TOUR_WEBSOCKET.md) cho phần kết nối Socket.IO, `join-tour` và event `tour-state`.

---

## 1. Tóm tắt nhanh

| Việc cần làm | Gọi | Kết quả real-time |
|---|---|---|
| Thêm người chơi | `POST /tours/:id/control/entries` | `tour-state` + `tour-log` (`created`) |
| Xoá người chơi | `DELETE /tours/:id/control/entries/:entryId` | `tour-state` + `tour-log` (`created`) |
| Rebuy (+1 `reBuyCount`) | `POST /tours/:id/control/entries/:entryId/rebuy` | `tour-state` + `tour-log` (`created`) |
| Hoàn tác thao tác gần nhất | `POST /tours/:id/control/entries/undo` | `tour-state` + `tour-log` (`undone`) |
| Lấy toàn bộ log | `GET /tours/:id/control/entries/logs` | – |
| Reset clock | `PATCH /tours/:id/control/reset` | entries & log bị xoá → `tour-state` + `tour-log` (`reset`) |

Quy tắc vàng:

1. **Mỗi entry có `id` (uuid) do server sinh.** Dùng `entry.id` để xoá/rebuy. Không tự sinh id ở client.
2. **Nguồn sự thật là WebSocket.** Sau khi gọi API, *không cần* tự cập nhật state cục bộ – server sẽ đẩy `tour-state` (entries mới) và `tour-log` tới **mọi thiết bị** đang xem tour, kể cả thiết bị vừa gọi API.
3. **Undo theo kiểu ngăn xếp (Ctrl+Z):** mỗi lần undo hoàn tác thao tác gần nhất *chưa được undo*. Bấm nhiều lần để lùi nhiều bước. **Không có redo.**
4. **Reset clock xoá sạch log** – sau reset không undo được nữa.

---

## 2. Quy ước chung của REST API

- Base URL: `http://<host>:3002`
- Header: `Authorization: Bearer <accessToken>`
- Mọi response thành công được bọc:
  ```json
  { "statusCode": 200, "message": "Success", "data": { ... } }
  ```
  → dữ liệu thật nằm trong `data`.
- Response lỗi:
  ```json
  { "statusCode": 409, "timestamp": "...", "message": "Danh sách entries đã thay đổi, không thể hoàn tác. Vui lòng tải lại", "details": ... }
  ```

---

## 3. Kiểu dữ liệu (copy vào frontend)

```typescript
// ===== Entry =====
export interface PlayerEntry {
  /** uuid do server sinh – dùng cho xoá / rebuy */
  id: string;
  /** Id player trong bảng players (không có nếu là khách vãng lai) */
  playerId?: number;
  name: string;
  avatar?: string;
  isEliminated: boolean;
  reBuyCount: number;
  /** Số chip của từng lần add-on, ví dụ [10000, 10000] */
  addOn: number[];
}

// ===== Log =====
export type EntryLogAction = 'ADD' | 'REMOVE' | 'REBUY' | 'BULK_UPDATE';

export interface EntryLogItem {
  id: number;                 // tăng dần theo thời gian
  action: EntryLogAction;
  entryId: string | null;     // null với BULK_UPDATE
  entryName: string | null;   // tên entry tại thời điểm thao tác
  createdAt: string;          // ISO date
  undoneAt: string | null;    // khác null = đã được undo
}

// ===== Event `tour-log` (WebSocket) =====
export type TourLogEvent =
  | { tourId: number; type: 'snapshot'; logs: EntryLogItem[]; canUndo: boolean }
  | { tourId: number; type: 'created';  log: EntryLogItem;   canUndo: boolean }
  | { tourId: number; type: 'undone';   log: EntryLogItem;   canUndo: boolean }
  | { tourId: number; type: 'reset';    canUndo: false };
```

| `action` | Ý nghĩa | Gợi ý hiển thị |
|---|---|---|
| `ADD` | Thêm entry | "Đã thêm **{entryName}**" |
| `REMOVE` | Xoá entry | "Đã xoá **{entryName}**" |
| `REBUY` | Rebuy (+1) | "**{entryName}** rebuy" |
| `BULK_UPDATE` | Cập nhật cả danh sách qua `PATCH` cũ | "Cập nhật danh sách người chơi" |

Log có `undoneAt != null` nên hiển thị mờ / gạch ngang kèm nhãn "Đã hoàn tác".

---

## 4. REST API chi tiết

### 4.1. Thêm entry

`POST /tours/:id/control/entries` → `201`

Body (mọi field trừ `name` đều tuỳ chọn):

```json
{
  "name": "Nguyễn Văn A",
  "playerId": 5,
  "avatar": "https://example.com/a.png",
  "isEliminated": false,
  "reBuyCount": 0,
  "addOn": [10000]
}
```

| Field | Ràng buộc |
|---|---|
| `name` | string, bắt buộc, không rỗng |
| `playerId` | số nguyên ≥ 1, phải là player **của bạn** (nếu không → `400`) |
| `avatar` | string |
| `isEliminated` | boolean, mặc định `false` |
| `reBuyCount` | số nguyên ≥ 0, mặc định `0` |
| `addOn` | mảng số nguyên ≥ 1, mặc định `[]` |

Response `data`:

```json
{
  "entry":   { "id": "6f1c2a9e-...", "playerId": 5, "name": "Nguyễn Văn A", "isEliminated": false, "reBuyCount": 0, "addOn": [10000] },
  "entries": [ /* toàn bộ entries sau khi thêm */ ],
  "log":     { "id": 12, "action": "ADD", "entryId": "6f1c2a9e-...", "entryName": "Nguyễn Văn A", "createdAt": "...", "undoneAt": null }
}
```

Entry mới được thêm vào **cuối** danh sách.

### 4.2. Xoá entry

`DELETE /tours/:id/control/entries/:entryId` → `200`

Response `data`: `{ "entries": [...], "log": { "action": "REMOVE", ... } }`

| Lỗi | Khi nào |
|---|---|
| `400` | `entryId` không phải uuid |
| `404` | Không tìm thấy entry (có thể đã bị thiết bị khác xoá) |

### 4.3. Rebuy

`POST /tours/:id/control/entries/:entryId/rebuy` → `200` (không cần body)

Tăng `reBuyCount` của entry thêm **1**.

Response `data`: `{ "entry": { ...reBuyCount mới }, "entries": [...], "log": { "action": "REBUY", ... } }`

Lỗi giống mục 4.2.

### 4.4. Undo

`POST /tours/:id/control/entries/undo` → `200` (không cần body)

Hoàn tác thao tác **gần nhất chưa được undo**: entries được khôi phục **y hệt** trước thao tác đó (kể cả vị trí và `id` của entry bị xoá).

Response `data`:

```json
{
  "entries": [ /* entries sau khi hoàn tác */ ],
  "log": { "id": 12, "action": "ADD", "entryName": "Nguyễn Văn A", "undoneAt": "2026-10-14T16:45:00.000Z", ... },
  "canUndo": true
}
```

| Lỗi | Khi nào | Frontend nên |
|---|---|---|
| `400` "Không còn thao tác nào để hoàn tác" | Hết log để undo (hoặc vừa reset) | Disable nút Undo (dựa vào `canUndo`) |
| `409` "Danh sách entries đã thay đổi…" | Entries hiện tại không khớp với kết quả của thao tác cần undo (hiếm – xảy ra khi có thay đổi ngoài luồng) | Thông báo và gọi lại `GET /tours/:id/control` + `GET .../entries/logs` |

### 4.5. Lấy log

`GET /tours/:id/control/entries/logs` → `200`

```json
{
  "logs": [ /* EntryLogItem[], mới nhất trước */ ],
  "canUndo": true
}
```

Thường **không cần gọi** nếu đã dùng WebSocket (đã có `snapshot` khi `join-tour`). Dùng khi cần tải lại sau lỗi `409` hoặc khi không dùng socket.

### 4.6. `PATCH /tours/:id/control/entries` (cũ – vẫn hoạt động)

Ghi đè toàn bộ danh sách. Vẫn được hỗ trợ để tương thích, nhưng:

- Được ghi **một** log `BULK_UPDATE` (không biết cụ thể ai được thêm/xoá).
- **Phải gửi kèm `id`** của các entry đang có để giữ nguyên id; entry không có `id` sẽ được coi là entry mới và nhận id mới.
- Hai entry trùng `id` → `400`.

👉 Với thêm/xoá/rebuy, **hãy dùng API ở mục 4.1–4.3** để có log rõ ràng. Dùng `PATCH` cho các chỉnh sửa khác (đổi tên, `isEliminated`, `addOn`, sắp xếp lại…).

---

## 5. WebSocket – event `tour-log`

Server → Client, gửi trong room của tour (cùng room với `tour-state`).

| `type` | Khi nào | Frontend xử lý |
|---|---|---|
| `snapshot` | Ngay sau `join-tour` (và sau reconnect + join lại) | **Thay toàn bộ** danh sách log bằng `logs`; set `canUndo` |
| `created` | Có thao tác mới (thêm/xoá/rebuy/PATCH) | **Thêm `log` vào đầu** danh sách; set `canUndo` |
| `undone` | Vừa undo | **Thay** log có cùng `log.id` (giờ có `undoneAt`); set `canUndo` |
| `reset` | Reset clock | **Xoá sạch** danh sách log; `canUndo = false` |

Thứ tự event sau mỗi thao tác: `tour-state` (entries mới) → `tour-log`.

### 5.1. Reducer mẫu

```typescript
interface LogState {
  logs: EntryLogItem[];   // mới nhất trước
  canUndo: boolean;
}

export function logReducer(state: LogState, ev: TourLogEvent): LogState {
  switch (ev.type) {
    case 'snapshot':
      return { logs: ev.logs, canUndo: ev.canUndo };
    case 'created':
      return { logs: [ev.log, ...state.logs], canUndo: ev.canUndo };
    case 'undone':
      return {
        logs: state.logs.map((l) => (l.id === ev.log.id ? ev.log : l)),
        canUndo: ev.canUndo,
      };
    case 'reset':
      return { logs: [], canUndo: false };
  }
}
```

### 5.2. React hook mẫu

```tsx
import { useEffect, useReducer } from 'react';
import type { Socket } from 'socket.io-client';

export function useTourLog(socket: Socket | null, tourId: number) {
  const [state, dispatch] = useReducer(logReducer, { logs: [], canUndo: false });

  useEffect(() => {
    if (!socket) return;
    const onLog = (ev: TourLogEvent) => {
      if (ev.tourId === tourId) dispatch(ev);
    };
    socket.on('tour-log', onLog);
    return () => {
      socket.off('tour-log', onLog);
    };
  }, [socket, tourId]);

  return state; // { logs, canUndo }
}
```

> Đăng ký listener `tour-log` **trước** khi emit `join-tour` để không lỡ event `snapshot`.

### 5.3. Gọi API từ UI

```typescript
const api = (path: string, init?: RequestInit) =>
  fetch(`${BASE_URL}/tours/${tourId}/control/entries${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  }).then(async (res) => {
    const body = await res.json();
    if (!res.ok) throw Object.assign(new Error(body.message), { status: res.status });
    return body.data;
  });

export const addEntry   = (dto: { name: string; playerId?: number; avatar?: string; addOn?: number[] }) =>
  api('', { method: 'POST', body: JSON.stringify(dto) });
export const removeEntry = (entryId: string) => api(`/${entryId}`, { method: 'DELETE' });
export const rebuyEntry  = (entryId: string) => api(`/${entryId}/rebuy`, { method: 'POST' });
export const undo        = () => api('/undo', { method: 'POST' });
export const getLogs     = () => api('/logs');
```

Ví dụ nút Undo:

```tsx
<button
  disabled={!canUndo || pending}
  onClick={async () => {
    try {
      await undo();               // UI tự cập nhật qua tour-state + tour-log
    } catch (e: any) {
      if (e.status === 409) {
        toast('Danh sách đã thay đổi, đang tải lại…');
        await reloadControlAndLogs();
      } else {
        toast(e.message);
      }
    }
  }}
>
  Hoàn tác
</button>
```

---

## 6. Luồng điển hình

```
Thiết bị A                         Server                          Thiết bị B
    | POST /entries {name:"An"}      |                                 |
    |------------------------------->| lưu entry + log ADD (1 transaction)
    |<---- 201 {entry, entries, log} |                                 |
    |<====== tour-state =============|====== tour-state ==============>|
    |<====== tour-log {created} =====|====== tour-log {created} ======>|
    |                                |                                 |
    |                                |      POST /entries/undo         |
    |                                |<--------------------------------|
    |                                | khôi phục entries, đánh dấu log |
    |<====== tour-state =============|====== tour-state ==============>|
    |<====== tour-log {undone} ======|====== tour-log {undone} =======>|
```

---

## 7. Lưu ý & Edge cases

- **Nhiều thiết bị thao tác cùng lúc:** server khoá dòng dữ liệu trong transaction nên không mất thao tác (ví dụ 2 thiết bị cùng bấm rebuy → `reBuyCount` tăng 2).
- **Undo dùng chung cho cả tour**, không theo từng thiết bị/người: undo trên thiết bị B có thể hoàn tác thao tác vừa làm trên thiết bị A.
- **Thao tác mới sau khi undo:** log đã undo vẫn hiển thị trong lịch sử (có `undoneAt`) nhưng không thể "làm lại"; lần undo kế tiếp hoàn tác thao tác mới nhất.
- **Entry bị xoá rồi undo** sẽ quay lại đúng vị trí cũ với **cùng `id`** → các tham chiếu theo `id` ở frontend vẫn đúng.
- **Lỗi validate (400/404)** không tạo log và không thay đổi dữ liệu.
- **Dữ liệu cũ:** các entry tạo trước khi có tính năng này đã được gán `id` tự động khi chạy migration.
