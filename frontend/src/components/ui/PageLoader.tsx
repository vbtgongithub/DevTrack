import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { copy } from '../../lib/copy';
import { springCalm, prefersReducedMotion } from '../../lib/motion';

interface PageLoaderProps {
  label?: string;
  className?: string;
}

export function PageLoader({ label = copy.dashboard.loading, className }: PageLoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={springCalm}
      className={className ?? 'flex flex-col items-center justify-center min-h-[40vh] gap-4'}
      role="status"
      aria-live="polite"
    >
      <motion.div
        animate={prefersReducedMotion ? {} : { rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="w-8 h-8 text-emerald-500/70" aria-hidden />
      </motion.div>
      <p className="text-sm text-zinc-500 font-medium">{label}</p>
    </motion.div>
  );
}
