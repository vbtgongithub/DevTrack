// ============================================================================
// SkeletonTable.tsx — Loading Skeleton Table
// ============================================================================

import React from 'react';
import type { SkeletonTableProps } from '../../types/ui.types';

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 5,
  className = '',
}) => {
  return (
    <div className={`rounded-2xl border border-gray-300 bg-white shadow-md overflow-hidden ${className}`}>
      <div className="flex gap-4 px-5 py-4 border-b border-gray-300">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={`h-${i}`}
            className={
              i === 0
                ? 'h-3 rounded-md bg-zinc-200/80 animate-pulse w-2/5'
                : 'h-3 rounded-md bg-zinc-200/80 animate-pulse flex-1'
            }
          />
        ))}
      </div>

      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`r-${rowIdx}`}
          className={
            rowIdx === rows - 1
              ? 'flex gap-4 px-5 py-4'
              : 'flex gap-4 px-5 py-4 border-b border-gray-300'
          }
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div
              key={`c-${colIdx}`}
              className={
                colIdx === 0
                  ? 'h-3.5 rounded-md bg-zinc-200/80 animate-pulse w-2/5'
                  : 'h-3.5 rounded-md bg-zinc-200/80 animate-pulse flex-1'
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
};
