// ============================================================================
// PageTransition.tsx — Animated page wrapper for route transitions
// ============================================================================
// Wraps page content with fade+translateY animation on mount.
// Respects prefers-reduced-motion. Uses motion tokens.
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { prefersReducedMotion, smooth } from '../../design-system/motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const variants = {
  initial: prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: 0, y: -8 },
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={prefersReducedMotion ? { duration: 0 } : smooth}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
