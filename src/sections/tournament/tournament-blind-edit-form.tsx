import type { TourLevelItemDto } from 'src/services/types';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState, useEffect, useCallback } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import LoadingButton from '@mui/lab/LoadingButton';

import { toast } from 'src/components/snackbar';
import { Form } from 'src/components/hook-form';

import { tourService } from 'src/services';

import { LevelsEditor, BlindLevelsSchema } from '../_blind/blind-levels-editor';

import type { BlindLevelsSchemaType } from '../_blind/blind-levels-editor';

// ----------------------------------------------------------------------

export { BlindLevelsSchema };

export const TournamentBlindSchema = BlindLevelsSchema;

export type TournamentBlindSchemaType = BlindLevelsSchemaType;

// ----------------------------------------------------------------------

type Props = {
  tourId: number;
  currentLevels?: TourLevelItemDto[];
  onSaved: () => void;
};

/** Chuyển levels từ server sang giá trị form. */
function toFormValues(levels?: TourLevelItemDto[]): TournamentBlindSchemaType {
  if (levels?.length) {
    return {
      levels: levels.map((l) => ({
        type: l.type,
        name: l.name ?? '',
        duration: l.duration,
        smallBlind: l.smallBlind,
        bigBlind: l.bigBlind,
        ante: l.ante,
      })),
    } as TournamentBlindSchemaType;
  }

  return {
    levels: [
      { type: 'BLIND' as const, name: '', duration: 15, smallBlind: 25, bigBlind: 50, ante: 0 },
    ],
  } as TournamentBlindSchemaType;
}

/**
 * Khoá so sánh nội dung levels: coi null và undefined như nhau
 * (socket trả null, REST có thể bỏ trống) để không báo "có cập nhật" nhầm.
 */
function levelsKey(levels?: TourLevelItemDto[]): string {
  return JSON.stringify(toFormValues(levels), (_key, value) => value ?? undefined);
}

// ----------------------------------------------------------------------

export function TournamentBlindEditForm({ tourId, currentLevels, onSaved }: Props) {
  const methods = useForm<TournamentBlindSchemaType>({
    resolver: zodResolver(TournamentBlindSchema),
    defaultValues: toFormValues(currentLevels),
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = methods;

  // isDirty đọc qua ref để effect bên dưới không chạy lại mỗi khi người dùng gõ.
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // Nội dung levels đã nạp vào form gần nhất – bỏ qua update trùng nội dung (vd socket echo).
  const appliedKeyRef = useRef(levelsKey(currentLevels));

  // Levels mới từ server nhưng chưa nạp vì người dùng đang sửa dở.
  const [pendingLevels, setPendingLevels] = useState<TourLevelItemDto[] | null>(null);

  const applyLevels = useCallback(
    (levels?: TourLevelItemDto[]) => {
      appliedKeyRef.current = levelsKey(levels);
      reset(toFormValues(levels));
      setPendingLevels(null);
    },
    [reset]
  );

  // Levels trên server thay đổi (thiết bị khác lưu / refetch khi mở tab):
  // - Form chưa sửa → nạp luôn.
  // - Form đang sửa dở → KHÔNG ghi đè, chỉ báo để người dùng tự chọn tải lại.
  useEffect(() => {
    const key = levelsKey(currentLevels);
    if (key === appliedKeyRef.current) return;

    if (isDirtyRef.current) {
      setPendingLevels(currentLevels ?? []);
      return;
    }

    applyLevels(currentLevels);
  }, [currentLevels, applyLevels]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const levels: TourLevelItemDto[] = data.levels.map((item, i) => {
        const level: TourLevelItemDto = {
          type: item.type,
          idx: i + 1,
          duration: item.duration,
        };
        if (item.type === 'BLIND') {
          level.name = item.name;
          level.smallBlind = item.smallBlind ?? 0;
          level.bigBlind = item.bigBlind ?? 0;
          level.ante = item.ante ?? 0;
        } else if (item.name) {
          level.name = item.name;
        }
        return level;
      });

      await tourService.updateTour(tourId, { levels });
      toast.success('Blind updated!');
      // Đánh dấu form sạch với dữ liệu vừa lưu, bỏ cảnh báo (bản của mình đã là mới nhất).
      reset(data);
      setPendingLevels(null);
      onSaved();
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong!');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      {pendingLevels && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => applyLevels(pendingLevels)}>
              Load latest
            </Button>
          }
        >
          Blind levels were updated on another device. Saving now will overwrite those changes.
          Click &quot;Load latest&quot; to discard your edits and load the new levels.
        </Alert>
      )}

      <LevelsEditor />

      <Divider sx={{ my: 3 }} />

      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
          Save changes
        </LoadingButton>
      </Stack>
    </Form>
  );
}
