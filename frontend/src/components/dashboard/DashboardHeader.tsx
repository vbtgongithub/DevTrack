import React from 'react';
import type { DashboardHeaderProps } from '../../types/ui.types';

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ data }) => {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold text-[#1f1f1f]">Welcome back, {data.displayName}</h1>
      <div className="flex items-center gap-2 text-sm text-[#6b6b6b]">
        <span className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true" />
        <span>You're on track — keep your streak alive!</span>
      </div>
    </div>
  );
};
