import { AnimatePresence, motion } from 'framer-motion';
import { prefersReducedMotion, springCalm } from '../../lib/motion';

interface XpPulseProps {
  delta: number | undefined;
  className?: string;
}

/** Premium +XP indicator — subtle, calm, emotionally intelligent */
export function XpPulse({ delta, className }: XpPulseProps) {
  if (!delta || delta <= 0) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={delta}
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -8, scale: prefersReducedMotion ? 1 : 0.95 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{ opacity: 0, y: 4, scale: 0.98 }}
        transition={springCalm}
        className={className}
        aria-live="polite"
        role="status"
      >
        +{delta} XP
      </motion.span>
    </AnimatePresence>
  );
}
