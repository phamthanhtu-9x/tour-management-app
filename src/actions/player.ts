import type { IPlayerItem } from 'src/types/player';
import type { PaginationParams } from 'src/services/types';

import useSWR from 'swr';
import { useMemo } from 'react';

import { playerService, extractData, extractItems, extractMeta } from 'src/services';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

/** Danh sách người chơi (có phân trang). */
export function useGetPlayers(params?: PaginationParams) {
  const key: any = params ? ['players', params] : 'players';

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    key,
    () => playerService.getPlayers(params),
    swrOptions
  );

  const memoizedValue = useMemo(() => {
    const players = extractItems<IPlayerItem>(data);
    const meta = extractMeta(data);

    return {
      players,
      playersTotal: meta?.totalItems ?? 0,
      playersMeta: meta,
      playersLoading: isLoading,
      playersError: error,
      playersValidating: isValidating,
      playersEmpty: !isLoading && !players.length,
      playersMutate: mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

/** Chi tiết một người chơi (dùng cho modal detail). Chỉ fetch khi có id. */
export function useGetPlayer(id: number | undefined) {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    id ? ['player', id] : null,
    () => playerService.getPlayerById(id!),
    swrOptions
  );

  const memoizedValue = useMemo(() => {
    const player = extractData<IPlayerItem>(data);

    return {
      player,
      playerLoading: isLoading,
      playerError: error,
      playerValidating: isValidating,
      playerMutate: mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}
