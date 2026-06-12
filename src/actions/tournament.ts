import type { ITournamentItem } from 'src/types/tournament';
import type { PaginationParams } from 'src/services/types';

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
