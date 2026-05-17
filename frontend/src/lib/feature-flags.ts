/** Client-side feature flags — safe defaults when backend flags unavailable */
import { useUserStore } from '../store/userStore';

export type FeatureFlag =
  | 'retention_insights'
  | 'leaderboard'
  | 'achievements_celebration'
  | 'notification_digest'
  | 'admin_panel'
  | 'dense_dashboard';

const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  retention_insights: true,
  leaderboard: true,
  achievements_celebration: true,
  notification_digest: true,
  admin_panel: false,
  dense_dashboard: false,
};

let overrides: Partial<Record<FeatureFlag, boolean>> = {};

export function setFeatureFlagOverrides(next: Partial<Record<FeatureFlag, boolean>>): void {
  overrides = { ...overrides, ...next };
}

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  if (flag === 'admin_panel') {
    const role = useUserStore.getState().user?.role;
    return role === 'admin' || import.meta.env.DEV;
  }
  if (flag in overrides) return Boolean(overrides[flag]);
  return DEFAULT_FLAGS[flag];
}
