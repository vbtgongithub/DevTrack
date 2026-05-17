import { useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { useUIStore } from '../store/uiStore';
import { useSse } from '../hooks/useSse';
import { useUserObservation } from '../hooks/useUserObservation';
import { initTelemetry } from '../lib/telemetry';
import { telemetry } from '../lib/telemetry/analytics';
import { RealtimeLayer } from './RealtimeLayer';
import { RuntimeDebugPanel } from '../features/debug/RuntimeDebugPanel';

interface AppProvidersProps {
  children: React.ReactNode;
}

/** Wires theme, SSE, and lightweight telemetry for authenticated sessions */
export function AppProviders({ children }: AppProvidersProps) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const setTheme = useUIStore((s) => s.setTheme);

  useSse({ enabled: isAuthenticated });
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
    </>
  );
}
