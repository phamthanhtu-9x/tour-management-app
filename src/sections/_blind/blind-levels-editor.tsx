import { z as zod } from 'zod';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';
import { Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const levelItemSchema = zod
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

export const BlindLevelsSchema = zod.object({
  levels: zod.array(levelItemSchema).min(1, { message: 'Must have at least 1 level' }),
});

export type BlindLevelsSchemaType = zod.infer<typeof BlindLevelsSchema>;

// ----------------------------------------------------------------------

export function LevelsEditor() {
  const { control, watch, setValue } = useFormContext<BlindLevelsSchemaType>();

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
      <TableContainer sx={{ border: (theme) => `1px solid ${theme.vars.palette.divider}`, borderRadius: 1 }}>
        <Table size="medium" sx={{ minWidth: 520, tableLayout: 'auto' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 80, width: '10%' }}>Level</TableCell>
              <TableCell sx={{ width: '60%' }}>Small/Big/Ante</TableCell>
              <TableCell sx={{ minWidth: 116, width: '15%' }}>Duration</TableCell>
              <TableCell sx={{ minWidth: 80, width: '15%' }} align="center">
                Action
              </TableCell>
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

                // Dòng BREAK: hiển thị label "Break" + input Name + Duration + xoá
                if (isBreak) {
                  return (
                    <TableRow key={field.id}>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Break
                      </TableCell>
                      <TableCell>
                        <Field.Text
                          name={`levels.${index}.name`}
                          size="small"
                          label="Name"
                          InputLabelProps={{ shrink: true }}
                          sx={{ width: '100%' }}
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
                          sx={{ width: '100%' }}
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
                      <TextField
                        fullWidth
                        size="small"
                        value={`${watchedLevels?.[index]?.smallBlind ?? ''}/${watchedLevels?.[index]?.bigBlind ?? ''}/${watchedLevels?.[index]?.ante ?? ''}`}
                        onChange={(e) => {
                          const parts = e.target.value.split('/');
                          if (parts.length >= 3) {
                            setValue(`levels.${index}.smallBlind`, Number(parts[0]) || 0, { shouldDirty: true });
                            setValue(`levels.${index}.bigBlind`, Number(parts[1]) || 0, { shouldDirty: true });
                            setValue(`levels.${index}.ante`, Number(parts[2]) || 0, { shouldDirty: true });
                          }
                        }}
                        placeholder="SB/BB/Ante"
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
                        sx={{ width: '100%' }}
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
