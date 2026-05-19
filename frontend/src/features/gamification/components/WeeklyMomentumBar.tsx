// ============================================================================
// WeeklyMomentumBar.tsx — 7-Day XP Chart with Consistency Score
// ============================================================================
// Full-width bar chart showing XP earned per day for the last 7 days.
// Today's bar is highlighted. SVG-based, no external chart library.
// ============================================================================

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap } from 'lucide-react';
import { durations, easePremium, prefersReducedMotion } from '../../../design-system/motion';

interface WeeklyMomentumBarProps {
  weeklyXpData?: { date: string; xp: number }[];
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WeeklyMomentumBar: React.FC<WeeklyMomentumBarProps> = ({ weeklyXpData }) => {
  const today = new Date().getDay(); // 0 = Sun, 1 = Mon, etc
  const todayIndex = today === 0 ? 6 : today - 1; // Convert to Mon=0 index

  // Build 7-day data from streakHistory or provided data
  const days = useMemo(() => {
    if (weeklyXpData && weeklyXpData.length > 0) {
      return weeklyXpData.slice(-7).map((d, i) => ({
        label: DAY_LABELS[i] ?? '?',
        xp: d.xp,
        isToday: i === todayIndex,
        date: d.date,
      }));
    }

    // Fallback: generate empty week
    return DAY_LABELS.map((label, i) => ({
      label,
      xp: 0,
      isToday: i === todayIndex,
      date: '',
    }));
  }, [weeklyXpData, todayIndex]);

  const maxXp = Math.max(...days.map((d) => d.xp), 1);
  const totalXp = days.reduce((sum, d) => sum + d.xp, 0);
  const activeDays = days.filter((d) => d.xp > 0).length;
  const consistencyScore = Math.round((activeDays / 7) * 100);

  return (
    <div
      className="w-full bg-white/90 backdrop-blur-xl rounded-[22px] border border-gray-200/60 shadow-[0_4px_24px_rgba(124,92,252,0.06)] hover:shadow-[0_8px_32px_rgba(124,92,252,0.1)] p-5 relative overflow-hidden transition-all duration-500"
      style={{ animation: 'dtFadeIn 700ms cubic-bezier(0.16,1,0.3,1) 200ms both' }}
    >
      {/* Refined Atmospheric Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,252,0.025),transparent_50%)]" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-dt-primary/8 flex items-center justify-center shadow-sm border border-dt-primary/10 backdrop-blur-sm">
              <TrendingUp size={18} className="text-dt-primary" />
            </div>
            <div>
              <h3 className="text-[16px] font-black text-dt-text tracking-[-0.02em] leading-tight">Weekly Momentum</h3>
              <p className="text-[10px] text-dt-textSecondary/70 font-semibold tracking-tight">
                {totalXp.toLocaleString()} XP this week
              </p>
            </div>
          </div>

          {/* Refined Consistency Badge */}
          <div className={[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border backdrop-blur-sm transition-all duration-300',
            consistencyScore >= 80 ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/40 shadow-[0_2px_8px_rgba(16,185,129,0.15)]' :
            consistencyScore >= 50 ? 'bg-amber-50/80 text-amber-700 border-amber-200/40 shadow-[0_2px_8px_rgba(245,158,11,0.15)]' :
            'bg-slate-50/80 text-slate-600 border-slate-200/40'
          ].join(' ')}>
            <Zap size={11} />
            <span className="tabular-nums">{consistencyScore}%</span>
            <span className="uppercase tracking-[0.08em]">Consistency</span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="flex items-end gap-2.5 h-[90px]">
          {days.map((day, index) => {
            const heightPercent = maxXp > 0 ? (day.xp / maxXp) * 100 : 0;
            const isEmpty = day.xp === 0;

            return (
              <div
                key={day.label}
                className="flex-1 flex flex-col items-center gap-2 group relative"
              >
                {/* Refined Tooltip */}
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  <div className="bg-[#0F172A] text-white text-[9px] font-bold px-2.5 py-1 rounded-[8px] shadow-lg whitespace-nowrap">
                    {day.label}: {day.xp} XP
                  </div>
                </div>

                {/* Bar */}
                <div className="w-full h-[66px] relative flex items-end">
                  <motion.div
                    className={[
                      'w-full rounded-[8px] relative overflow-hidden transition-shadow duration-300',
                      day.isToday ? 'shadow-[0_3px_12px_rgba(124,92,252,0.2)]' : '',
                      isEmpty ? 'border border-dashed border-dt-textMuted/15' : '',
                    ].join(' ')}
                    style={{
                      minHeight: isEmpty ? '20px' : '6px',
                      background: isEmpty
                        ? 'transparent'
                        : day.isToday
                          ? 'linear-gradient(180deg, #7C5CFC, #A78BFA)'
                          : 'linear-gradient(180deg, #E2E8F0, #CBD5E1)',
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: isEmpty ? '20px' : `${Math.max(6, heightPercent)}%` }}
                    transition={prefersReducedMotion
                      ? { duration: 0 }
                      : { delay: index * 0.04, duration: durations.slow, ease: easePremium }
                    }
                  >
                    {/* Calmer Shimmer on Today */}
                    {day.isToday && !isEmpty && (
                      <div
                        className="absolute inset-0 opacity-15"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
                          animation: 'shimmer 2.5s infinite linear',
                          backgroundSize: '200% 100%',
                        }}
                      />
                    )}
                  </motion.div>
                </div>

                {/* Day Label */}
                <span className={[
                  'text-[9px] font-bold uppercase tracking-[0.08em]',
                  day.isToday
                    ? 'text-dt-primary'
                    : isEmpty
                      ? 'text-dt-textMuted/35'
                      : 'text-dt-textSecondary/60',
                ].join(' ')}>
                  {day.label}
                </span>

                {/* Today Indicator */}
                {day.isToday && (
                  <div className="w-1 h-1 rounded-full bg-dt-primary shadow-[0_0_4px_rgba(124,92,252,0.6)]" />
                )}
              </div>
            );
          })}
        </div>

        {/* Refined Streak Indicator */}
        <div className="mt-3.5 flex items-center gap-1.5">
          {days.map((day, index) => (
            <div
              key={`streak-${index}`}
              className={[
                'flex-1 h-1 rounded-full transition-all duration-300',
                day.xp > 0 ? 'bg-dt-primary/35 shadow-[0_0_4px_rgba(124,92,252,0.3)]' : 'bg-slate-100',
              ].join(' ')}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyMomentumBar;
