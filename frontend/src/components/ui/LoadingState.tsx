// ============================================================================
// LoadingState.tsx — Loading State Component
// ============================================================================
// Skeleton-first loading state with adaptive density.
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { useBreakpoint } from '../../hooks/useMediaQuery';
import { shimmerPulse, prefersReducedMotion } from '../../design-system/motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LoadingStateProps {
  /**
   * Loading variant
   * @default 'skeleton'
   */
  variant?: 'skeleton' | 'spinner' | 'dots';
  
  /**
   * Number of skeleton items
   * @default 3
   */
  count?: number;
  
  /**
   * Loading message
   */
  message?: string;
}

// ---------------------------------------------------------------------------
// Skeleton Item
// ---------------------------------------------------------------------------

const SkeletonItem: React.FC<{ index: number }> = ({ index }) => {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  return (
    <motion.div
      variants={shimmerPulse}
      animate="animate"
      transition={{
        duration: prefersReducedMotion ? 0 : 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: index * 0.1,
      }}
      className={[
        'bg-gray-100 rounded-2xl',
        isMobile ? 'h-24' : 'h-32',
      ].join(' ')}
    />
  );
};

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

const Spinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <svg
      className="animate-spin h-8 w-8 text-dt-primary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  </div>
);

// ---------------------------------------------------------------------------
// Dots
// ---------------------------------------------------------------------------

const Dots: React.FC = () => (
  <div className="flex items-center justify-center gap-2 min-h-[200px]">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 rounded-full bg-dt-primary"
        animate={prefersReducedMotion ? {} : { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: i * 0.2,
        }}
      />
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'skeleton',
  count = 3,
  message,
}) => {
  if (variant === 'spinner') {
    return (
      <div>
        <Spinner />
        {message && (
          <p className="text-center text-sm text-dt-textSecondary mt-4">
            {message}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div>
        <Dots />
        {message && (
          <p className="text-center text-sm text-dt-textSecondary mt-4">
            {message}
          </p>
        )}
      </div>
    );
  }

  // Skeleton variant
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonItem key={i} index={i} />
      ))}
      {message && (
        <p className="text-center text-sm text-dt-textSecondary mt-4">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingState;
