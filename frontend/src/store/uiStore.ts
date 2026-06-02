// uiStore.ts — Consolidated store delegator for backward compatibility
import { useAppStateStore } from './appStateStore.js';
import type { Toast } from './appStateStore.js';

export type { Toast };
export const useUIStore = useAppStateStore;
