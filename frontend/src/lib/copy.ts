/** Calm, emotionally intelligent product copy — no guilt, no urgency, supportive */

import type { RuntimeState } from '../hooks/useRuntimeState';
import { getCopyTemplate } from './copy-templates';

export const copy = {
  dashboard: {
    loading: 'Preparing your workspace…',
    error: 'We could not sync your progress. A quick refresh usually helps.',
    emptyGoals: 'Your next goal will appear as you practice in the workspace.',
    emptyActivity: 'Activity will show up as you solve problems and sync platforms.',
    welcomeBack: 'Welcome back. Your momentum is waiting.',
  },
  workspace: {
    subtitle: 'A quiet place to practice — progress stays visible, never loud.',
    streakStart: 'One problem today is enough to begin.',
    streakSteady: 'You are building a steady rhythm.',
    streakAtRisk: 'A short session keeps your rhythm intact.',
    sessionQuiet: 'Session rhythm',
    live: 'Synced',
    focusHint: 'Focus on the problem, not the progress.',
  },
  progress: {
    title: 'Your journey',
    subtitle: 'A calm record of consistency — not a scoreboard.',
    timelineEmpty: 'Milestones appear as you keep showing up.',
    achievementsEmpty: 'Achievements unlock quietly along the way.',
    consistency: 'Consistency matters more than intensity.',
  },
  notifications: {
    emptyTitle: 'You are all caught up',
    emptyBody: 'We only surface updates that support your focus.',
    digest: 'Recent updates',
  },
  toast: {
    xp: (n: number) => `+${n} XP — steady progress`,
    streak: 'Streak continued',
    goal: 'Goal complete',
    achievement: 'Achievement unlocked',
    reconnect: 'Back in sync',
    offline: 'Working offline — we will catch up when you reconnect',
    comeback: 'Welcome back — your rhythm is intact',
    milestone: 'Milestone reached',
  },
  empty: {
    defaultTitle: 'Nothing here yet',
    defaultBody: 'That is okay. Start with one small step in the workspace.',
    encouraging: 'Every expert was once a beginner.',
  },
  comeback: {
    title: 'Welcome back',
    subtitle: 'Your progress is preserved. Pick up where you left off.',
    cta: 'Continue practicing',
  },
  fatigue: {
    title: 'Take a break',
    subtitle: 'Rest is part of the process. Your progress will be here when you return.',
  },
} as const;

/**
 * Resolve copy dynamically based on user state and context
 * Returns tone-appropriate copy for behavioral messaging
 */
export function resolveCopy(state: RuntimeState | null, context: string): string {
  if (!state) {
    // Fallback to static copy if no state available
    const staticCopy = (copy as Record<string, unknown>)[context];
    if (typeof staticCopy === 'string') return staticCopy;
    return '';
  }

  // Determine tone based on user state
  const tone = determineTone(state);

  // Get template for context and tone
  const template = getCopyTemplate(context, tone);
  if (template) {
    return template.text;
  }

  // Fallback to static copy
  const staticCopy = (copy as Record<string, unknown>)[context];
  if (typeof staticCopy === 'string') return staticCopy;
  return '';
}

/**
 * Determine message tone based on user emotional and fatigue state
 */
function determineTone(state: RuntimeState): string {
  const { emotionalState, fatigueState, recoveryState } = state;

  // Recovery state takes precedence
  if (recoveryState === 'active') {
    return 'encouraging';
  }

  // High fatigue → calm tone
  if (fatigueState === 'high' || fatigueState === 'burnout') {
    return 'calm';
  }

  // Emotional state mapping
  switch (emotionalState) {
    case 'discouraged':
    case 'overwhelmed':
      return 'supportive';
    case 'motivated':
      return 'celebratory';
    case 'focused':
      return 'calm';
    case 'neutral':
      return 'encouraging';
    default:
      return 'encouraging';
  }
}
