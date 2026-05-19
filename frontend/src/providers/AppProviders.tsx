import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '../store/userStore';
import { useUIStore } from '../store/uiStore';
import { useSse } from '../hooks/useSse';
import { useUserObservation } from '../hooks/useUserObservation';
import { initTelemetry } from '../lib/telemetry';
import { telemetry } from '../lib/telemetry/analytics';
import { handleSseEvent } from '../features/realtime/eventHandlers';
import { RealtimeLayer } from './RealtimeLayer';
import { RuntimeDebugPanel } from '../features/debug/RuntimeDebugPanel';
import { LevelUpOverlay } from '../features/gamification/overlays/LevelUpOverlay';
import { StreakMilestoneOverlay } from '../features/gamification/overlays/StreakMilestoneOverlay';
import { AchievementUnlockOverlay } from '../features/gamification/overlays/AchievementUnlockOverlay';

interface AppProvidersProps {
  children: React.ReactNode;
}

/** Wires theme, SSE, and lightweight telemetry for authenticated sessions */
export function AppProviders({ children }: AppProvidersProps) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const setTheme = useUIStore((s) => s.setTheme);
  const queryClient = useQueryClient();

  useSse({
    enabled: isAuthenticated,
    onEvent: (event) => handleSseEvent(event, queryClient),
  });
  useUserObservation(isAuthenticated);

  useEffect(() => {
    initTelemetry();
    setTheme('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  }, [setTheme]);

  useEffect(() => {
    if (isAuthenticated) {
      telemetry.initialize();
    } else {
      telemetry.destroy();
    }
    return () => {
      telemetry.destroy();
    };
  }, [isAuthenticated]);

  return (
    <>
      {children}
      <RealtimeLayer />
      <RuntimeDebugPanel />
      {/* Gamification celebration overlays — rendered above everything */}
      <LevelUpOverlay />
      <StreakMilestoneOverlay />
      <AchievementUnlockOverlay />
    </>
  );
}
