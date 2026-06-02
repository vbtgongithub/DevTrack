// missionStore.ts — Consolidated store delegator for backward compatibility
import { useProgressionStore } from './progressionStore.js';
import type { Mission, MissionCategory, MissionPriority, MissionSession, MissionStatus } from './progressionStore.js';

export type { Mission, MissionCategory, MissionPriority, MissionSession, MissionStatus };
export const useMissionStore = useProgressionStore;
