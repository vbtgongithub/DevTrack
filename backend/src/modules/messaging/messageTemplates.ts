// src/modules/messaging/messageTemplates.ts — Tone-keyed message templates
// Behavioral messaging templates keyed by tone and context

export interface MessageTemplate {
  tone: 'encouraging' | 'calm' | 'celebratory' | 'gentle-nudge' | 'supportive' | 'silent';
  context: string;
  text: string;
  action?: {
    label: string;
    route: string;
  };
}

export const MESSAGE_TEMPLATES: Record<string, MessageTemplate[]> = {
  streak_at_risk: [
    {
      tone: 'gentle-nudge',
      context: 'streak_at_risk',
      text: 'Your streak is at risk today. A quick solve keeps the momentum going.',
      action: {
        label: 'Go to Workspace',
        route: '/dsa',
      },
    },
    {
      tone: 'supportive',
      context: 'streak_at_risk',
      text: 'Life happens. If you can, drop by today to protect your streak.',
    },
  ],
  comeback: [
    {
      tone: 'encouraging',
      context: 'comeback',
      text: 'Welcome back! Your streak is waiting. Ready to pick up where you left off?',
      action: {
        label: 'Continue',
        route: '/dsa',
      },
    },
    {
      tone: 'calm',
      context: 'comeback',
      text: 'Good to see you again. Your progress is still here whenever you\'re ready.',
    },
  ],
  level_up: [
    {
      tone: 'celebratory',
      context: 'level_up',
      text: 'Level up! You\'ve unlocked new potential.',
    },
  ],
  milestone_reached: [
    {
      tone: 'celebratory',
      context: 'milestone_reached',
      text: 'Milestone achieved! You\'re making great progress.',
    },
  ],
  fatigue_warning: [
    {
      tone: 'calm',
      context: 'fatigue_warning',
      text: 'Taking a break is part of the journey. Rest when you need to.',
    },
  ],
  goal_completed: [
    {
      tone: 'celebratory',
      context: 'goal_completed',
      text: 'Goal completed! Excellent work.',
    },
  ],
  challenge_completed: [
    {
      tone: 'celebratory',
      context: 'challenge_completed',
      text: 'Challenge conquered! You\'re pushing your limits.',
    },
  ],
};

export function getTemplate(context: string, tone: string): MessageTemplate | null {
  const templates = MESSAGE_TEMPLATES[context];
  if (!templates) return null;
  
  // Try to find exact tone match
  const exactMatch = templates.find((t) => t.tone === tone);
  if (exactMatch) return exactMatch;
  
  // Fallback to first template
  return templates[0] || null;
}
