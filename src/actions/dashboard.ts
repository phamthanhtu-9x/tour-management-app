import type { DashboardSummary, RunningTourItem, RunningToursData } from 'src/services/types';

import useSWR from 'swr';
import { useMemo } from 'react';

import { extractData, extractItems, dashboardService } from 'src/services';

// ----------------------------------------------------------------------

/** Chu kỳ tự làm mới danh sách tour đang chạy (ms). */
const RUNNING_TOURS_REFRESH_MS = 15000;

// ----------------------------------------------------------------------

/**
 * Danh sách tour đang chạy (gồm cả đang tạm dừng).
 * Tự làm mới mỗi 15s và khi tab quay lại foreground, để level / số người chơi luôn mới.
 */
export function useGetRunningTours() {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    'dashboard-running-tours',
    () => dashboardService.getRunningTours(),
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: RUNNING_TOURS_REFRESH_MS,
    }
  );

  const memoizedValue = useMemo(() => {
    const runningTours = extractItems<RunningTourItem>(data);
    const total = extractData<RunningToursData>(data)?.total ?? runningTours.length;

    return {
      runningTours,
      runningToursTotal: total,
      runningToursLoading: isLoading,
      runningToursError: error,
      runningToursValidating: isValidating,
      runningToursEmpty: !isLoading && !error && !runningTours.length,
      runningToursMutate: mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

/** Thống kê tổng số tour và player. Làm mới khi tab quay lại foreground. */
export function useGetDashboardSummary() {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    'dashboard-summary',
    () => dashboardService.getSummary(),
    { revalidateIfStale: true, revalidateOnFocus: true, revalidateOnReconnect: true }
  );

  const memoizedValue = useMemo(() => {
    const summary = extractData<DashboardSummary>(data);

    return {
      summary,
      summaryLoading: isLoading,
      summaryError: error,
      summaryValidating: isValidating,
      summaryMutate: mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}
