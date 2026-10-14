import type { ITournamentItem } from 'src/types/tournament';
import type {
  EntryLogsData,
  PaginationParams,
  TourControlData,
  TourLevelItemDto,
} from 'src/services/types';

import useSWR from 'swr';
import { useMemo } from 'react';

import { tourService, extractData, extractItems, extractMeta } from 'src/services';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

/** Danh sách tournament (có phân trang). */
export function useGetTournaments(params?: PaginationParams) {
  const key: any = params ? ['tournaments', params] : 'tournaments';

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    key,
    () => tourService.getTours(params),
    swrOptions
  );

  const memoizedValue = useMemo(() => {
    const tournaments = extractItems<ITournamentItem>(data);
    const meta = extractMeta(data);

    return {
      tournaments,
      tournamentsTotal: meta?.totalItems ?? 0,
      tournamentsMeta: meta,
      tournamentsLoading: isLoading,
      tournamentsError: error,
      tournamentsValidating: isValidating,
      tournamentsEmpty: !isLoading && !tournaments.length,
      tournamentsMutate: mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

/** Chi tiết một tournament. Chỉ fetch khi có id. */
export function useGetTournament(id: number | undefined) {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    id ? ['tournament', id] : null,
    () => tourService.getTourById(id!),
    swrOptions
  );

  const memoizedValue = useMemo(() => {
    const tournament = extractData<ITournamentItem>(data);

    return {
      tournament,
      tournamentLoading: isLoading,
      tournamentError: error,
      tournamentValidating: isValidating,
      tournamentMutate: mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Control data của một tournament (entries, clock state...). Chỉ fetch khi có id.
 * `refreshInterval` (ms): tự gọi lại định kỳ – dùng làm dự phòng khi mất WebSocket.
 */
export function useGetTourControl(id: number | undefined, options?: { refreshInterval?: number }) {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    id ? ['tournament-control', id] : null,
    () => tourService.getTourControl(id!),
    { ...swrOptions, refreshInterval: options?.refreshInterval ?? 0 }
  );

  const memoizedValue = useMemo(() => {
    const control = extractData<TourControlData>(data);

    return {
      control,
      controlLoading: isLoading,
      controlError: error,
      controlValidating: isValidating,
      controlMutate: mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

/** Danh sách level (blind structure) của một tournament. Chỉ fetch khi có id. */
export function useGetTourLevels(id: number | undefined) {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    id ? ['tournament-levels', id] : null,
    () => tourService.getTourLevels(id!),
    swrOptions
  );

  const memoizedValue = useMemo(() => {
    const levels = extractItems<TourLevelItemDto>(data);

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

// ----------------------------------------------------------------------

/**
 * Log thao tác entries của một tournament (mới nhất trước) + cờ canUndo.
 * Dùng làm dự phòng khi không có WebSocket (bình thường log đến qua event `tour-log`).
 */
export function useGetTourEntryLogs(
  id: number | undefined,
  options?: { refreshInterval?: number }
) {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    id ? ['tournament-entry-logs', id] : null,
    () => tourService.getEntryLogs(id!),
    { ...swrOptions, refreshInterval: options?.refreshInterval ?? 0 }
  );

  const memoizedValue = useMemo(() => {
    const result = extractData<EntryLogsData>(data);
    const logs = result?.logs ?? [];

    return {
      logs,
      canUndo: result?.canUndo ?? false,
      undoableLogIds: result?.undoableLogIds ?? [],
      logsLoading: isLoading,
      logsError: error,
      logsValidating: isValidating,
      logsEmpty: !isLoading && !logs.length,
      logsMutate: mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}
