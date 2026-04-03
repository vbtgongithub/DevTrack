// ============================================================================
// SkeletonGrid.tsx — Loading Skeleton Grid
// ============================================================================

import React from 'react';
import type { SkeletonGridProps } from '../../types/ui.types';
import { SkeletonCard } from './SkeletonCard';

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({
  columns = 3,
  rows = 2,
  cardLines = 3,
  className = '',
}) => {
  const totalCards = columns * rows;
  const colsClass =
    columns === 1
      ? 'grid-cols-1'
      : columns === 2
      ? 'grid-cols-2'
      : columns === 4
      ? 'grid-cols-4'
      : 'grid-cols-3';

  return (
    <div className={`grid gap-4 ${colsClass} ${className}`}>
      {Array.from({ length: totalCards }).map((_, i) => (
        <SkeletonCard key={i} lines={cardLines} />
      ))}
    </div>
  );
};
