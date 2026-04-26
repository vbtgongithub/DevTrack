// ============================================================================
// GamificationPanel.tsx — PRIMARY ZONE: Streak + Daily Goal + Achievements
// ============================================================================
import React from 'react';
import { Icon } from '../shared/Icon';
import type { DashboardData } from '../../hooks/useDashboardData';

interface GamificationPanelProps {
  data: DashboardData | null;
}

const StreakCard: React.FC<{ streak: number; longestStreak: number }> = ({ streak, longestStreak }) => {
  const weekActivity = Array(7).fill(false);
  if (streak > 0) {
    for (let i = 0; i < Math.min(streak, 7); i++) {
      weekActivity[6 - i] = true;
    }
  }

  return (
    <div className="md:col-span-2 bg-gradient-to-br from-orange-50 via-white to-amber-50/50 border border-orange-100 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
            <Icon name="fire" size={26} className="text-white" />
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-900 tabular-nums leading-none">{streak}</div>
            <div className="text-sm text-gray-500 mt-1 font-medium">day streak</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 font-medium">Personal Best</div>
          <div className="text-xl font-bold text-gray-900 tabular-nums">{longestStreak}</div>
          <div className="text-[10px] text-gray-400">days</div>
        </div>
      </div>

      {/* Week activity dots */}
      <div className="flex items-center gap-2.5">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
          <div key={`${day}-${i}`} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className={[
                'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold',
                'transition-all duration-200',
                weekActivity[i]
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                  : 'bg-gray-100 text-gray-400',
              ].join(' ')}
            >
              {weekActivity[i] ? '✓' : ''}
            </div>
            <span className="text-[10px] text-gray-400 font-medium">{day}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-orange-100/60 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-emerald-600 font-medium">Keep the streak alive!</span>
      </div>
    </div>
  );
};

const DailyGoalCard: React.FC<{ data: DashboardData | null }> = ({ data }) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const target = 5;
  const solved = Math.min(data?.totalSolved ?? 0, target);
  const pct = Math.round((solved / target) * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
            <Icon name="target" size={20} className="text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Daily Goal</div>
            <div className="text-xs text-gray-500">{solved}/{target} problems</div>
          </div>
        </div>
        <span className="text-2xl font-bold text-gray-900 tabular-nums">{pct}%</span>
      </div>

      <div className="h-3 w-full bg-blue-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: mounted ? `${pct}%` : '0%' }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-3">
          {[
            { label: 'Easy', count: data?.easy ?? 0, color: 'bg-emerald-500' },
            { label: 'Med', count: data?.medium ?? 0, color: 'bg-amber-500' },
            { label: 'Hard', count: data?.hard ?? 0, color: 'bg-red-500' },
          ].map((d) => (
            <div key={d.label} className="flex items-center gap-1.5">
              <div className={['w-2 h-2 rounded-full', d.color].join(' ')} />
              <span className="text-[11px] text-gray-500">{d.count} {d.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Icon name="clock" size={12} className="text-gray-400" />
          Today
        </div>
      </div>
    </div>
  );
};

const AchievementsCard: React.FC = () => {
  const achievements = [
    { id: '1', title: 'First Blood', icon: '⚔️', unlocked: true },
    { id: '2', title: 'Week Warrior', icon: '🔥', unlocked: true },
    { id: '3', title: 'Problem Solver', icon: '💡', unlocked: true },
    { id: '4', title: 'Consistent', icon: '📅', unlocked: false },
    { id: '5', title: 'Expert', icon: '🏆', unlocked: false },
    { id: '6', title: 'Master', icon: '👑', unlocked: false },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
            <Icon name="award" size={16} className="text-yellow-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Achievements</h3>
        </div>
        <span className="text-xs text-gray-400 font-medium tabular-nums">
          {achievements.filter((a) => a.unlocked).length}/{achievements.length}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {achievements.map((badge, index) => (
          <div
            key={badge.id}
            className={[
              'relative flex flex-col items-center gap-1.5 p-3 rounded-xl border',
              'transition-all duration-200',
              badge.unlocked
                ? 'bg-white border-gray-200 hover:shadow-md hover:-translate-y-0.5 cursor-default'
                : 'bg-gray-50 border-gray-100 opacity-40 grayscale cursor-default',
            ].join(' ')}
            style={{
              animation: `dtFadeIn 520ms ease-out ${index * 60}ms both`,
            }}
            title={badge.unlocked ? badge.title : `${badge.title} — Locked`}
          >
            <span className="text-xl">{badge.icon}</span>
            <span className="text-[10px] font-semibold text-gray-700 text-center leading-tight">{badge.title}</span>
            {!badge.unlocked && (
              <div className="absolute top-1.5 right-1.5">
                <Icon name="lock-closed" size={10} className="text-gray-300" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const GamificationPanel: React.FC<GamificationPanelProps> = ({ data }) => {
  const streak = data?.streak ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StreakCard streak={streak} longestStreak={data?.streakData?.longestStreak ?? 0} />
      <DailyGoalCard data={data} />
      <AchievementsCard />
    </div>
  );
};
