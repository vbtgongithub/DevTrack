// src/features/realtime/BehavioralMessageBar.tsx — Thin bar component for behavioral messages
// Tone-driven styling, displays behavioral messages from SSE

import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Sparkles, Heart, Zap } from 'lucide-react';
import { useSse } from '../../hooks/useSse';
import { cn } from '../../lib/design-system/tokens.css';

interface BehavioralMessage {
  id: string;
  tone: 'encouraging' | 'calm' | 'celebratory' | 'gentle-nudge' | 'supportive' | 'silent';
  text: string;
  action?: {
    label: string;
    route: string;
  };
  expiresAt: string;
}

const TONE_STYLES: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  encouraging: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-300',
    icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
  },
  calm: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-300',
    icon: <Info className="w-4 h-4 text-blue-400" />,
  },
  celebratory: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-300',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
  },
  'gentle-nudge': {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    text: 'text-orange-300',
    icon: <Info className="w-4 h-4 text-orange-400" />,
  },
  supportive: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-300',
    icon: <Heart className="w-4 h-4 text-purple-400" />,
  },
  silent: {
    bg: 'bg-zinc-500/10',
    border: 'border-zinc-500/20',
    text: 'text-zinc-300',
    icon: <Info className="w-4 h-4 text-zinc-400" />,
  },
};

export function BehavioralMessageBar() {
  const { eventHistory } = useSse();

  // Filter for behavioral_message events
  const behavioralMessages = eventHistory.filter(
    (event) => event.type === 'behavioral_message' && event.stats
  ) as Array<{ type: string; stats: BehavioralMessage; timestamp: string }>;

  // Get the most recent non-expired message
  const activeMessage = behavioralMessages.find((msg) => {
    const expiresAt = new Date(msg.stats.expiresAt);
    return expiresAt > new Date();
  });

  if (!activeMessage) return null;

  const { stats: message } = activeMessage;
  const style = TONE_STYLES[message.tone] || TONE_STYLES.calm;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-40 px-4 py-3',
          style.bg,
          'border-b',
          style.border
        )}
      >
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          {style.icon}
          <p className={cn('text-sm font-medium', style.text)}>{message.text}</p>
          {message.action && (
            <button
              onClick={() => {
                window.location.href = message.action!.route;
              }}
              className={cn(
                'text-xs font-medium px-3 py-1 rounded-full',
                style.border,
                'border',
                style.text,
                'hover:opacity-80 transition-opacity'
              )}
            >
              {message.action.label}
            </button>
          )}
          <button
            onClick={() => {
              // Dismiss by removing from history (simplified - in production, track dismissed messages)
            }}
            className="ml-auto text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
