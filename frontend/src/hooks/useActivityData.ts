// ============================================================================
// useActivityData.ts — Activity Data Hook
// ============================================================================
// Fetches from unified endpoint: GET /api/activity
// Returns { events, heatmap } in a single call.
// No mocks. No localStorage.
// ============================================================================

import { useEffect, useCallback, useRef } from 'react';
import axiosClient from '../utils/axiosClient';
import { useUserStore } from '../store/userStore';
import { useActivityStore } from '../store/activityStore';
import type { ActivityPageVM } from '../types/vm.types';

export interface ActivityEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  platform: string;
  url: string | null;
  tags: string[];
  metadata: Record<string, string | number | boolean>;
  occurredAt: string;
}

interface UseActivityDataReturn {
  events: ActivityEvent[];
  heatmapSummary: Record<string, number>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useActivityData(): UseActivityDataReturn {
  const userId = useUserStore((s) => s.user?.id ?? null);
  const store = useActivityStore();
  const abortRef = useRef<AbortController | null>(null);

  const fetchActivity = useCallback(() => {
    if (!userId) {
      useActivityStore.getState().reset();
      return;
    }

    const state = useActivityStore.getState();
    if (state.status === 'loading') return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    useActivityStore.getState().setStatus('loading');
    useActivityStore.getState().setError(null);

    axiosClient
      .get('/activity', { signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return;
        const data = res.data?.data;
        // Map to the shape expected by the store/VM
        useActivityStore.getState().setData({
          heatmap: {
            year: new Date().getFullYear(),
            days: [], // HeatmapDayVM[]
            monthLabels: [],
            weekdayLabels: [],
            totalContributions: "0",
            legendLevels: []
          },
          feed: {
            items: [],
            hasMore: false,
            currentPage: 1,
            totalPages: 1
          },
          summary: {
            totalActivities: "0",
            activeDays: "0",
            currentStreak: "0",
            longestStreak: "0",
            mostActiveDay: "Unknown",
            avgPerDay: "0",
            platformBreakdown: [],
            typeBreakdown: []
          },
          filters: {
            platforms: [],
            types: [],
            dateRanges: []
          },
          // Custom fields for this hook
          _rawEvents: data?.events || [],
          _rawHeatmap: data?.heatmap || {}
        } as unknown as ActivityPageVM);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : 'Failed to load activity data';
        useActivityStore.getState().setError(message);
      });
  }, [userId]);

  useEffect(() => {
    if (userId && (!store.data || store.lastFetchedAt === null) && store.status !== 'loading') {
      fetchActivity();
    }
  }, [userId, fetchActivity, store.data, store.status, store.lastFetchedAt]);

  // Refetch when sync completes
  useEffect(() => {
    const handler = () => fetchActivity();
    window.addEventListener('devtrack:activity-invalidate', handler);
    return () => window.removeEventListener('devtrack:activity-invalidate', handler);
  }, [fetchActivity]);

  return {
    events: (store.data as unknown as Record<string, unknown>)?._rawEvents as ActivityEvent[] || [],
    heatmapSummary: (store.data as unknown as Record<string, unknown>)?._rawHeatmap as Record<string, number> || {},
    loading: store.status === 'loading',
    error: store.error,
    refetch: fetchActivity
  };
}
