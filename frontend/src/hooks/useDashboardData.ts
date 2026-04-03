// ============================================================================
// useDashboardData.ts — Dashboard Data Hook
// ============================================================================

import { useEffect, useCallback, useRef } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { useUserStore } from '../store/userStore';
import { fetchDashboard } from '../services/dashboardService';
import { transformDashboard } from '../viewmodels/dashboardVM';
import { isStale, TTL } from '../utils/stale';
import type { DashboardVM, HookReturn } from '../types/vm.types';
import type { ApiDashboardResponse, ApiError, ApiUser } from '../types/api.types';

const DEV_MODE = true;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

export function useDashboardData(): HookReturn<DashboardVM> {
  const {
    data,
    status,
    error,
    lastFetchedAt,
    setData,
    setStatus,
    setError,
  } = useDashboardStore();

  const user = useUserStore((s) => s.user);

  const retriesRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const fetchDataRef = useRef<(bypassCache?: boolean) => Promise<void>>(async () => {});

  const fetchData = useCallback(
    async (bypassCache: boolean = false) => {
      // Skip if cache is still fresh
      if (!bypassCache && !isStale(lastFetchedAt, TTL.DEFAULT)) {
        return;
      }

      setStatus('loading');

      // 🔥 DEV MODE (NO AUTH, NO BACKEND)
      if (!user && DEV_MODE) {
        try {
          const mockUser: ApiUser = {
            id: 'dev-user',
            email: 'dev@example.com',
            username: 'Varshith',
            displayName: 'Varshith',
            avatarUrl: null,
            bio: null,
            timezone: 'UTC',
            joinedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            isEmailVerified: true,
            role: 'user',
          };

          const mockResponse: ApiDashboardResponse = {
            stats: {
              totalProblems: 320,
              totalSubmissions: 500,
              totalActiveDays: 120,
              currentStreak: 5,
              longestStreak: 12,
              totalProjects: 6,
              totalCommits: 250,
              totalPullRequests: 30,
              totalContributions: 400,
            },
            streak: {
              currentStreak: 5,
              longestStreak: 12,
              lastActiveDate: new Date().toISOString(),
              streakStartDate: new Date().toISOString(),
              isActiveToday: true,
              streakHistory: [],
            },
            platformStats: [],
            missions: [],
            recentActivity: [],
          };

          const now = Date.now();

          const vm = transformDashboard(
            mockResponse,
            mockUser,
            now
          );

          if (!vm) {
            throw new Error('VM transformation failed');
          }

          console.log('FINAL VM:', vm);

          setData(vm);
          setStatus('success');
          retriesRef.current = 0;

          return;
        } catch (err) {
          console.error('❌ DEV MODE ERROR:', err);
          setError('Failed to load mock dashboard');
          setStatus('error');
          return;
        }
      }

      // ❌ No user & not in DEV mode
      if (!user) {
        setError('User not authenticated');
        setStatus('error');
        return;
      }

      // Cancel previous request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const response = await fetchDashboard();

        const now = Date.now();

        const vm = transformDashboard(
          response.data,
          user,
          now
        );

        if (!vm) {
          throw new Error('VM transformation failed');
        }

        console.log('FINAL VM:', vm);

        setData(vm);
        setStatus('success');
        retriesRef.current = 0;
      } catch (err) {
        const apiError = err as ApiError;
        const message = apiError?.message || 'Failed to load dashboard';

        // Retry only for server errors
        if (
          retriesRef.current < MAX_RETRIES &&
          (apiError?.statusCode >= 500 || apiError?.code === 'UNKNOWN_ERROR')
        ) {
          retriesRef.current++;

          setTimeout(() => {
            void fetchDataRef.current(true);
          }, RETRY_DELAY_MS * retriesRef.current);

          return;
        }

        setError(message);
        setStatus('error');
        retriesRef.current = 0;
      }
    },
    [lastFetchedAt, user, setData, setStatus, setError]
  );

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  fetchDataRef.current = fetchData;

  useEffect(() => {
    fetchData();

    return () => {
      abortRef.current?.abort();
    };
  }, [fetchData]);

  const refresh = useCallback(() => {
    retriesRef.current = 0;
    fetchData(true);
  }, [fetchData]);

  return { data, status, error, refresh };
}