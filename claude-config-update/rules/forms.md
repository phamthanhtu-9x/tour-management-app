# Forms (React Hook Form + Zod)

## Tổng quan

Dự án dùng **React Hook Form** + **Zod**, với wrapper trong `src/components/hook-form/`. Mặc định form tạo/sửa nằm trong **dialog** (`<feature>-form-dialog.tsx`), gọi thẳng service khi submit. Mẫu chuẩn: `sections/player/player-form-dialog.tsx`, `sections/tournament/tournament-form-dialog.tsx`.

## Các thành phần

| File | Vai trò |
|------|---------|
| `form-provider.tsx` | `Form` – `FormProvider` wrapper |
| `fields.tsx` | `Field.*` – các field component |
| `schema-helper.ts` | `schemaHelper` – helper Zod cho date, files, editor, phone, objectOrNull... |
| `rhf-text-field.tsx`, `rhf-select.tsx`, `rhf-autocomplete.tsx`, `rhf-date-picker.tsx`, `rhf-checkbox.tsx`, `rhf-switch.tsx`, `rhf-radio-group.tsx`, `rhf-upload.tsx`, `rhf-editor.tsx`, `rhf-phone-input.tsx`, `rhf-country-select.tsx`, `rhf-rating.tsx`, `rhf-slider.tsx`, `rhf-code.tsx` | Wrapper cho từng loại field |

## Cấu trúc form dialog chuẩn

```tsx
import type { ITournamentItem } from 'src/types/tournament';

import { z as zod } from 'zod';
import { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { tourService } from 'src/services';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type TournamentSchemaType = zod.infer<typeof TournamentSchema>;

export const TournamentSchema = zod.object({
  title: zod.string().min(1, { message: 'Title is required!' }),
  desc: zod.string().optional(),
  startingStack: zod
    .number({ invalid_type_error: 'Must be a number' })
    .min(0)
    .optional()
    .nullable(),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  currentTournament?: ITournamentItem | null;
  onSuccess?: () => void;
};

export function TournamentFormDialog({ open, onClose, currentTournament, onSuccess }: Props) {
  const isEdit = !!currentTournament;

  const defaultValues = useMemo(
    () => ({
      title: currentTournament?.title || '',
      desc: currentTournament?.desc || '',
      startingStack: currentTournament?.startingStack ?? ('' as unknown as number),
    }),
    [currentTournament]
  );

  const methods = useForm<TournamentSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(TournamentSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (open) reset(defaultValues);
  }, [open, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const body = {
        title: data.title,
        desc: data.desc || undefined,
        startingStack: data.startingStack != null ? data.startingStack : undefined,
      };

      if (isEdit && currentTournament) {
        await tourService.updateTour(currentTournament.id, body);
      } else {
        await tourService.insertTour(body);
      }

      toast.success(isEdit ? 'Update success!' : 'Create success!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong!');
    }
  });

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>{isEdit ? 'Edit tournament' : 'New tournament'}</DialogTitle>

        <DialogContent>
          <Box sx={{ py: 1 }}>
            <Field.Text name="title" label="Title" sx={{ mb: 2.5 }} />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
```

## Quy ước

1. **Schema + SchemaType** export ở đầu file.
2. **Props dialog:** `open`, `onClose`, `current<Feature>?: IXItem | null`, `onSuccess?: () => void`. `isEdit = !!current<Feature>`.
3. **`defaultValues`** dùng `useMemo`, phụ thuộc `current<Feature>`. Field number rỗng dùng `'' as unknown as number`.
4. **`useEffect` reset** mỗi khi dialog mở: `if (open) reset(defaultValues)`.
5. **`onSubmit`**: map form data → DTO (`InsertXDto` / `UpdateXDto`, chuỗi rỗng → `undefined`), gọi `xxxService.insertX` / `updateX(id, body)`, `toast`, `onSuccess?.()`, `onClose()`. **Không** `router.push` sau khi lưu trong dialog.
6. Nút submit là `LoadingButton` với `loading={isSubmitting}`.
7. Nếu form là trang riêng (hiếm) thay vì dialog: giữ quy ước 1, 3, 5 nhưng sau khi lưu dùng `router.push(paths...)`.

## `schemaHelper` patterns

```ts
// String bắt buộc
name: zod.string().min(1, { message: 'Name is required!' })

// Number tuỳ chọn (input type="number")
startingStack: zod.number({ invalid_type_error: 'Must be a number' }).min(0).optional().nullable()

// Date
startDate: schemaHelper.date({ message: { required_error: '...' } })

// Files/upload
images: schemaHelper.files({ message: { required_error: '...' } })

// Autocomplete (nullable object)
destination: schemaHelper.objectOrNull<string | null>({ message: { required_error: '...' } })

// Array of strings (multi-select)
services: zod.string().array().min(2, { message: 'Must have at least 2 items!' })

// Array of objects (vd danh sách level)
levels: zod.array(zod.object({ ... })).nonempty({ message: '...' })

// Editor (rich text)
content: schemaHelper.editor({ message: { required_error: '...' } })
```

## Cross-field validation

```ts
.refine((data) => !fIsAfter(data.startDate, data.endDate), {
  message: 'End date cannot be earlier than start date!',
  path: ['endDate'],
});
```
(`fIsAfter` từ `src/utils/format-time`.)
