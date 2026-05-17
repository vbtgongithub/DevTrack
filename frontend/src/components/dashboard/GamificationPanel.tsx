// ============================================================================
// GamificationPanel.tsx — PRIMARY ZONE: Streak + Daily Goal + Achievements
// ============================================================================
import React from 'react';
import { Icon } from '../shared/Icon';
import { useAchievements } from '../../hooks/useDashboardQueries';
import type { ApiStreakData, ApiMission } from '../../types/api.types';

interface StreakProps {
  streakData: ApiStreakData | null | undefined;
}

interface DailyGoalProps {
  missions: ApiMission[];
}

interface AchievementsProps {
  unlockedCount?: number;
}

/* ─── Streak Card (col-span-2 — LARGE, PRIMARY) ─── */
const StreakCard: React.FC<StreakProps> = ({ streakData }) => {
  const currentStreak = streakData?.currentStreak ?? 0;
  const longestStreak = streakData?.longestStreak ?? 0;
  const isActiveToday = streakData?.isActiveToday ?? false;

  const weekActivity = React.useMemo(() => {
    const streakHistory = streakData?.streakHistory ?? [];
    const last7 = streakHistory.slice(-7);
    const result: { day: string; active: boolean }[] = [];

    for (let i = 0; i < 7; i++) {
      const item = last7[i];
      let dayLabel = '?';
      if (item) {
        const d = new Date(item.date);
        dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
      }
      result.push({
        day: dayLabel,
        active: (item?.count ?? 0) > 0
      });
    }
    return result;
  }, [streakData?.streakHistory]);

  return (
    <div
      className="md:col-span-2 bg-gradient-to-br from-[#6D4FF2] via-[#7C5CFC] to-[#A78BFA] rounded-[28px] p-4 shadow-dt-floating hover:shadow-[0_40px_120px_rgba(124,92,252,0.18)] hover:-translate-y-1.5 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden group"
      style={{ animation: 'dtFadeIn 800ms cubic-bezier(0.16,1,0.3,1) both' }}
    >
      {/* Cinematic Overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.05),transparent_30%)]" />

      {/* Subtle Noise/Grain Texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-white/20 border border-white/30 backdrop-blur-md shadow-sm">
        <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">BEST: {longestStreak}</span>
      </div>

      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-2xl relative shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-white/5 animate-pulse" />
            <Icon name="fire" size={28} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] relative z-10" />
          </div>
          <div>
            <div className="text-5xl font-black text-white tabular-nums leading-none tracking-tighter drop-shadow-lg">{currentStreak}</div>
            <div className="text-[11px] text-white/80 mt-1 font-bold tracking-[0.1em] uppercase opacity-90">day streak</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 relative z-10">
        {weekActivity.map((item, i) => (
          <div key={`${item.day}-${i}`} className="flex-1 aspect-square max-w-[40px] rounded-full flex items-center justify-center transition-all duration-500 relative">
            <div
              className={[
                'absolute inset-0 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-500',
                item.active
                  ? 'bg-white/90 text-[#7C5CFC] shadow-[0_4px_15px_rgba(255,255,255,0.4)] scale-110 z-10 backdrop-blur-md border border-white'
                  : 'bg-white/5 text-white/40 border border-white/20 backdrop-blur-sm',
              ].join(' ')}
            >
              {item.active ? (
                <Icon name="check" size={16} className="text-[#7C5CFC]" />
              ) : (
                <span className="tracking-tighter">{item.day}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {isActiveToday && (
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-3 relative z-10">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white shadow-[0_0_12px_white]"></span>
          </div>
          <span className="text-[15px] text-white font-bold tracking-tight opacity-95">Activity Logged — Consistency is your superpower</span>
        </div>
      )}
    </div>
  );
};

/* ─── Daily Goal Card ─── */
const DailyGoalCard: React.FC<DailyGoalProps> = ({ missions }) => {
  const dailyMission = missions.find(m => m.type === 'daily' && m.status !== 'completed' && m.status !== 'expired');
  const solved = dailyMission?.currentCount ?? 0;
  const target = dailyMission?.targetCount ?? 6;
  const pct = target > 0 ? Math.round((solved / target) * 100) : 0;

  return (
    <div
      className="dt-card p-4 flex flex-col justify-between bg-white rounded-[28px] border border-gray-300 shadow-dt-floating hover:shadow-dt-card-hover hover:border-dt-primary/30 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden"
      style={{ animation: 'dtFadeIn 800ms cubic-bezier(0.16,1,0.3,1) 100ms both' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,252,0.03),transparent_40%)]" />

      <div className="relative flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-dt-primary/10 flex items-center justify-center shrink-0 shadow-sm border border-dt-primary/5">
          <Icon name="target" size={20} className="text-dt-primary" />
        </div>
        <div>
          <div className="text-[10px] text-dt-textMuted font-black uppercase tracking-[0.2em]">Focus</div>
          <div className="text-lg font-black text-dt-text tracking-tighter leading-tight">Daily Goal</div>
        </div>
      </div>

      {!dailyMission ? (
        <div className="relative mt-3 flex items-center justify-center h-full">
          <p className="text-[12px] text-dt-textSecondary font-bold text-center">Sync to set goals</p>
        </div>
      ) : (
        <div className="relative mt-3">
          <div className="flex items-end justify-between mb-1.5">
            <div className="text-2xl font-black text-dt-text tabular-nums tracking-tighter leading-none">{pct}<span className="text-sm text-dt-textSecondary/40 ml-0.5">%</span></div>
            <div className="text-[10px] font-bold text-dt-textSecondary/60 tabular-nums">{solved}/{target} done</div>
          </div>
          <div className="h-2 w-full bg-dt-primary/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7C5CFC] to-[#A78BFA] rounded-full transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Achievements Grid ─── */
const AchievementsCard: React.FC<AchievementsProps> = () => {
  const { data: achievementsData } = useAchievements();
  const achievements = achievementsData?.achievements ?? [];

  // Take top 2 unlocked achievements
  const displayAchievements = achievements.filter(a => a.isUnlocked).slice(0, 2);

  // If less than 2 unlocked, just show whatever is first to fill 2 slots
  if (displayAchievements.length < 2) {
    const lockedToFill = achievements.filter(a => !a.isUnlocked).slice(0, 2 - displayAchievements.length);
    displayAchievements.push(...lockedToFill);
  }

  return (
    <div
      className="dt-card p-4 flex flex-col justify-between bg-white rounded-[28px] border border-gray-300 shadow-dt-floating hover:shadow-dt-card-hover hover:border-dt-success/30 transition-all duration-700 relative overflow-hidden"
      style={{ animation: 'dtFadeIn 800ms cubic-bezier(0.16,1,0.3,1) 200ms both' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.03),transparent_40%)]" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-dt-success/10 flex items-center justify-center shrink-0 border border-dt-success/5 shadow-sm">
            <Icon name="award" size={20} className="text-dt-success" />
          </div>
          <div>
            <div className="text-[10px] text-dt-success/60 font-black uppercase tracking-[0.2em]">Ecosystem</div>
            <h3 className="text-lg font-black text-dt-text tracking-tighter leading-tight">Badges</h3>
          </div>
        </div>
      </div>

      <div className="relative flex flex-col gap-2 mt-3">
        {displayAchievements.map((badge, index) => (
          <div
            key={badge.id}
            className={[
              'flex items-center gap-3 p-2 rounded-[16px] border transition-all duration-500',
              badge.isUnlocked
                ? 'bg-white border-dt-success/10 shadow-sm'
                : 'bg-dt-bg/40 border-transparent opacity-40 grayscale'
            ].join(' ')}
            style={{ animation: `dtFadeIn 500ms ease ${index * 100 + 300}ms both` }}
            title={badge.description}
          >
            <div className={[
              'w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0',
              badge.isUnlocked ? 'bg-dt-success/5' : 'bg-gray-200/50'
            ].join(' ')}>
              <span>{badge.icon}</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-black text-dt-textSecondary leading-tight uppercase tracking-[0.1em] truncate">{badge.title}</span>
            </div>
            {!badge.isUnlocked && (
              <div className="ml-auto opacity-50 pr-1">
                <Icon name="lock-closed" size={12} className="text-dt-textMuted" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Exported Panel — PRIMARY ZONE layout ─── */
interface GamificationPanelProps {
  streakData: ApiStreakData | null | undefined;
  missions: ApiMission[];
}

export const GamificationPanel: React.FC<GamificationPanelProps> = ({ streakData, missions }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-stretch">
      <StreakCard streakData={streakData} />
      <DailyGoalCard missions={missions} />
      <AchievementsCard />
    </div>
  );
};