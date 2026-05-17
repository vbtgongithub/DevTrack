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
      className="dt-card bg-white/80 backdrop-blur-3xl border border-gray-300 p-6 rounded-[28px] shadow-[0_8px_30px_rgba(124,92,252,0.06)] hover:shadow-[0_12px_40px_rgba(124,92,252,0.1)] hover:border-dt-primary/30 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col gap-5 relative overflow-hidden group"
      style={{ animation: `dtFadeIn 600ms cubic-bezier(0.16,1,0.3,1) ${index * 80}ms both` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,92,252,0.03),transparent_60%)] pointer-events-none" />

      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentColor} opacity-70 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className={['w-12 h-12 rounded-[20px] flex items-center justify-center border transition-transform duration-500 group-hover:scale-105 shadow-inner', iconBg, progress >= 50 && progress < 80 ? 'border-dt-primary/20' : 'border-transparent'].join(' ')}>
            <Icon name={icon} size={22} className={[iconColor, 'drop-shadow-sm'].join(' ')} />
          </div>
          <div>
            <span className="text-[10px] font-black text-dt-textSecondary/60 uppercase tracking-[0.2em] mb-0.5 block">Telemetry</span>
            <span className="text-[16px] font-black text-dt-text tracking-tighter">{title}</span>
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-dt-text tabular-nums tracking-tighter drop-shadow-sm">{progress}</span>
          <span className="text-sm font-bold text-dt-textSecondary/50">%</span>
        </div>
      </div>

      <div className={['h-3 w-full rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] relative z-10', progressBg].join(' ')}>
        <div
          className={['h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] relative', progressColor].join(' ')}
          style={{ width: mounted ? `${progress}%` : '0%' }}
        >
          <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/30 animate-[shimmer_2s_infinite]" />
        </div>
      </div>

      <div className="flex items-center justify-between relative z-10 pt-2 border-t border-dt-primary/5">
        <p className="text-[12px] font-bold text-dt-textSecondary/80 tracking-wide">{insight}</p>
        <Icon name="trend-up" size={14} className={iconColor} />
      </div>
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
      <div className="grid grid-cols-1 md:grid-cols-1 gap-5 lg:gap-8">
        {[
          { title: 'Weekly Problem Goal', icon: 'target' },
          { title: 'Easy/Medium Ratio', icon: 'chart-bar' },
          { title: 'Hard Problems', icon: 'fire' },
        ].map((item, index) => (
          <div
            key={item.title}
            className="bg-white/60 backdrop-blur-3xl border border-gray-300 p-7 rounded-[28px] shadow-[0_8px_30px_rgba(124,92,252,0.05)] hover:shadow-[0_12px_40px_rgba(124,92,252,0.08)] hover:border-dt-primary/30 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col gap-5 relative overflow-hidden group"
            style={{ animation: `dtFadeIn 600ms cubic-bezier(0.16,1,0.3,1) ${index * 80}ms both` }}
          >
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none transform translate-x-4 -translate-y-4 group-hover:scale-[1.3] group-hover:rotate-12 transition-transform duration-1000">
              <Icon name={item.icon} size={100} className="text-dt-text" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[20px] flex items-center justify-center bg-white border border-dt-primary/10 shadow-[0_4px_20px_rgba(124,92,252,0.05)] group-hover:scale-105 transition-transform duration-500">
                  <Icon name={item.icon} size={24} className="text-dt-textMuted" />
                </div>
                <div>
                   <span className="text-[10px] font-black text-dt-textSecondary/50 uppercase tracking-[0.2em] mb-0.5 block">Telemetry</span>
                   <span className="text-[16px] font-black text-dt-text tracking-tighter leading-snug">{item.title}</span>
                </div>
              </div>
              <span className="text-3xl font-black text-dt-textDisabled tabular-nums">—</span>
            </div>
            <div className="h-3 w-full bg-dt-primary/5 rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] relative z-10">
              <div className="h-full bg-transparent" style={{ width: '0%' }} />
            </div>
            <div className="pt-2 border-t border-dt-primary/5 relative z-10">
               <p className="text-[12px] text-dt-textSecondary/70 leading-relaxed font-bold tracking-wide">Awaiting signals</p>
            </div>
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
