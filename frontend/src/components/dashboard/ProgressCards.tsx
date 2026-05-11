import React from 'react';
import { Icon } from '../shared/Icon';
import type { ApiPlatformStats } from '../../types/api.types';

interface ProgressCardProps {
  title: string;
  progress: number;
  insight: string;
  icon: string;
  index: number;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ title, progress, insight, icon, index }) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const progressColor = progress >= 80 ? 'from-dt-success to-emerald-400' : progress >= 50 ? 'from-dt-primary to-dt-secondary' : 'from-dt-warning to-amber-400';
  const progressBg = progress >= 80 ? 'bg-dt-success/10' : progress >= 50 ? 'bg-dt-primary/10' : 'bg-dt-warning/10';
  const iconBg = progress >= 80 ? 'bg-dt-success/10' : progress >= 50 ? 'bg-dt-primary/10' : 'bg-dt-warning/10';
  const iconColor = progress >= 80 ? 'text-dt-success' : progress >= 50 ? 'text-dt-primary' : 'text-dt-warning';
  const accentColor = progress >= 80 ? 'bg-dt-success' : progress >= 50 ? 'bg-dt-primary' : 'bg-dt-warning';

  return (
    <div
      className="dt-card bg-gradient-to-br from-white to-dt-bg/50 border-dt-primary/10 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col gap-4 relative overflow-hidden group"
      style={{ animation: `dtFadeIn 520ms ease-out ${index * 80}ms both` }}
    >
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={['w-10 h-10 rounded-xl flex items-center justify-center border border-transparent shadow-sm', iconBg, progress >= 50 && progress < 80 ? 'border-dt-primary/10' : ''].join(' ')}>
            <Icon name={icon} size={18} className={iconColor} />
          </div>
          <span className="text-[15px] font-bold text-dt-text tracking-tight">{title}</span>
        </div>
        <span className="text-xl font-extrabold text-dt-text tabular-nums">{progress}%</span>
      </div>

      <div className={['h-2.5 w-full rounded-full overflow-hidden shadow-inner', progressBg].join(' ')}>
        <div
          className={['h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out shadow-sm', progressColor].join(' ')}
          style={{ width: mounted ? `${progress}%` : '0%' }}
        />
      </div>

      <p className="text-[13px] font-medium text-dt-textSecondary leading-relaxed">{insight}</p>
    </div>
  );
};

interface ProgressCardsProps {
  platformStats: ApiPlatformStats[] | null | undefined;
}

export const ProgressCards: React.FC<ProgressCardsProps> = ({ platformStats }) => {
  // Backend doesn't have progress card data - derive from platform stats or show empty state
  const progressItems = React.useMemo(() => {
    if (!platformStats || platformStats.length === 0) {
      return [];
    }

    const totalSolved = platformStats.reduce((sum, p) => sum + (p.totalSolved || 0), 0);
    const totalEasy = platformStats.reduce((sum, p) => sum + (p.easySolved || 0), 0);
    const totalMedium = platformStats.reduce((sum, p) => sum + (p.mediumSolved || 0), 0);
    const totalHard = platformStats.reduce((sum, p) => sum + (p.hardSolved || 0), 0);

    return [
      {
        id: 'pg1',
        title: 'Weekly Problem Goal',
        progress: totalSolved > 0 ? Math.min(100, Math.round((totalSolved / 20) * 100)) : 0,
        insight: totalSolved > 0 ? `${totalSolved} problems solved` : 'No problems solved yet',
        icon: 'target',
      },
      {
        id: 'pg2',
        title: 'Easy/Medium Ratio',
        progress: totalSolved > 0 ? Math.round(((totalEasy + totalMedium) / totalSolved) * 100) : 0,
        insight: totalSolved > 0 ? `${totalEasy} easy, ${totalMedium} medium` : 'No data available',
        icon: 'chart-bar',
      },
      {
        id: 'pg3',
        title: 'Hard Problems',
        progress: totalSolved > 0 ? Math.round((totalHard / totalSolved) * 100) : 0,
        insight: totalHard > 0 ? `${totalHard} hard problems solved` : 'No hard problems yet',
        icon: 'fire',
      },
    ];
  }, [platformStats]);

  // If no data, show empty state
  if (progressItems.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-8">
        {[
          { title: 'Weekly Problem Goal', icon: 'target' },
          { title: 'Easy/Medium Ratio', icon: 'chart-bar' },
          { title: 'Hard Problems', icon: 'fire' },
        ].map((item, index) => (
          <div
            key={item.title}
            className="bg-white/40 backdrop-blur-2xl border border-dt-primary/10 p-7 rounded-[24px] shadow-[0_8px_30px_rgba(124,92,252,0.05)] hover:shadow-[0_12px_40px_rgba(124,92,252,0.08)] hover:-translate-y-1 transition-all duration-500 cubic-bezier(0.22, 1, 0.36, 1) flex flex-col gap-5 relative overflow-hidden group"
            style={{ animation: `dtFadeIn 600ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 80}ms both` }}
          >
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none transform translate-x-4 -translate-y-4 group-hover:scale-[1.3] group-hover:rotate-12 transition-transform duration-700">
              <Icon name={item.icon} size={80} className="text-dt-text" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[16px] flex items-center justify-center bg-white/60 border border-dt-primary/10 shadow-sm group-hover:scale-110 transition-transform duration-500">
                  <Icon name={item.icon} size={22} className="text-dt-textMuted" />
                </div>
                <span className="text-[15px] font-black text-dt-text tracking-tight leading-snug">{item.title}</span>
              </div>
              <span className="text-2xl font-extrabold text-dt-textDisabled tabular-nums">—</span>
            </div>
            <div className="h-2 w-full bg-dt-primary/5 rounded-full overflow-hidden shadow-inner relative z-10">
              <div className="h-full bg-transparent" style={{ width: '0%' }} />
            </div>
            <p className="text-[13px] text-dt-textSecondary leading-relaxed font-bold tracking-tight relative z-10">Connect platforms to track progress</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 gap-5 lg:gap-8">
      {progressItems.map((item, index) => (
        <ProgressCard key={item.id} title={item.title} progress={item.progress} insight={item.insight} icon={item.icon} index={index} />
      ))}
    </div>
  );
};
