// ============================================================================
// RecentActivityList.tsx — Recent Activity Feed
// ============================================================================

import React from 'react';
import type { RecentActivityListProps } from '../../types/ui.types';
import { Icon } from '../shared/Icon';

export const RecentActivityList: React.FC<RecentActivityListProps> = ({
  activities,
  maxItems = 8,
  onViewAll,
}) => {
  const displayed = activities.slice(0, maxItems);

  return (
    <div className="dt-card bg-dt-elevated border-dt-primary/10 rounded-2xl p-6 lg:p-8 h-full flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-dt-primary/80 to-dt-secondary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-dt-primary/10 flex items-center justify-center border border-dt-primary/20 shadow-sm">
            <Icon name="clock" size={18} className="text-dt-primary" />
          </div>
          <h3 className="text-[17px] font-bold text-dt-text tracking-tight">Recent Activity</h3>
        </div>
        {onViewAll && (
          <button
            className="text-[13px] font-bold text-dt-primary hover:text-dt-secondary flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-dt-primary/5 transition-colors"
            onClick={onViewAll}
          >
            View All <Icon name="chevron-right" size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 dt-scroll">
        <div className="flex flex-col gap-3 relative before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-dt-primary/10">
          {displayed.map((activity, index) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-3 rounded-xl hover:bg-dt-primary/5 transition-colors border border-transparent hover:border-dt-primary/10 group/item relative z-10"
              style={{ animation: `dtFadeIn 400ms ease-out ${index * 50}ms both` }}
            >
              <div
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-dt-primary/10 shadow-sm relative z-10"
                style={{ color: activity.typeColor }}
              >
                <Icon name={activity.icon} size={18} />
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[14px] font-bold text-dt-text truncate">{activity.title}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest bg-dt-primary/5 text-dt-textSecondary border border-dt-primary/10">
                    {activity.platformLabel}
                  </span>
                </div>
                <p className="text-[13px] text-dt-textSecondary font-medium truncate mb-1">{activity.description}</p>
                <span className="text-[11px] font-semibold text-dt-textMuted uppercase tracking-widest">{activity.timeAgo}</span>
              </div>
              {activity.url && (
                <a
                  href={activity.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-dt-textMuted hover:text-dt-primary hover:bg-white border border-transparent hover:border-dt-primary/20 hover:shadow-sm opacity-0 group-hover/item:opacity-100 transition-all focus:opacity-100"
                  aria-label="View"
                >
                  <Icon name="link" size={14} />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {activities.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 flex-1 text-center relative z-10 bg-gradient-to-b from-transparent to-dt-primary/[0.02] rounded-[24px] border border-dt-primary/5 mt-2 overflow-hidden">
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
          <div className="relative mb-6 group-hover:-translate-y-1 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <div className="w-20 h-20 rounded-full bg-white/60 backdrop-blur-xl border border-dt-primary/10 flex items-center justify-center shadow-[0_8px_30px_rgba(124,92,252,0.08)] relative z-10">
              <div className="absolute inset-1 rounded-full border border-dashed border-dt-primary/20 animate-[spin_30s_linear_infinite]" />
              <Icon name="clock" size={28} className="text-dt-primary/50" />
            </div>
          </div>
          <p className="text-[17px] font-black text-dt-text tracking-tight drop-shadow-sm mb-1.5">Awaiting Activity Telemetry</p>
          <p className="text-[13px] font-bold text-dt-textSecondary/70 max-w-[220px] leading-relaxed tracking-wide">Connect your coding ecosystem to initialize event tracking.</p>
        </div>
      )}
    </div>
  );
};
