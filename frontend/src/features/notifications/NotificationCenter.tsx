import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Sparkles } from 'lucide-react';
import { useSse } from '../../hooks/useSse';
import { cn } from '../../lib/design-system/tokens.css';
import { copy } from '../../lib/copy';
import { smooth, gentle } from '../../design-system/motion';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

const COPY = {
  streak_at_risk: copy.workspace.streakAtRisk,
  comeback_trigger: copy.toast.comeback,
  fatigue_warning: copy.fatigue.subtitle,
  badge_earned: copy.toast.achievement,
  goal_completed: copy.toast.goal,
};

export function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const { eventHistory } = useSse();
  const events = eventHistory.filter((e) =>
    ['notification', 'streak_at_risk', 'comeback_trigger', 'fatigue_warning', 'badge_earned', 'goal_completed'].includes(
      e.type
    )
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={gentle}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={smooth}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800/60 flex flex-col shadow-2xl"
            role="dialog"
            aria-label="Notifications"
          >
            <div className="h-16 px-5 flex items-center justify-between border-b border-zinc-800/60">
              <motion.div layout className="flex items-center gap-3">
                <div className="relative">
                  <Bell size={20} className="text-emerald-400" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />
                </div>
                <h2 className="font-semibold text-base tracking-tight">Updates</h2>
              </motion.div>
              <button 
                type="button" 
                onClick={onClose} 
                className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                aria-label="Close notifications"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {events.length === 0 ? (
                <div className="text-center py-20 text-zinc-500">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                  <p className="text-sm font-medium mb-2">{copy.notifications.emptyTitle}</p>
                  <p className="text-xs text-zinc-600 max-w-xs mx-auto leading-relaxed">{copy.notifications.emptyBody}</p>
                </div>
              ) : (
                events.map((event, i) => (
                  <NotificationItem key={`${event.type}-${event.timestamp}-${i}`} event={event} index={i} />
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function NotificationItem({
  event,
  index,
}: {
  event: { type: string; timestamp: string; stats?: Record<string, unknown> };
  index: number;
}) {
  const title =
    (event.stats?.title as string) ||
    (event.stats?.name as string) ||
    COPY[event.type as keyof typeof COPY] ||
    'Update';
  const body =
    (event.stats?.body as string) ||
    (event.stats?.message as string) ||
    COPY[event.type as keyof typeof COPY] ||
    '';

  const tone = (event.stats?.tone as string) || 'neutral';

  // Tone-based styling
  const toneStyles: Record<string, { border: string; bg: string; text: string }> = {
    encouraging: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', text: 'text-emerald-300' },
    calm: { border: 'border-blue-500/20', bg: 'bg-blue-500/5', text: 'text-blue-300' },
    celebratory: { border: 'border-amber-500/20', bg: 'bg-amber-500/5', text: 'text-amber-300' },
    'gentle-nudge': { border: 'border-orange-500/20', bg: 'bg-orange-500/5', text: 'text-orange-300' },
    supportive: { border: 'border-purple-500/20', bg: 'bg-purple-500/5', text: 'text-purple-300' },
    silent: { border: 'border-zinc-500/20', bg: 'bg-zinc-500/5', text: 'text-zinc-300' },
    neutral: { border: 'border-zinc-800/60', bg: 'bg-zinc-900/40', text: 'text-zinc-300' },
  };

  const style = toneStyles[tone] || toneStyles.neutral;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className={cn(
        'p-4 rounded-xl border text-sm',
        style.border,
        style.bg,
        style.text
      )}
    >
      <p className="font-medium tracking-tight">{title}</p>
      {body && <p className="mt-2 text-xs leading-relaxed opacity-80">{body}</p>}
      <time className="mt-3 block text-[10px] opacity-60 font-medium">
        {new Date(event.timestamp).toLocaleString()}
      </time>
    </motion.article>
  );
}
