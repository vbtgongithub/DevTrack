import { useRef } from 'react';
import { useSse, type SseEvent } from './useSse';
import { useUIStore } from '../store/uiStore';
import { copy } from '../lib/copy';

const QUIET_TYPES = new Set(['xp_updated', 'goal_progress', 'challenge_updated', 'sync_completed']);

/** Subtle toasts + deduped progression feedback — never spammy */
export function useRealtimeFeedback(enabled: boolean) {
  const addToast = useUIStore((s) => s.addToast);
  const lastRef = useRef<string>('');

  useSse({
    enabled,
    onEvent: (event: SseEvent) => {
      const key = `${event.type}:${event.timestamp}`;
      if (lastRef.current === key) return;
      lastRef.current = key;

      switch (event.type) {
        case 'xp_updated': {
          const stats = event.stats;
          const delta = stats?.easySolved as number | undefined;
          if (delta && delta > 0) {
            addToast({
              type: 'success',
              title: copy.toast.xp(delta),
              duration: 2800,
            });
          }
          break;
        }
        case 'streak_milestone':
          addToast({ type: 'info', title: copy.toast.streak, duration: 3200 });
          break;
        case 'goal_completed':
        case 'challenge_completed':
          addToast({ type: 'success', title: copy.toast.goal, duration: 3500 });
          break;
        case 'badge_earned':
        case 'achievement_unlocked':
          addToast({
            type: 'success',
            title: copy.toast.achievement,
            message: (event.stats as Record<string, unknown> | undefined)?.name as string | undefined,
            duration: 4500,
          });
          break;
        case 'streak_at_risk':
          // Drawer handles these — no toast to avoid interruption
          break;
        case 'notification_created': {
          const payload = event.stats as Record<string, unknown> | undefined;
          const title = payload?.title as string | undefined;
          if (title) {
            addToast({
              type: 'info',
              title,
              message: (payload?.body as string) || undefined,
              duration: 4000,
            });
          }
          break;
        }
        case 'behavioral_message':
          // BehavioralMessageBar handles these via SSE directly
          break;
        default:
          if (!QUIET_TYPES.has(event.type)) {
            /* sync + progress events invalidate queries only */
          }
      }
    },
  });
}
