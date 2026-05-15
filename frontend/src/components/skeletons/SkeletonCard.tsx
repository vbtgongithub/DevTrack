// ============================================================================
// SkeletonCard.tsx — Loading Skeleton Card (Unified Design System)
// ============================================================================

import React from 'react';
import type { SkeletonCardProps } from '../../types/ui.types';

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  lines = 3,
  hasImage = false,
  className = '',
}) => {
  return (
    <div className={`dt-skeleton-card dt-card-pad-md ${className}`}>
      {hasImage && (
        <div className="dt-skeleton w-full h-28 rounded-xl mb-4" />
      )}
      <div className="flex flex-col gap-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={[
              'dt-skeleton dt-skeleton-text',
              i === lines - 1 ? 'w-3/5' : 'w-full',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
};