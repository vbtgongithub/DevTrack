import { useEffect } from 'react';
import { useMissionStore } from '../store/missionStore';
import { useRIEStore } from './rieStore';

/**
 * Top-level synchronization hook.
 * Mount this once in the root of the application (e.g., App.tsx or a global provider)
 * to ensure the Runtime Intelligence Engine continuously analyzes telemetry
 * whenever the underlying data stores change.
 */
export const useSyncIntelligence = () => {
  const missions = useMissionStore(state => state.missions);
  const syncTelemetry = useRIEStore(state => state.syncTelemetry);

  useEffect(() => {
    // Whenever missions change (e.g., a focus session is logged, a mission is updated),
    // sync the new data to the RIE for analysis.
    syncTelemetry(missions);
  }, [missions, syncTelemetry]);
};
