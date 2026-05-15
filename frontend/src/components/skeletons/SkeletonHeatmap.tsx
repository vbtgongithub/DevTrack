// ============================================================================
// SkeletonHeatmap.tsx — Loading Skeleton Heatmap
// ============================================================================
// Unified Design System
// ============================================================================

import React from 'react';
import type { SkeletonHeatmapProps } from '../../types/ui.types';

export const SkeletonHeatmap: React.FC<SkeletonHeatmapProps> = ({
  weeks = 52,
  className = '',
}) => {
  return (
    <div className={`dt-card-base dt-card-pad-md ${className}`}>
      <div className="flex flex-wrap gap-[3px]">
        {Array.from({ length: weeks * 7 }).map((_, i) => (
          <div
            key={i}
            className="h-3 w-3 rounded-[2px] dt-skeleton"
          />
        ))}
      </div>
    </div>
  );
};