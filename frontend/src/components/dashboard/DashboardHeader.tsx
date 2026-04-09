// ============================================================================
// DashboardHeader.tsx — Premium Dashboard Header
// ============================================================================
import React from 'react';
import type { DashboardHeaderProps } from '../../types/ui.types';
import { Icon } from '../shared/Icon';

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ data }) => {
  const now = new Date();
  const hour = now.getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {timeGreeting}, {data.displayName} 👋
        </h1>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Icon name="calendar" size={14} className="text-gray-400" />
            {dateStr}
          </span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-600 font-medium">Online</span>
          </span>
        </div>
      </div>
    </div>
  );
};
