import type { IPlayerItem } from 'src/types/player';
import type { PaginationParams } from 'src/services/types';

import useSWR from 'swr';
import { useMemo } from 'react';

import { playerService } from 'src/services';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

/** Bóc danh sách players từ envelope ApiResponse hoặc mảng trực tiếp. */
function extractPlayers(res: any): IPlayerItem[] {
  const data = res?.data ?? res;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.players)) return data.players;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

/** Trả về tổng số bản ghi từ envelope phân trang (`data.meta.totalItems`). */
function extractTotal(res: any): number {
  const data = res?.data ?? res;

  return (
    data?.meta?.totalItems ??
    data?.total ??
    (Array.isArray(data?.items) ? data.items.length : undefined) ??
    (Array.isArray(data) ? data.length : 0)
  );
}

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
    const players = extractPlayers(data);
    const total = extractTotal(data);

    return {
      players,
      playersTotal: total,
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
    const player = data?.data ?? data ?? null;

    return {
      player: player as IPlayerItem | null,
      playerLoading: isLoading,
      playerError: error,
      playerValidating: isValidating,
      playerMutate: mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}
