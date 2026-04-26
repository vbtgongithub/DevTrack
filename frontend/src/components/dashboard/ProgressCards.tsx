import React from 'react';
import { Icon } from '../shared/Icon';
import type { DashboardData } from '../../hooks/useDashboardData';

interface ProgressCardsProps {
  data: DashboardData | null;
}

type ProgressCardProps = {
  title: string;
  progress: number;
  insight: string;
  icon: string;
  index: number;
};

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

export const ProgressCards: React.FC<ProgressCardsProps> = ({ data }) => {
  const totalSolved = data?.totalSolved ?? 0;
  const streak = data?.streak ?? 0;

  // Calculate progress based on backend data
  const progressData = [
    {
      id: '1',
      title: 'Problem Solving',
      progress: Math.min(Math.round((totalSolved / 500) * 100), 100),
      insight: `${totalSolved}/500 problems solved`,
      icon: 'code-bracket',
    },
    {
      id: '2',
      title: 'Consistency',
      progress: Math.min(Math.round((streak / 30) * 100), 100),
      insight: `${streak} day current streak`,
      icon: 'calendar',
    },
    {
      id: '3',
      title: 'Difficulty Balance',
      progress: data?.medium && data?.hard ? Math.round(((data.medium + data.hard) / Math.max(totalSolved, 1)) * 100) : 33,
      insight: 'Focus on medium & hard problems',
      icon: 'chart-pie',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {progressData.map((item, index) => (
        <ProgressCard
          key={item.id}
          title={item.title}
          progress={item.progress}
          insight={item.insight}
          icon={item.icon}
          index={index}
        />
      ))}
    </div>
  );
};
