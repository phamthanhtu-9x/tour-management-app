import type { DefaultLevelItemDto } from 'src/services/types';

import useSWR from 'swr';
import { useMemo } from 'react';

import { setupService, extractItems } from 'src/services';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

const DEFAULT_LEVELS_KEY = 'setup/default-level';

// ----------------------------------------------------------------------

export function useGetDefaultLevels() {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    DEFAULT_LEVELS_KEY,
    () => setupService.getDefaultLevels(),
    swrOptions
  );

  const memoizedValue = useMemo(() => {
    const levels = extractItems<DefaultLevelItemDto>(data);

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
