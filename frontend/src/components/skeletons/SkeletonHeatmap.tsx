// ============================================================================
// SkeletonHeatmap.tsx — Loading Skeleton Heatmap
// ============================================================================

import React from 'react';
import type { SkeletonHeatmapProps } from '../../types/ui.types';

export const SkeletonHeatmap: React.FC<SkeletonHeatmapProps> = ({
  weeks = 52,
  className = '',
}) => {
  return (
    <div className={`rounded-2xl border border-gray-300 bg-white shadow-md p-5 ${className}`}>
      <div className="flex flex-wrap gap-[3px]">
        {Array.from({ length: weeks * 7 }).map((_, i) => (
          <div
            key={i}
            className="h-3 w-3 rounded-[2px] bg-zinc-200/80 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
};
