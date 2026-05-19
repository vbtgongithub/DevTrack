// ============================================================================
// gamificationStore.ts — Live Gamification State (SSE-driven)
// ============================================================================
// Holds real-time XP, level, streak data updated via SSE events.
// Manages overlay visibility for level-up, streak milestone, achievement celebrations.
// ============================================================================

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Level name system — matches backend XP_LEVEL_THRESHOLDS
// ---------------------------------------------------------------------------

export const LEVEL_NAMES: Record<number, { name: string; title: string; color: string }> = {
  1:  { name: 'Newcomer',       title: 'Just getting started',    color: '#94A3B8' },
  2:  { name: 'Initiate',       title: 'Building the habit',      color: '#64748B' },
  3:  { name: 'Apprentice',     title: 'Consistency forming',     color: '#3B82F6' },
  4:  { name: 'Developer',      title: 'Solving real problems',   color: '#06B6D4' },
  5:  { name: 'Engineer',       title: 'Thinking in systems',     color: '#8B5CF6' },
  6:  { name: 'Senior Dev',     title: 'Patterns recognized',     color: '#7C5CFC' },
  7:  { name: 'Tech Lead',      title: 'Mentoring through code',  color: '#6D28D9' },
  8:  { name: 'Architect',      title: 'Designing at scale',      color: '#F59E0B' },
  9:  { name: 'Principal',      title: 'Shaping the roadmap',     color: '#F97316' },
  10: { name: 'Staff Engineer', title: 'Multiplying impact',      color: '#EF4444' },
  11: { name: 'Distinguished',  title: 'Industry recognized',     color: '#EC4899' },
  12: { name: 'Fellow',         title: 'Defining the craft',      color: '#10B981' },
  13: { name: 'Legend',         title: 'Inspiring thousands',     color: '#F59E0B' },
  14: { name: 'Grandmaster',    title: 'Beyond the algorithm',    color: '#8B5CF6' },
  15: { name: 'Mythic',         title: 'The 0.1%',                color: '#7C5CFC' },
};

export function getLevelInfo(level: number) {
  return LEVEL_NAMES[level] ?? LEVEL_NAMES[1]!;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AchievementPayload {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface LevelUpData {
  newLevel: number;
  totalXp: number;
}

interface GamificationState {
  // Live values (optimistically updated on SSE)
  liveXp: number | null;
  liveLevel: number | null;
  liveStreak: number | null;

  // Pending animation data
  pendingXpGain: number | null;

  // Overlay visibility
  showLevelUpOverlay: boolean;
  levelUpData: LevelUpData | null;

  showStreakMilestoneOverlay: boolean;
  streakMilestoneData: { days: number } | null;

  showAchievementOverlay: boolean;
  achievementData: AchievementPayload | null;

  // Actions — called from SSE event handlers
  setLiveXp: (xp: number) => void;
  setLiveLevel: (level: number) => void;
  setLiveStreak: (streak: number) => void;
  setPendingXpGain: (gain: number | null) => void;

  triggerLevelUp: (newLevel: number, totalXp: number) => void;
  dismissLevelUp: () => void;

  triggerStreakMilestone: (days: number) => void;
  dismissStreakMilestone: () => void;

  triggerAchievementUnlock: (payload: AchievementPayload) => void;
  dismissAchievement: () => void;

  reset: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const initialState = {
  liveXp: null as number | null,
  liveLevel: null as number | null,
  liveStreak: null as number | null,
  pendingXpGain: null as number | null,
  showLevelUpOverlay: false,
  levelUpData: null as LevelUpData | null,
  showStreakMilestoneOverlay: false,
  streakMilestoneData: null as { days: number } | null,
  showAchievementOverlay: false,
  achievementData: null as AchievementPayload | null,
};

export const useGamificationStore = create<GamificationState>((set) => ({
  ...initialState,

  setLiveXp: (xp) => set({ liveXp: xp }),
  setLiveLevel: (level) => set({ liveLevel: level }),
  setLiveStreak: (streak) => set({ liveStreak: streak }),

  setPendingXpGain: (gain) => set({ pendingXpGain: gain }),

  triggerLevelUp: (newLevel, totalXp) =>
    set({
      showLevelUpOverlay: true,
      levelUpData: { newLevel, totalXp },
      liveLevel: newLevel,
    }),

  dismissLevelUp: () =>
    set({ showLevelUpOverlay: false, levelUpData: null }),

  triggerStreakMilestone: (days) =>
    set({
      showStreakMilestoneOverlay: true,
      streakMilestoneData: { days },
      liveStreak: days,
    }),

  dismissStreakMilestone: () =>
    set({ showStreakMilestoneOverlay: false, streakMilestoneData: null }),

  triggerAchievementUnlock: (payload) =>
    set({
      showAchievementOverlay: true,
      achievementData: payload,
    }),

  dismissAchievement: () =>
    set({ showAchievementOverlay: false, achievementData: null }),

  reset: () => set(initialState),
}));
