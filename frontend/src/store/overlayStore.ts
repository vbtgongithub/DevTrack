// overlayStore.ts — Consolidated store delegator for backward compatibility
import { useAppStateStore } from './appStateStore.js';
import type { OverlayItem, OverlayType } from './appStateStore.js';

export type { OverlayItem, OverlayType };
export const useOverlayStore = useAppStateStore;
