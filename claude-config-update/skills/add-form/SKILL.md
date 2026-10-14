---
name: add-form
description: Thêm form tạo/sửa (thường là dialog) theo chuẩn React Hook Form + Zod + components/hook-form, submit gọi thẳng service. Dùng khi cần tạo form mới hoặc thêm field vào form (vd "thêm form tạo người chơi", "thêm field avatar vào form player").
---

# Add Form (RHF + Zod)

Tạo / chỉnh form theo đúng pattern dự án. Đọc kèm `.claude/rules/forms.md`. Mẫu tham chiếu: `sections/player/player-form-dialog.tsx`, `sections/tournament/tournament-form-dialog.tsx`.

## Đầu vào cần xác nhận

1. Form thuộc feature nào? Là **dialog** (mặc định, file `sections/<feature>/<feature>-form-dialog.tsx`) hay trang riêng?
2. Danh sách field: tên, kiểu (text/number/select/date/upload/autocomplete/editor/switch...), required? — đối chiếu DTO `InsertXDto` / `UpdateXDto` trong `src/services/types.ts` (hoặc `swagger.json`).
3. Service method dùng để lưu (vd `playerService.insertPlayer` / `updatePlayer`) — nếu chưa có, làm skill `add-data-action` trước.
4. Có validation cross-field không?

## Quy trình

### 1. Zod schema (đầu file)

```tsx
export type XSchemaType = zod.infer<typeof XSchema>;

export const XSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  // chọn helper đúng kiểu field (bảng bên dưới)
});
```

### 2. Bảng chọn schema / Field

| Kiểu field | Zod schema | Field component |
|-----------|-----------|-----------------|
| Text | `zod.string().min(1, {...})` | `<Field.Text name="..." label="..." />` |
| Text tuỳ chọn | `zod.string().optional()` | `<Field.Text />` |
| Number | `zod.number({ invalid_type_error: 'Must be a number' }).min(0).optional().nullable()` | `<Field.Text type="number" />` |
| Select | `zod.string()` | `<Field.Select>` |
| Multi-select | `zod.string().array().min(n)` | `<Field.MultiSelect>` |
| Autocomplete | `schemaHelper.objectOrNull<T>({...})` | `<Field.Autocomplete>` |
| Date | `schemaHelper.date({...})` | `<Field.DatePicker>` |
| Upload 1 ảnh | `schemaHelper.file({...})` | `<Field.UploadAvatar>` / `<Field.Upload>` |
| Upload nhiều | `schemaHelper.files({...})` | `<Field.Upload multiple>` |
| Editor | `schemaHelper.editor({...})` | `<Field.Editor>` |
| Switch / Checkbox | `zod.boolean()` | `<Field.Switch>` / `<Field.Checkbox>` |
| Radio | `zod.string()` | `<Field.RadioGroup>` |
| Phone | `schemaHelper.phoneNumber({...})` | `<Field.Phone>` |

`Field.*` và `schemaHelper` import từ `src/components/hook-form`. Kiểm tra tên chính xác trong `fields.tsx` / `schema-helper.ts` trước khi dùng. Upload ảnh lên server: xem `src/services/upload.service.ts` và cách `player-form-dialog.tsx` xử lý avatar.

### 3. Component dialog

Theo mẫu đầy đủ trong `.claude/rules/forms.md`:
- Props: `open`, `onClose`, `current<Feature>?: IXItem | null`, `onSuccess?: () => void`; `isEdit = !!current<Feature>`.
- `defaultValues` qua `useMemo` (phụ thuộc `current<Feature>`).
- `useForm({ mode: 'onSubmit', resolver: zodResolver(XSchema), defaultValues })`.
- `useEffect(() => { if (open) reset(defaultValues); }, [open, defaultValues, reset])`.
- `onSubmit`: map data → DTO (chuỗi rỗng → `undefined`), `await xService.updateX(id, body)` hoặc `insertX(body)`, `toast.success`, `onSuccess?.()`, `onClose()`; `catch` → `console.error` + `toast.error`.
- Layout: `<Dialog fullWidth maxWidth="sm">` → `<Form methods onSubmit>` → `DialogTitle` / `DialogContent` / `DialogActions` (Cancel + `LoadingButton loading={isSubmitting}`).

### 4. Nối vào view

Trong `<feature>-list-view.tsx`:
```tsx
const formDialog = useBoolean();
const [selected, setSelected] = useState<IXItem | null>(null);

<XFormDialog
  open={formDialog.value}
  onClose={formDialog.onFalse}
  currentX={selected}
  onSuccess={xsMutate}
/>
```
Mở tạo mới: `setSelected(null); formDialog.onTrue();` — mở sửa: `setSelected(row); formDialog.onTrue();`.

### 5. Thêm field vào form có sẵn

1. Thêm vào schema → `defaultValues` → body DTO trong `onSubmit` → JSX `Field.*`.
2. Nếu DTO chưa có field, cập nhật `src/services/types.ts` (đối chiếu `swagger.json`).

## Kiểm tra cuối

1. `yarn ts` sạch.
2. `yarn lint:fix`.
3. Test tạo mới + sửa (dữ liệu cũ được điền sẵn khi mở lại dialog), validation báo lỗi đúng, danh sách refresh sau khi lưu.
