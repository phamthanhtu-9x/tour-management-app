import type { DefaultLevelItemDto } from 'src/services/types';

import useSWR from 'swr';
import { useMemo } from 'react';

import { setupService } from 'src/services';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

const DEFAULT_LEVELS_KEY = 'setup/default-level';

/** Bóc danh sách levels từ envelope `ApiResponse`, chuẩn hoá về mảng. */
function extractLevels(res: any): DefaultLevelItemDto[] {
  const data = res?.data ?? res;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.levels)) return data.levels;

  return [];
}

// ----------------------------------------------------------------------

export function useGetDefaultLevels() {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    DEFAULT_LEVELS_KEY,
    () => setupService.getDefaultLevels(),
    swrOptions
  );

  const memoizedValue = useMemo(() => {
    const levels = extractLevels(data);

    return {
      levels,
      levelsLoading: isLoading,
      levelsError: error,
      levelsValidating: isValidating,
      levelsEmpty: !isLoading && !levels.length,
      levelsMutate: mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}
