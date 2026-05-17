// src/lib/copy-templates.ts — Tone-keyed message templates for frontend
// Behavioral copy templates keyed by tone and context

export interface CopyTemplate {
  tone: 'encouraging' | 'calm' | 'celebratory' | 'gentle-nudge' | 'supportive' | 'silent';
  context: string;
  text: string;
}

export const COPY_TEMPLATES: Record<string, CopyTemplate[]> = {
  streak_at_risk: [
    {
      tone: 'gentle-nudge',
      context: 'streak_at_risk',
      text: 'Your streak is at risk today. A quick solve keeps the momentum going.',
    },
    {
      tone: 'supportive',
      context: 'streak_at_risk',
      text: 'Life happens. If you can, drop by today to protect your streak.',
    },
    {
      tone: 'calm',
      context: 'streak_at_risk',
      text: 'A short session keeps your rhythm intact.',
    },
  ],
  comeback: [
    {
      tone: 'encouraging',
      context: 'comeback',
      text: 'Welcome back! Your streak is waiting. Ready to pick up where you left off?',
    },
    {
      tone: 'calm',
      context: 'comeback',
      text: 'Good to see you again. Your progress is still here whenever you\'re ready.',
    },
    {
      tone: 'supportive',
      context: 'comeback',
      text: 'Welcome back — your rhythm is intact.',
    },
  ],
  level_up: [
    {
      tone: 'celebratory',
      context: 'level_up',
      text: 'Level up! You\'ve unlocked new potential.',
    },
    {
      tone: 'encouraging',
      context: 'level_up',
      text: 'You\'ve reached a new level. Keep going!',
    },
  ],
  milestone_reached: [
    {
      tone: 'celebratory',
      context: 'milestone_reached',
      text: 'Milestone achieved! You\'re making great progress.',
    },
    {
      tone: 'encouraging',
      context: 'milestone_reached',
      text: 'You\'re making steady progress.',
    },
  ],
  fatigue_warning: [
    {
      tone: 'calm',
      context: 'fatigue_warning',
      text: 'Taking a break is part of the journey. Rest when you need to.',
    },
    {
      tone: 'supportive',
      context: 'fatigue_warning',
      text: 'Rest is part of the process. Your progress will be here when you return.',
    },
  ],
  goal_completed: [
    {
      tone: 'celebratory',
      context: 'goal_completed',
      text: 'Goal completed! Excellent work.',
    },
    {
      tone: 'encouraging',
      context: 'goal_completed',
      text: 'You did it! One step closer to your goals.',
    },
  ],
  challenge_completed: [
    {
      tone: 'celebratory',
      context: 'challenge_completed',
      text: 'Challenge conquered! You\'re pushing your limits.',
    },
    {
      tone: 'encouraging',
      context: 'challenge_completed',
      text: 'Challenge complete. You\'re growing stronger.',
    },
  ],
};

export function getCopyTemplate(context: string, tone: string): CopyTemplate | null {
  const templates = COPY_TEMPLATES[context];
  if (!templates) return null;
  
  // Try to find exact tone match
  const exactMatch = templates.find((t) => t.tone === tone);
  if (exactMatch) return exactMatch;
  
  // Fallback to first template
  return templates[0] || null;
}
