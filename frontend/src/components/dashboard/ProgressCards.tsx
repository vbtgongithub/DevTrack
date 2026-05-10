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

  const progressColor = progress >= 80 ? 'from-emerald-500 to-emerald-400' : progress >= 50 ? 'from-blue-500 to-indigo-500' : 'from-amber-500 to-orange-500';
  const progressBg = progress >= 80 ? 'bg-emerald-100' : progress >= 50 ? 'bg-blue-100' : 'bg-amber-100';
  const iconBg = progress >= 80 ? 'bg-emerald-50' : progress >= 50 ? 'bg-blue-50' : 'bg-amber-50';
  const iconColor = progress >= 80 ? 'text-emerald-600' : progress >= 50 ? 'text-blue-600' : 'text-amber-600';

  return (
    <div
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out flex flex-col gap-3"
      style={{ animation: `dtFadeIn 520ms ease-out ${index * 80}ms both` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={['w-10 h-10 rounded-xl flex items-center justify-center', iconBg].join(' ')}>
            <Icon name={icon} size={18} className={iconColor} />
          </div>
          <span className="text-sm font-semibold text-gray-900">{title}</span>
        </div>
        <span className="text-lg font-bold text-gray-900 tabular-nums">{progress}%</span>
      </div>

      <div className={['h-3 w-full rounded-full overflow-hidden', progressBg].join(' ')}>
        <div
          className={['h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out', progressColor].join(' ')}
          style={{ width: mounted ? `${progress}%` : '0%' }}
        />
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">{insight}</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Weekly Problem Goal', icon: 'target' },
          { title: 'Easy/Medium Ratio', icon: 'chart-bar' },
          { title: 'Hard Problems', icon: 'fire' },
        ].map((item, index) => (
          <div
            key={item.title}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-3"
            style={{ animation: `dtFadeIn 520ms ease-out ${index * 80}ms both` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50">
                  <Icon name={item.icon} size={18} className="text-gray-400" />
                </div>
                <span className="text-sm font-semibold text-gray-900">{item.title}</span>
              </div>
              <span className="text-lg font-bold text-gray-400 tabular-nums">—</span>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gray-200 rounded-full" style={{ width: '0%' }} />
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">Sync platforms to track progress</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {progressItems.map((item, index) => (
        <ProgressCard key={item.id} title={item.title} progress={item.progress} insight={item.insight} icon={item.icon} index={index} />
      ))}
    </div>
  );
};
