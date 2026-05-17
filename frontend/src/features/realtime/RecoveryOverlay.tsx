// src/features/realtime/RecoveryOverlay.tsx — Gentle full-page overlay on comeback
// Shows when user returns after inactivity, provides encouragement

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useSse } from '../../hooks/useSse';
import { cn } from '../../lib/design-system/tokens.css';
import { copy } from '../../lib/copy';

interface RecoveryMessage {
  id: string;
  tone: string;
  text: string;
  action?: {
    label: string;
    route: string;
  };
  expiresAt: string;
}

export function RecoveryOverlay() {
  const { eventHistory } = useSse();

  // Filter for comeback messages
  const comebackMessages = eventHistory.filter(
    (event) => event.type === 'behavioral_message' && (event.stats as { context?: string })?.context === 'comeback'
  ) as Array<{ type: string; stats: RecoveryMessage; timestamp: string }>;

  // Get the most recent non-expired comeback message
  const activeMessage = comebackMessages.find((msg) => {
    const expiresAt = new Date(msg.stats.expiresAt);
    return expiresAt > new Date();
  });

  if (!activeMessage) return null;

  const { stats: message } = activeMessage;

  const handleDismiss = () => {
    // In production, track dismissed messages in local storage
    // For now, just let the user dismiss by clicking outside
  };

  const handleAction = () => {
    if (message.action) {
      window.location.href = message.action.route;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome back"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#12B76A] via-teal-500 to-[#12B76A]" />
            
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 rounded-full bg-[#12B76A]/10 flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-[#12B76A]" />
              </motion.div>
            </div>

            {/* Content */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-[#0F172A] mb-2">{copy.comeback.title}</h2>
              <p className="text-zinc-500 leading-relaxed">{message.text || copy.comeback.subtitle}</p>
            </div>

            {/* Action */}
            <div className="flex gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-3 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors text-sm font-medium"
              >
                Maybe later
              </button>
              <button
                onClick={handleAction}
                className={cn(
                  'flex-1 px-4 py-3 rounded-lg bg-[#12B76A] text-white hover:bg-[#0e9f5d] transition-colors text-sm font-medium flex items-center justify-center gap-2'
                )}
              >
                {message.action?.label || copy.comeback.cta}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Dismiss hint */}
            <p className="text-xs text-zinc-400 text-center mt-4">Click outside to dismiss</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
