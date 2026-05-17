// ============================================================================
// SkeletonTable.tsx — Loading Skeleton Table (Unified Design System)
// ============================================================================

import React from 'react';
import type { SkeletonTableProps } from '../../types/ui.types';

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 5,
  className = '',
}) => {
  return (
    <div className={`dt-table-container ${className}`}>
      {/* Header */}
      <div className="dt-table-header dt-skeleton">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={`h-${i}`}
            className={[
              'dt-skeleton dt-skeleton-text',
              i === 0 ? 'w-2/5' : 'flex-1',
            ].join(' ')}
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`r-${rowIdx}`}
          className="dt-table-row"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div
              key={`c-${colIdx}`}
              className={[
                'dt-skeleton dt-skeleton-text',
                colIdx === 0 ? 'w-2/5' : 'flex-1',
              ].join(' ')}
            />
          ))}
        </div>
      ))}
    </div>
  );
};