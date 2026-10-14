# Quy ước code

## Đặt tên file & folder

- **Mọi file và folder dùng kebab-case** – kể cả file component:
  - Component: `player-form-dialog.tsx`, `tournament-card.tsx`, `player-list-view.tsx`
  - Service: `player.service.ts`, `tour.service.ts`
  - Utility/type: `format-time.ts`, `change-case.ts`, `tour-socket.ts`
  - Folder: `custom-breadcrumbs`, `hook-form`, `default-blind`
- Tên **export** của component vẫn là PascalCase: file `player-form-dialog.tsx` export `PlayerFormDialog`.
- Page file: luôn là `page.tsx` (Next.js App Router).

## Barrel exports

Mọi thư mục component / view phải có `index.ts` re-export:
```ts
export * from './tournament-view';
export * from './tournament-details-view';
```
`src/services/index.ts` re-export mọi service, `types` và `response-helper`.

## Import

### Thứ tự import (từ trên xuống, mỗi nhóm cách 1 dòng trống)

1. **Type imports** (`import type ...`)
2. **Third-party** (react, zod, react-hook-form, swr...)
3. **MUI** (`@mui/material/*`, `@mui/lab/*`)
4. **Local `src/*`** theo nhóm: `routes` → `hooks` → `utils` → `actions` / `services` / `layouts` → `components`
5. **Relative trong cùng feature** (`../player-form-dialog`)

ESLint `perfectionist` sẽ tự sắp xếp trong mỗi nhóm khi chạy `yarn lint:fix`.

### Quy tắc import path

- Dùng absolute import `src/*` cho mọi thứ ngoài feature hiện tại:
  ```ts
  // ĐÚNG
  import { paths } from 'src/routes/paths';
  import { playerService } from 'src/services';

  // SAI
  import { paths } from '../../routes/paths';
  ```
- Chỉ dùng relative import cho file trong cùng `sections/<feature>/` (vd view import `../player-table-row`) và bên trong `src/services/`.
- MUI import theo từng component (modularize), **không** import từ barrel `@mui/material`:
  ```ts
  import Box from '@mui/material/Box';
  import Stack from '@mui/material/Stack';
  ```

## Comment phân cách

Dùng `// ----------------------------------------------------------------------` để phân cách block code:
```ts
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export function MyComponent() {
  // ...
}
```

## `'use client'`

- Đặt ở dòng đầu file khi dùng hooks / event handlers / browser APIs.
- View (`*-view.tsx`), dialog (`*-dialog.tsx`), form (`*-form.tsx`) luôn là Client Components.

## Props typing

Dùng `type Props = { ... }` (không dùng `interface`):
```ts
type Props = {
  open: boolean;
  onClose: () => void;
  currentPlayer?: IPlayerItem | null;
  onSuccess?: () => void;
};
```

## Naming convention

| Pattern | Ví dụ |
|---------|-------|
| Component | `PlayerFormDialog`, `TournamentDetailsView` |
| Entity type | `IPlayerItem`, `ITournamentItem` |
| DTO | `InsertPlayerDto`, `UpdateTourDto` |
| Service object | `playerService`, `tourService` |
| Hook (SWR) | `useGetPlayers`, `useGetPlayer` |
| Zod schema | `PlayerSchema`, `TournamentSchema` |
| Zod inferred type | `PlayerSchemaType` |
| Boolean hook | `const formDialog = useBoolean();` |

## Formatter & Linter

- Prettier: `yarn fm:fix`
- ESLint: `yarn lint:fix`
- ESLint config: airbnb + airbnb-typescript + perfectionist + prettier
