// Telemetry and analytics system for product validation
// Tracks user behavior, engagement quality, and identifies friction points
import axiosClient from '../../utils/axiosClient';

type TelemetryEvent =
  | 'session_start'
  | 'session_end'
  | 'page_view'
  | 'dsa_problem_view'
  | 'dsa_problem_solve'
  | 'dsa_problem_attempt'
  | 'goal_complete'
  | 'streak_milestone'
  | 'achievement_unlock'
  | 'notification_click'
  | 'search_query'
  | 'keyboard_shortcut'
  | 'navigation_click'
  | 'realtime_sync'
  | 'error_occurred'
  | 'onboarding_step_complete'
  | 'onboarding_step_skip'
  | 'onboarding_complete'
  | 'hesitation'
  | 'abandonment'
  | 'onboarding_confusion'
  | 'notification_dismissal'
  | 'workspace_interruption'
  | 'streak_preservation'
  | 'recovery_success'
  | 'burnout_signal'
  | 'insight_view'
  | 'insight_dismiss'
  | 'suggestion_click'
  | 'challenge_attempt'
  | 'retention_banner_view'
  | 'retention_banner_dismiss';

interface TelemetryPayload {
  event: TelemetryEvent;
  timestamp: number;
  sessionId: string;
  userId?: string;
  properties: Record<string, unknown>;
  context: {
    page: string;
    viewport: { width: number; height: number };
    userAgent: string;
  };
}

class TelemetryManager {
  private sessionId: string;
  private queue: TelemetryPayload[] = [];
  private flushInterval: number | null = null;
  private isInitialized = false;

  constructor() {
    this.sessionId = crypto.randomUUID();
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('devtrack_access_token');
  }

  async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Start periodic flush (every 30 seconds)
    this.flushInterval = window.setInterval(() => this.flush(), 30000);

    if (!this.hasToken()) return;

    // Track session start in local buffer
    this.track('session_start', {
      referrer: document.referrer,
      entryPage: window.location.pathname,
    });

    // Notify backend that session has started
    try {
      await axiosClient.post('/observation/session/start', {
        sessionId: this.sessionId,
        deviceInfo: {
          userAgent: navigator.userAgent,
          viewport: { width: window.innerWidth, height: window.innerHeight },
          deviceType: 'desktop',
        },
      });
    } catch (err) {
      console.warn('[Telemetry] Start session sync failed:', err);
    }

    // Track session end on unload
    window.addEventListener('beforeunload', () => {
      if (!this.hasToken()) return;
      this.track('session_end', {
        duration: Date.now() - this.sessionStartTime,
      });
      // Try to notify backend immediately on exit
      try {
        axiosClient.post('/observation/session/end', { sessionId: this.sessionId });
      } catch {
        // Ignore
      }
      this.flush();
    });
  }

  private sessionStartTime = Date.now();

  track(event: TelemetryEvent, properties: Record<string, unknown> = {}) {
    // If not fully initialized yet, we still queue it locally
    const payload: TelemetryPayload = {
      event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.getUserId(),
      properties,
      context: {
        page: window.location.pathname,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        userAgent: navigator.userAgent,
      },
    };

    this.queue.push(payload);

    if (import.meta.env.DEV) {
      console.debug('[Telemetry Tracked]', event, properties);
    }

    // Flush immediately for critical events
    if (
      [
        'error_occurred',
        'achievement_unlock',
        'streak_milestone',
        'burnout_signal',
        'abandonment',
      ].includes(event)
    ) {
      this.flush();
    }
  }

  private getUserId(): string | undefined {
    try {
      const userStr = localStorage.getItem('devtrack_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id;
      }
    } catch {
      // Ignore
    }
    return undefined;
  }

  private async flush() {
    if (this.queue.length === 0) return;
    if (!this.hasToken()) {
      this.queue = [];
      return;
    }

    const eventsToSend = [...this.queue];
    this.queue = [];

    try {
      // Send events to backend analytics endpoint
      await axiosClient.post('/observation/events', {
        sessionId: this.sessionId,
        events: eventsToSend,
      });
    } catch (error) {
      console.warn('[Telemetry] Failed to flush telemetry, re-queueing events:', error);
      // Re-queue failed events
      this.queue.unshift(...eventsToSend);
    }
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Notify end of session
    if (this.hasToken()) {
      try {
        axiosClient.post('/observation/session/end', { sessionId: this.sessionId });
      } catch {
        // Ignore
      }
      this.flush();
    } else {
      this.queue = [];
    }
    
    this.isInitialized = false;
  }
}

export const telemetry = new TelemetryManager();

// Convenience functions for common events
export const trackPageView = (page: string) => {
  telemetry.track('page_view', { page });
};

export const trackDsaProblemSolve = (problemId: string, difficulty: string, timeTaken: number) => {
  telemetry.track('dsa_problem_solve', {
    problemId,
    difficulty,
    timeTaken,
  });
};

export const trackGoalComplete = (goalId: string, goalType: string) => {
  telemetry.track('goal_complete', {
    goalId,
    goalType,
  });
};

export const trackAchievementUnlock = (achievementId: string, category: string) => {
  telemetry.track('achievement_unlock', {
    achievementId,
    category,
  });
};

export const trackStreakMilestone = (streakDays: number) => {
  telemetry.track('streak_milestone', {
    streakDays,
  });
};

export const trackKeyboardShortcut = (shortcut: string, context: string) => {
  telemetry.track('keyboard_shortcut', {
    shortcut,
    context,
  });
};

export const trackError = (error: Error, context: string) => {
  telemetry.track('error_occurred', {
    errorMessage: error.message,
    errorStack: error.stack,
    context,
  });
};

// --- Observation & Friction Tracking ---
export const trackHesitation = (element: string, context: Record<string, unknown> = {}) => {
  telemetry.track('hesitation', {
    element,
    severity: 'low',
    ...context,
  });
};

export const trackAbandonment = (page: string, context: Record<string, unknown> = {}) => {
  telemetry.track('abandonment', {
    element: page,
    severity: 'medium',
    ...context,
  });
};

export const trackOnboardingConfusion = (step: string, context: Record<string, unknown> = {}) => {
  telemetry.track('onboarding_confusion', {
    element: `onboarding_step_${step}`,
    step,
    severity: 'medium',
    ...context,
  });
};

export const trackNotificationDismissal = (
  notificationId: string,
  context: Record<string, unknown> = {}
) => {
  telemetry.track('notification_dismissal', {
    element: `notification_${notificationId}`,
    notificationId,
    severity: 'low',
    ...context,
  });
};

export const trackWorkspaceInterruption = (element: string, context: Record<string, unknown> = {}) => {
  telemetry.track('workspace_interruption', {
    element,
    severity: 'medium',
    ...context,
  });
};

export const trackStreakPreservation = (streakDays: number, context: Record<string, unknown> = {}) => {
  telemetry.track('streak_preservation', {
    element: 'streak_shield',
    streakDays,
    ...context,
  });
};

export const trackRecoverySuccess = (context: Record<string, unknown> = {}) => {
  telemetry.track('recovery_success', {
    element: 'recovery_center',
    ...context,
  });
};

export const trackBurnoutSignal = (reason: string, context: Record<string, unknown> = {}) => {
  telemetry.track('burnout_signal', {
    element: 'burnout_monitor',
    reason,
    severity: 'high',
    ...context,
  });
};

export const trackInsightView = (insightId: string, type: string) => {
  telemetry.track('insight_view', { insightId, type });
};

export const trackInsightDismiss = (insightId: string, type: string) => {
  telemetry.track('insight_dismiss', { insightId, type });
};

export const trackSuggestionClick = (suggestionId: string, type: string) => {
  telemetry.track('suggestion_click', { suggestionId, type });
};

export const trackChallengeAttempt = (challengeId: string, platform: string) => {
  telemetry.track('challenge_attempt', { challengeId, platform });
};

export const trackRetentionBannerView = (type: string, message: string) => {
  telemetry.track('retention_banner_view', { type, message });
};

export const trackRetentionBannerDismiss = (type: string) => {
  telemetry.track('retention_banner_dismiss', { type });
};
