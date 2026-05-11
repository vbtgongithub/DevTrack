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
    const result: boolean[] = [];
    for (let i = 0; i < 7; i++) {
      result.push(last7[i]?.count > 0);
    }
    return result;
  }, [streakData?.streakHistory]);

  return (
    <div
      className="md:col-span-2 bg-gradient-to-br from-[#6D4FF2] via-[#7C5CFC] to-[#A78BFA] rounded-[28px] p-6 shadow-dt-floating hover:shadow-[0_40px_120px_rgba(124,92,252,0.18)] hover:-translate-y-1.5 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden group"
      style={{ animation: 'dtFadeIn 800ms cubic-bezier(0.16,1,0.3,1) both' }}
    >
      {/* Cinematic Overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.05),transparent_30%)]" />

      {/* Subtle Noise/Grain Texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      <div className="relative flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-2xl relative shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-white/5 animate-pulse" />
            <Icon name="fire" size={32} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] relative z-10" />
          </div>
          <div>
            <div className="text-6xl font-black text-white tabular-nums leading-none tracking-tighter drop-shadow-lg">{currentStreak}</div>
            <div className="text-[12px] text-white/80 mt-1 font-bold tracking-[0.1em] uppercase opacity-90">day streak</div>
          </div>
        </div>
        <div className="text-right self-start pt-1">
          <div className="text-[9px] text-white/50 font-black uppercase tracking-[0.25em] mb-0.5">Personal Best</div>
          <div className="text-3xl font-black text-white tabular-nums tracking-tighter drop-shadow-md leading-none">{longestStreak}</div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 relative z-10">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
          <div key={`${day}-${i}`} className="flex-1 aspect-square max-w-[40px] rounded-xl flex items-center justify-center transition-all duration-500 relative">
            <div
              className={[
                'absolute inset-0 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-500',
                weekActivity[i]
                  ? 'bg-white text-dt-primary shadow-[0_10px_25px_rgba(255,255,255,0.25)] scale-110 z-10'
                  : 'bg-white/5 text-white/30 border border-white/10 backdrop-blur-sm',
              ].join(' ')}
            >
              {weekActivity[i] ? (
                <Icon name="check" size={20} className="text-dt-primary" />
              ) : (
                <span className="tracking-tighter">{day}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {isActiveToday && (
        <div className="mt-10 pt-6 border-t border-white/10 flex items-center gap-3 relative z-10">
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
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const dailyMission = missions.find(m => m.type === 'daily' && m.status !== 'completed' && m.status !== 'expired');
  const solved = dailyMission?.currentCount ?? 0;
  const target = dailyMission?.targetCount ?? 6;
  const pct = target > 0 ? Math.round((solved / target) * 100) : 0;

  return (
    <div
      className="dt-card p-6 flex flex-col bg-white rounded-[28px] border border-dt-primary/10 shadow-dt-floating hover:shadow-dt-card-hover transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden"
      style={{ animation: 'dtFadeIn 800ms cubic-bezier(0.16,1,0.3,1) 100ms both' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,252,0.03),transparent_40%)]" />

      <div className="relative flex items-start gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-dt-primary/10 flex items-center justify-center shrink-0 shadow-sm border border-dt-primary/5">
          <Icon name="target" size={24} className="text-dt-primary" />
        </div>
        <div>
          <div className="text-[11px] text-dt-textMuted font-black uppercase tracking-[0.2em] mb-1">Current Focus</div>
          <div className="text-xl font-black text-dt-text tracking-tighter">Daily Goal</div>
        </div>
      </div>

      {!dailyMission ? (
        <div className="relative flex-1 flex flex-col items-center justify-center text-center py-4">
          <div className="w-16 h-16 rounded-full bg-dt-primary/5 flex items-center justify-center mb-4 relative">
            <div className="absolute inset-0 rounded-full border border-dashed border-dt-primary/20 animate-[spin_10s_linear_infinite]" />
            <Icon name="arrow-path" size={24} className="text-dt-textMuted/40" />
          </div>
          <p className="text-[14px] text-dt-textSecondary font-bold max-w-[140px] leading-tight">Sync accounts to set goals</p>
        </div>
      ) : (
        <div className="relative flex-1 flex flex-col">
          <div className="flex items-end justify-between mb-4">
            <div className="text-5xl font-black text-dt-text tabular-nums tracking-tighter leading-none">{pct}<span className="text-2xl text-dt-textSecondary/40 ml-1">%</span></div>
            <div className="text-sm font-bold text-dt-textSecondary/60 tabular-nums pb-1">{solved}/{target} done</div>
          </div>

          <div className="h-3 w-full bg-dt-primary/5 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-gradient-to-r from-[#7C5CFC] to-[#A78BFA] rounded-full transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ width: mounted ? `${pct}%` : '0%' }}
            />
          </div>

          <div className="mt-auto pt-6 border-t border-dt-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-dt-primary/5 text-dt-primary text-xs font-black">
              <span className="text-sm">✨</span>
              {dailyMission.xpReward} XP
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-dt-textSecondary/50">
              <Icon name="clock" size={14} />
              {dailyMission.category}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Achievements Grid ─── */
const AchievementsCard: React.FC<AchievementsProps> = () => {
  const { data: achievementsData, isLoading } = useAchievements();

  const achievements = achievementsData?.achievements ?? [];
  const unlockedCount = achievementsData?.totalUnlocked ?? 0;
  const totalAchievements = achievementsData?.totalAchievements ?? 0;

  // Take first 6 achievements for display
  const displayAchievements = achievements.slice(0, 6);

  return (
    <div
      className="dt-card p-6 bg-white rounded-[28px] border border-dt-success/10 shadow-dt-floating hover:shadow-dt-card-hover transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden"
      style={{ animation: 'dtFadeIn 800ms cubic-bezier(0.16,1,0.3,1) 200ms both' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.03),transparent_40%)]" />

      <div className="relative flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-dt-success/10 flex items-center justify-center shrink-0 border border-dt-success/5 shadow-sm">
            <Icon name="award" size={24} className="text-dt-success" />
          </div>
          <div>
            <div className="text-[11px] text-dt-success/60 font-black uppercase tracking-[0.2em] mb-1">Milestones</div>
            <h3 className="text-xl font-black text-dt-text tracking-tighter">Badges</h3>
          </div>
        </div>
        <div className="bg-dt-success/5 border border-dt-success/10 px-3 py-1 rounded-xl text-xs font-black text-dt-success tabular-nums">
          {unlockedCount}/{totalAchievements}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 relative z-10 flex-1">
          {[...Array(6)].map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border border-transparent opacity-30"
            >
              <div className="w-8 h-8 rounded-xl bg-dt-bg animate-pulse" />
              <div className="h-3 w-12 bg-dt-bg rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : displayAchievements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Icon name="trophy" size={32} className="text-dt-textMuted mb-3 opacity-50" />
          <p className="text-sm font-bold text-dt-textSecondary">No achievements yet</p>
          <p className="text-xs text-dt-textMuted mt-1">Start coding to unlock badges!</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 relative z-10 flex-1">
          {displayAchievements.map((badge, index) => (
            <div
              key={badge.id}
              className={[
                'relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all duration-500',
                badge.isUnlocked
                  ? 'bg-white border-dt-success/10 shadow-sm hover:shadow-xl hover:-translate-y-1.5'
                  : 'bg-dt-bg/50 border-transparent opacity-30 grayscale',
              ].join(' ')}
              style={{
                animation: `dtFadeIn 500ms cubic-bezier(0.16,1,0.3,1) ${index * 60 + 400}ms both`,
              }}
              title={badge.description}
            >
              <span className="text-2xl filter drop-shadow-sm">{badge.icon}</span>
              <span className="text-[9px] font-black text-dt-textSecondary text-center leading-tight uppercase tracking-widest">{badge.title}</span>
              {!badge.isUnlocked && (
                <div className="absolute top-1 right-1 opacity-40">
                  <Icon name="lock-closed" size={10} className="text-dt-textMuted" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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