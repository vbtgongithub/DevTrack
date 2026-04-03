// ============================================================================
// SkeletonCard.tsx — Loading Skeleton Card
// ============================================================================

import React from 'react';
import type { SkeletonCardProps } from '../../types/ui.types';

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  lines = 3,
  hasImage = false,
  className = '',
}) => {
  return (
    <div className={`rounded-xl border border-zinc-200 bg-white shadow-sm p-5 ${className}`}>
      {hasImage ? <div className="h-28 w-full rounded-lg bg-zinc-200/80 animate-pulse" /> : null}
      <div className={hasImage ? 'mt-4 flex flex-col gap-3' : 'flex flex-col gap-3'}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={
              i === lines - 1
                ? 'h-3 rounded-md bg-zinc-200/80 animate-pulse w-3/5'
                : 'h-3 rounded-md bg-zinc-200/80 animate-pulse w-full'
            }
          />
        ))}
      </div>
    </div>
  );
};
