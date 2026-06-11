import type { DefaultLevelItemDto } from 'src/services/types';

import { z as zod } from 'zod';
import { useForm, useFieldArray, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { setupService } from 'src/services';

// ----------------------------------------------------------------------

const levelItemSchema = zod
  .object({
    type: zod.enum(['BLIND', 'BREAK']),
    name: zod.string().optional().default(''),
    duration: zod.coerce.number().int().min(1, { message: 'Min 1 min' }),
    smallBlind: zod.coerce.number().int().min(0).optional(),
    bigBlind: zod.coerce.number().int().min(0).optional(),
    ante: zod.coerce.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'BLIND') {
      if (!data.smallBlind && data.smallBlind !== 0) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: 'Small blind is required',
          path: ['smallBlind'],
        });
      }
      if (!data.bigBlind && data.bigBlind !== 0) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: 'Big blind is required',
          path: ['bigBlind'],
        });
      }
    }
  });

export const DefaultBlindSchema = zod.object({
  levels: zod.array(levelItemSchema).min(1, { message: 'Must have at least 1 level' }),
});

export type DefaultBlindSchemaType = zod.infer<typeof DefaultBlindSchema>;

// ----------------------------------------------------------------------

type Props = {
  currentLevels?: DefaultLevelItemDto[];
  onSaved: () => void;
};

export function DefaultBlindEditForm({ currentLevels, onSaved }: Props) {
  const defaultValues = useMemo(() => {
    if (currentLevels?.length) {
      return {
        levels: currentLevels.map((l) => ({
          type: l.type,
          name: l.name ?? '',
          duration: l.duration,
          smallBlind: l.smallBlind,
          bigBlind: l.bigBlind,
          ante: l.ante,
        })),
      };
    }

    return {
      levels: [
        { type: 'BLIND' as const, name: '', duration: 15, smallBlind: 25, bigBlind: 50, ante: 0 },
      ],
    };
  }, [currentLevels]);

  const methods = useForm<DefaultBlindSchemaType>({
    resolver: zodResolver(DefaultBlindSchema),
    defaultValues,
  });

  const { reset, handleSubmit, formState: { isSubmitting } } = methods;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const levels: DefaultLevelItemDto[] = data.levels.map((item, i) => {
        const level: DefaultLevelItemDto = {
          type: item.type,
          idx: i + 1, // idx bắt đầu từ 1
          duration: item.duration,
        };
        // Blind luôn có name = "Level {blindIndex}"; Break dùng name người dùng nhập
        if (item.type === 'BLIND') {
          level.name = item.name; // name đã được gán = "Level {n}" bởi LevelsEditor
          level.smallBlind = item.smallBlind ?? 0;
          level.bigBlind = item.bigBlind ?? 0;
          level.ante = item.ante ?? 0;
        } else if (item.name) {
          level.name = item.name;
        }
        return level;
      });

      await setupService.setDefaultLevels({ levels });
      toast.success('Default blind updated!');
      onSaved();
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong!');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
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

// ----------------------------------------------------------------------

function LevelsEditor() {
  const { control, watch, setValue } = useFormContext<DefaultBlindSchemaType>();

  const { fields, append, remove } = useFieldArray({ control, name: 'levels' });

  const watchedLevels = watch('levels');

  // Tự đánh số "Level {n}" cho các item BLIND (Break không tính số),
  // và đồng bộ vào form value để submit dùng đúng name.
  useEffect(() => {
    let blindCount = 0;
    watchedLevels?.forEach((level, i) => {
      if (level.type === 'BLIND') {
        blindCount += 1;
        const expected = `Level ${blindCount}`;
        if (level.name !== expected) {
          setValue(`levels.${i}.name`, expected, { shouldDirty: true });
        }
      }
    });
  }, [watchedLevels, setValue]);

  const handleAdd = () => {
    append({ type: 'BLIND', name: '', duration: 15, smallBlind: 25, bigBlind: 50, ante: 0 });
  };

  const handleAddBreak = () => {
    append({ type: 'BREAK', name: '', duration: 10, smallBlind: undefined, bigBlind: undefined, ante: undefined });
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Levels
        </Typography>
      </Stack>

      <TableContainer sx={{ border: (theme) => `1px solid ${theme.vars.palette.divider}`, borderRadius: 1 }}>
        <Table size="small" sx={{minWidth: '700px'}}>
          <TableHead>
            <TableRow>
              <TableCell>Level</TableCell>
              <TableCell>Small blind</TableCell>
              <TableCell>Big blind</TableCell>
              <TableCell>Ante</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(() => {
              let blindCount = 0;
              return fields.map((field, index) => {
                const currentType = watchedLevels?.[index]?.type;
                const isBreak = currentType === 'BREAK';
                if (!isBreak) blindCount += 1;
                const blindLabel = `Level ${blindCount}`;

                // Dòng BREAK: hiển thị label "Break" + input Name full hàng + xoá
                if (isBreak) {
                  return (
                    <TableRow key={field.id}>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Break
                      </TableCell>
                      <TableCell colSpan={4}>
                        <Field.Text
                          name={`levels.${index}.name`}
                          size="small"
                          label="Name"
                          InputLabelProps={{ shrink: true }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton color="error" size="small" onClick={() => remove(index)}>
                          <Iconify icon="mingcute:delete-2-line" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                }

                // Dòng BLIND
                return (
                  <TableRow key={field.id}>
                    <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {blindLabel}
                    </TableCell>
                    <TableCell>
                      <Field.Text
                        name={`levels.${index}.smallBlind`}
                        size="small"
                        type="number"
                        InputLabelProps={{ shrink: true }}
                      />
                    </TableCell>
                    <TableCell>
                      <Field.Text
                        name={`levels.${index}.bigBlind`}
                        size="small"
                        type="number"
                        InputLabelProps={{ shrink: true }}
                      />
                    </TableCell>
                    <TableCell>
                      <Field.Text
                        name={`levels.${index}.ante`}
                        size="small"
                        type="number"
                        InputLabelProps={{ shrink: true }}
                      />
                    </TableCell>
                    <TableCell>
                      <Field.Text
                        name={`levels.${index}.duration`}
                        size="small"
                        type="number"
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">min</InputAdornment>,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton color="error" size="small" onClick={() => remove(index)}>
                        <Iconify icon="mingcute:delete-2-line" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              });
            })()}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack direction="row" spacing={2} justifyContent="flex-end">
      <Button
          variant="soft"
          size="small"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleAddBreak}
        >
          Add Break
        </Button>
        <Button
          variant="soft"
          size="small"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleAdd}
        >
          Add Level
        </Button>
      </Stack>
    </Stack>
  );
}
