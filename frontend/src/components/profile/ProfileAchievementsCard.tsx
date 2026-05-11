import React from 'react';
import { Icon } from '../shared/Icon';
import { useAchievements } from '../../hooks/useDashboardQueries';

export const ProfileAchievementsCard: React.FC = () => {
  const { data: achievementsData, isLoading } = useAchievements();
  
  const achievements = achievementsData?.achievements ?? [];
  const unlockedCount = achievementsData?.totalUnlocked ?? 0;
  const totalAchievements = achievementsData?.totalAchievements ?? 0;

  if (isLoading) {
    return (
      <div className="dt-card p-6 bg-white rounded-[24px] border border-dt-primary/5 shadow-sm animate-pulse mb-6">
        <div className="h-6 w-48 bg-dt-bg rounded mb-6"></div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-24 h-24 rounded-2xl bg-dt-bg shrink-0"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!achievements.length) return null;

  return (
    <div className="dt-card p-6 bg-white rounded-[28px] border border-dt-success/10 shadow-dt-floating relative overflow-hidden mb-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.03),transparent_60%)]" />
      
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-dt-success/10 flex items-center justify-center border border-dt-success/5 text-dt-success shadow-sm">
            <Icon name="award" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-dt-text tracking-tighter">Achievements Showcase</h3>
            <p className="text-xs font-bold text-dt-textSecondary/60 mt-0.5 tracking-wide">Unlock badges to build your ecosystem identity</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-dt-success/5 border border-dt-success/10 text-dt-success font-black text-sm tabular-nums">
          <Icon name="sparkles" size={16} />
          {unlockedCount} / {totalAchievements} Unlocked
        </div>
      </div>

      <div className="relative flex flex-wrap gap-4">
        {achievements.map((badge, i) => (
          <div
            key={badge.id}
            className={[
              'flex flex-col items-center gap-3 p-4 w-[110px] rounded-[24px] border transition-all duration-500 group',
              badge.isUnlocked
                ? 'bg-white border-dt-success/10 shadow-[0_4px_20px_rgba(34,197,94,0.04)] hover:shadow-lg hover:-translate-y-1 cursor-default'
                : 'bg-dt-bg/40 border-transparent opacity-40 grayscale cursor-not-allowed'
            ].join(' ')}
            style={{ animation: `dtFadeIn 500ms cubic-bezier(0.16,1,0.3,1) ${i * 50}ms both` }}
            title={badge.description}
          >
            <div className={[
              'w-14 h-14 rounded-full flex items-center justify-center text-3xl transition-transform duration-500',
              badge.isUnlocked ? 'bg-dt-success/5 group-hover:scale-110 shadow-inner' : 'bg-gray-200/50'
            ].join(' ')}>
              <span className="filter drop-shadow-sm">{badge.icon}</span>
            </div>
            <span className="text-[10px] font-black text-dt-textSecondary text-center leading-tight uppercase tracking-[0.1em] line-clamp-2">{badge.title}</span>
            {!badge.isUnlocked && (
              <div className="absolute top-3 right-3 opacity-50">
                <Icon name="lock-closed" size={12} className="text-dt-textMuted" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
