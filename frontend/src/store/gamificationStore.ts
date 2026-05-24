// ============================================================================
// gamificationStore.ts — Live Gamification State (SSE-driven)
// ============================================================================
// Holds real-time XP, level, streak data updated via SSE events.
// Manages overlay queue for level-up, streak milestone, achievement celebrations.
// Only one overlay shows at a time — subsequent overlays are queued.
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

const MAX_LEVEL = 15;

export function getLevelInfo(level: number): { name: string; title: string; color: string } {
  if (level <= MAX_LEVEL) {
    return LEVEL_NAMES[level] ?? LEVEL_NAMES[1]!;
  }
  // Post-cap: use Mythic config with dynamic name
  const mythic = LEVEL_NAMES[MAX_LEVEL]!;
  return {
    name: `Mythic (Lvl ${level})`,
    title: mythic.title,
    color: mythic.color,
  };
}

export function isMaxLevel(level: number): boolean {
  return level >= MAX_LEVEL;
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

export interface ChallengeCompletedPayload {
  challengeId: string;
  title: string;
  xpReward: number;
}

// Overlay queue item — serializes celebrations
export type OverlayType = 'level_up' | 'streak_milestone' | 'achievement_unlocked' | 'challenge_completed';

export interface OverlayItem {
  type: OverlayType;
  data: LevelUpData | { days: number } | AchievementPayload | ChallengeCompletedPayload;
}

// Priority order for overlays (lower = higher priority)
const OVERLAY_PRIORITY: Record<OverlayType, number> = {
  level_up: 0,
  streak_milestone: 1,
  challenge_completed: 2,
  achievement_unlocked: 3,
};

interface GamificationState {
  // Live values (optimistically updated on SSE)
  liveXp: number | null;
  liveLevel: number | null;
  liveStreak: number | null;

  // Pending animation data
  pendingXpGain: number | null;
  pendingXpReason: string | null;

  // Cascade queue for XP gains
  xpRevealQueue: Array<{ gain: number; reason: string | null }>;
  isRevealingXp: boolean;
  sessionXpTotal: number;

  // Overlay queue system — only one overlay at a time
  overlayQueue: OverlayItem[];
  activeOverlay: OverlayItem | null;

  // Actions — called from SSE event handlers
  setLiveXp: (xp: number) => void;
  setLiveLevel: (level: number) => void;
  setLiveStreak: (streak: number) => void;
  setPendingXpGain: (gain: number | null, reason?: string | null) => void;

  enqueueXpReveal: (gain: number, reason: string | null) => void;
  triggerNextXpReveal: () => void;
  resetSessionXpTotal: () => void;

  triggerLevelUp: (newLevel: number, totalXp: number) => void;
  triggerStreakMilestone: (days: number) => void;
  triggerAchievementUnlock: (payload: AchievementPayload) => void;
  triggerChallengeCompleted: (payload: ChallengeCompletedPayload) => void;

  dismissCurrentOverlay: () => void;

  reset: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const OVERLAY_GAP_MS = 500;

const initialState = {
  liveXp: null as number | null,
  liveLevel: null as number | null,
  liveStreak: null as number | null,
  pendingXpGain: null as number | null,
  pendingXpReason: null as string | null,
  xpRevealQueue: [] as Array<{ gain: number; reason: string | null }>,
  isRevealingXp: false,
  sessionXpTotal: 0,
  overlayQueue: [] as OverlayItem[],
  activeOverlay: null as OverlayItem | null,
};

function enqueueOverlay(state: typeof initialState, item: OverlayItem): Partial<typeof initialState> {
  if (state.activeOverlay === null) {
    // No overlay showing — show immediately
    return { activeOverlay: item };
  }
  // Queue it, sorted by priority
  const newQueue = [...state.overlayQueue, item].sort(
    (a, b) => OVERLAY_PRIORITY[a.type] - OVERLAY_PRIORITY[b.type]
  );
  return { overlayQueue: newQueue };
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  ...initialState,

  setLiveXp: (xp) => set({ liveXp: xp }),
  setLiveLevel: (level) => set({ liveLevel: level }),
  setLiveStreak: (streak) => set({ liveStreak: streak }),

  setPendingXpGain: (gain, reason) => set({ pendingXpGain: gain, pendingXpReason: reason || null }),

  enqueueXpReveal: (gain, reason) => {
    set((state) => {
      const xpRevealQueue = [...state.xpRevealQueue, { gain, reason }];
      const sessionXpTotal = state.sessionXpTotal + gain;
      return {
        xpRevealQueue,
        sessionXpTotal,
      };
    });

    if (!get().isRevealingXp) {
      set({ isRevealingXp: true });
      get().triggerNextXpReveal();
    }
  },

  triggerNextXpReveal: () => {
    const { xpRevealQueue, sessionXpTotal } = get();

    if (xpRevealQueue.length === 0) {
      if (sessionXpTotal > 0) {
        // Final grand total summary float
        set({
          pendingXpGain: sessionXpTotal,
          pendingXpReason: 'Total XP Gained',
          isRevealingXp: false,
          sessionXpTotal: 0,
        });
      } else {
        set({
          isRevealingXp: false,
        });
      }
      return;
    }

    const [nextItem, ...remainingQueue] = xpRevealQueue;

    set({
      xpRevealQueue: remainingQueue,
      pendingXpGain: nextItem.gain,
      pendingXpReason: nextItem.reason,
    });

    // Waterfall gap of 1.5s (1200ms animation + 300ms gap)
    setTimeout(() => {
      set({
        pendingXpGain: null,
        pendingXpReason: null,
      });

      setTimeout(() => {
        get().triggerNextXpReveal();
      }, 300);
    }, 1200);
  },

  resetSessionXpTotal: () => {
    set({
      sessionXpTotal: 0,
      xpRevealQueue: [],
      isRevealingXp: false,
      pendingXpGain: null,
      pendingXpReason: null,
    });
  },

  triggerLevelUp: (newLevel, totalXp) =>
    set((state) => ({
      ...enqueueOverlay(state, { type: 'level_up', data: { newLevel, totalXp } }),
      liveLevel: newLevel,
    })),

  triggerStreakMilestone: (days) =>
    set((state) => ({
      ...enqueueOverlay(state, { type: 'streak_milestone', data: { days } }),
      liveStreak: days,
    })),

  triggerAchievementUnlock: (payload) =>
    set((state) =>
      enqueueOverlay(state, { type: 'achievement_unlocked', data: payload })
    ),

  triggerChallengeCompleted: (payload) =>
    set((state) =>
      enqueueOverlay(state, { type: 'challenge_completed', data: payload })
    ),

  dismissCurrentOverlay: () => {
    const { overlayQueue } = get();
    if (overlayQueue.length > 0) {
      // Show next overlay after a gap
      const [next, ...rest] = overlayQueue;
      setTimeout(() => {
        set({ activeOverlay: next, overlayQueue: rest });
      }, OVERLAY_GAP_MS);
      set({ activeOverlay: null });
    } else {
      set({ activeOverlay: null });
    }
  },

  reset: () => set(initialState),
}));
