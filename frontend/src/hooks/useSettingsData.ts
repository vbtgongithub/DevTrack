// ============================================================================
// useSettingsData.ts — Settings Data Hook
// ============================================================================
// The ONLY place where services are called for settings.
// Integrates: service → ViewModel → exposes HookReturn.
// ============================================================================

import { useEffect, useCallback, useRef, useState } from 'react';
import { fetchSettings } from '../services/settingsService';
import { transformSettingsPage } from '../viewmodels/settingsVM';
import { isStale, TTL } from '../utils/stale';
import type { SettingsPageVM, HookReturn, DataStatus } from '../types/vm.types';
import type { ApiError } from '../types/api.types';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

export function useSettingsData(
  activeTab: string = 'profile'
): HookReturn<SettingsPageVM> & {
  setActiveTab: (tab: string) => void;
} {
  const [data, setData] = useState<SettingsPageVM | null>(null);
  const [status, setStatus] = useState<DataStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const [currentTab, setCurrentTab] = useState(activeTab);

  const retriesRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const fetchDataRef = useRef<(bypassCache?: boolean) => Promise<void>>(async () => {});

  const fetchData = useCallback(
    async (bypassCache: boolean = false) => {
      if (!bypassCache && !isStale(lastFetchedAt, TTL.LONG)) {
        // If data exists but tab changed, just update the tab in VM
        if (data && data.activeTab !== currentTab) {
          setData({ ...data, activeTab: currentTab });
        }
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setStatus('loading');

      try {
        const response = await fetchSettings();
        const now = Date.now();
        const vm = transformSettingsPage(response.data, currentTab, now);
        setData(vm);
        setStatus('success');
        setError(null);
        setLastFetchedAt(now);
        retriesRef.current = 0;
      } catch (err) {
        const apiError = err as ApiError;
        const message = apiError.message || 'Failed to load settings';

        if (
          retriesRef.current < MAX_RETRIES &&
          (apiError.statusCode >= 500 || apiError.code === 'UNKNOWN_ERROR')
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
    [lastFetchedAt, currentTab, data]
  );

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchData]);

  const refresh = useCallback(() => {
    retriesRef.current = 0;
    fetchData(true);
  }, [fetchData]);

  const setActiveTab = useCallback(
    (tab: string) => {
      setCurrentTab(tab);
      if (data) {
        setData({ ...data, activeTab: tab });
      }
    },
    [data]
  );

  return { data, status, error, refresh, setActiveTab };
}
