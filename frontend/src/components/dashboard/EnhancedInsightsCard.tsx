// ============================================================================
// EnhancedInsightsCard.tsx — AI Insights (Visually Dominant)
// ============================================================================
import React from 'react';
import { Icon } from '../shared/Icon';
import type { DashboardData } from '../../hooks/useDashboardData';

interface EnhancedInsightsCardProps {
  data: DashboardData | null;
}

const COLOR_MAP: Record<string, { bg: string; border: string; icon: string; badge: string; gradient: string }> = {
  green: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200/60',
    icon: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
    gradient: 'from-emerald-50 to-white',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200/60',
    icon: 'text-red-500',
    badge: 'bg-red-100 text-red-700',
    gradient: 'from-red-50 to-white',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200/60',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    gradient: 'from-blue-50 to-white',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200/60',
    icon: 'text-orange-600',
    badge: 'bg-orange-100 text-orange-700',
    gradient: 'from-orange-50 to-white',
  },
};

export const EnhancedInsightsCard: React.FC<EnhancedInsightsCardProps> = ({ data }) => {
  const totalSolved = data?.totalSolved ?? 0;
  const streak = data?.streak ?? 0;
  const easy = data?.easy ?? 0;
  const medium = data?.medium ?? 0;
  const hard = data?.hard ?? 0;

  const insights = [
    {
      id: '1',
      title: 'Great progress!',
      description: `You've solved ${totalSolved} problems. Keep up the momentum!`,
      metric: `${totalSolved} solved`,
      icon: 'chart-bar',
      color: 'green' as const,
    },
    {
      id: '2',
      title: 'Streak alert',
      description: `${streak} day streak! Solve one more problem today to maintain it.`,
      metric: `${streak} days`,
      icon: 'fire',
      color: 'orange' as const,
    },
    {
      id: '3',
      title: 'Focus area',
      description: `You've solved ${medium} medium and ${hard} hard problems. Push into hard for faster growth.`,
      metric: `${medium} medium`,
      icon: 'brain',
      color: 'blue' as const,
    },
    {
      id: '4',
      title: 'Easy warmup',
      description: `${easy} easy problems completed. Ready for a challenge?`,
      metric: `${easy} easy`,
      icon: 'check-circle',
      color: 'green' as const,
    },
  ];

  const [featured, ...rest] = insights;
  const featuredColors = COLOR_MAP[featured.color] || COLOR_MAP.blue;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900">AI Insights</h3>
          <p className="text-xs text-gray-500 mt-0.5">Personalized recommendations based on your activity</p>
        </div>
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center shadow-sm">
          <Icon name="bolt" size={16} className="text-violet-600" />
        </div>
      </div>

      {/* Insight of the Day — LARGE */}
      <div
        className={[
          'relative p-5 rounded-2xl border mb-4',
          'bg-gradient-to-br', featuredColors.gradient,
          featuredColors.border,
        ].join(' ')}
        style={{ animation: 'dtFadeIn 520ms ease-out both' }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Insight of the Day</span>
        </div>
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-white/90 shadow-sm flex items-center justify-center">
            <Icon name={featured.icon} size={22} className={featuredColors.icon} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-semibold text-gray-900">{featured.title}</span>
              <span className={[
                'text-xs font-bold px-2 py-0.5 rounded-full tabular-nums',
                featuredColors.badge,
              ].join(' ')}>
                {featured.metric}
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{featured.description}</p>
          </div>
        </div>
      </div>

      {/* Smaller insight cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {rest.map((insight, index) => {
          const colors = COLOR_MAP[insight.color] || COLOR_MAP.blue;
          return (
            <div
              key={insight.id}
              className={[
                'group flex items-start gap-3 p-4 rounded-xl border',
                'hover:shadow-md hover:-translate-y-0.5',
                'transition-all duration-200 ease-out cursor-default',
                colors.bg,
                colors.border,
              ].join(' ')}
              style={{
                animation: `dtFadeIn 520ms ease-out ${(index + 1) * 80}ms both`,
              }}
            >
              <div className="shrink-0 w-9 h-9 rounded-lg bg-white/90 shadow-sm flex items-center justify-center">
                <Icon name={insight.icon} size={16} className={colors.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm font-semibold text-gray-900">{insight.title}</span>
                  <span className={[
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums',
                    colors.badge,
                  ].join(' ')}>
                    {insight.metric}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{insight.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
