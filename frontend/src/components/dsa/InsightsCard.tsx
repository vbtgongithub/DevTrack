import React from 'react';
import { PlatformLogo } from './PlatformLogo';
import { Icon } from '../shared/Icon';
import type { Platform, Submission, Topic } from '../../types/dsa';

export type InsightsCardProps = {
  title: string;
  submissions: Submission[];
  topics: Topic[];
  className?: string;
};

const platformLabel: Record<Platform, string> = {
  leetcode: 'LeetCode',
  codeforces: 'Codeforces',
  codechef: 'CodeChef',
  github: 'GitHub',
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const parseSubmissionDate = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const InsightsCard: React.FC<InsightsCardProps> = React.memo(
  ({ title, submissions, topics, className }) => {
    const total = submissions.length;
    const accepted = submissions.filter((s) => s.status === 'accepted').length;
    const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

    const platformCounts = submissions.reduce<Record<Platform, number>>(
      (acc, s) => {
        acc[s.platform] = (acc[s.platform] ?? 0) + 1;
        return acc;
      },
      { leetcode: 0, codeforces: 0, codechef: 0, github: 0 }
    );

    const mostActivePlatform = (Object.keys(platformCounts) as Platform[]).reduce((best, p) =>
      platformCounts[p] > platformCounts[best] ? p : best
      , 'leetcode');

    const topTopic = topics.reduce<Topic | null>((best, t) => {
      if (!best) return t;
      return t.progress > best.progress ? t : best;
    }, null);

    const weakestTopic = topics.reduce<Topic | null>((best, t) => {
      if (!best) return t;
      return t.progress < best.progress ? t : best;
    }, null);

    const insights = React.useMemo(() => {
      const parsed = submissions
        .map((s) => ({ ...s, parsedDate: parseSubmissionDate(s.date) }))
        .filter((s): s is Submission & { parsedDate: Date } => Boolean(s.parsedDate));

      const weekend = parsed.filter((s) => {
        const day = s.parsedDate.getDay();
        return day === 0 || day === 6;
      }).length;
      const weekday = parsed.length - weekend;

      const recent = parsed
        .slice()
        .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime())
        .slice(0, 6);

      const recentWrongByTopic = recent.reduce<Record<string, number>>((acc, s) => {
        if (s.status === 'wrong') acc[s.topic] = (acc[s.topic] ?? 0) + 1;
        return acc;
      }, {});

      const recentWorstTopic = Object.keys(recentWrongByTopic).sort((a, b) => (recentWrongByTopic[b] ?? 0) - (recentWrongByTopic[a] ?? 0))[0] ?? null;

      const weekendBias = weekend > weekday ? 'Solve volume peaks on weekends.' : 'Consistent weekday focus detected.';
      const accuracyHint = recentWorstTopic ? `${recentWorstTopic} accuracy is dipping.` : 'Submission accuracy is stable.';
      const rec = weakestTopic ? `Target ${weakestTopic.name} for mastery ROI.` : 'Push boundaries on hard problems.';

      return [weekendBias, accuracyHint, rec];
    }, [submissions, weakestTopic]);

    const trendData = React.useMemo(() => {
      const today = new Date();
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - (6 - i));
        return d;
      });

      const fmt = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

      const parsed = submissions
        .map((s) => parseSubmissionDate(s.date))
        .filter((d): d is Date => Boolean(d));

      return days.map((day) => {
        const count = parsed.filter((d) => isSameDay(d, day)).length;
        return { day: fmt.format(day), count };
      });
    }, [submissions]);

    const max = Math.max(1, ...trendData.map((d) => d.count));
    const weeklyGoal = 18;
    const weeklyDone = trendData.reduce((a, b) => a + b.count, 0);

    const difficultyDist = React.useMemo(() => {
      const dist = { easy: 0, medium: 0, hard: 0 };
      submissions.forEach((s) => {
        if (s.difficulty === 'easy') dist.easy += 1;
        else if (s.difficulty === 'medium') dist.medium += 1;
        else if (s.difficulty === 'hard') dist.hard += 1;
      });
      return dist;
    }, [submissions]);

    return (
      <section
        className={[
          'relative overflow-hidden bg-white/40 backdrop-blur-2xl border border-dt-primary/10 rounded-2xl p-4 sm:p-5 shadow-dt-card group/insights',
          'hover:shadow-dt-floating hover:-translate-y-0.5 transition-all duration-500',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Intelligence Mesh Glow - Smaller */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-dt-primary/8 rounded-full blur-[50px] pointer-events-none group-hover/insights:scale-125 transition-transform duration-700 ease-out opacity-50" />

        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <h3 className="text-[15px] font-black tracking-tighter text-dt-text">{title}</h3>
            <p className="text-[9px] font-black text-dt-textSecondary/50 tracking-widest uppercase mt-0.5">Neural Synthesis</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dt-primary/5 border border-dt-primary/10 text-dt-primary text-[8px] font-black uppercase tracking-widest group-hover/insights:border-dt-primary/30 transition-colors">
            <div className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dt-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-dt-primary"></span>
            </div>
            Live
          </div>
        </div>

        {/* Intelligence Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-10 relative z-10">
          <div className="bg-white/50 backdrop-blur-md p-4 rounded-[20px] border border-dt-primary/5 group-hover/insights:border-dt-primary/10 transition-colors">
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-dt-textSecondary/50 mb-1.5">Acceptance</p>
            <p className="text-2xl font-black tracking-tighter text-dt-text leading-none">{acceptanceRate}%</p>
          </div>
          <div className="bg-white/50 backdrop-blur-md p-4 rounded-[20px] border border-dt-primary/5 group-hover/insights:border-dt-primary/10 transition-colors">
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-dt-textSecondary/50 mb-1.5">Active Hub</p>
            <div className="flex items-center gap-1.5 mt-1">
              <PlatformLogo platform={mostActivePlatform} iconSize={14} className="" />
              <p className="text-lg font-black tracking-tighter text-dt-text truncate leading-none">{platformLabel[mostActivePlatform]}</p>
            </div>
          </div>
          <div className="bg-white/50 backdrop-blur-md p-4 rounded-[20px] border border-dt-primary/5 group-hover/insights:border-dt-primary/10 transition-colors">
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-dt-textSecondary/50 mb-1.5">Prime Vector</p>
            <p className="text-lg font-black tracking-tighter text-dt-text truncate leading-none mt-1">{topTopic?.name ?? '—'}</p>
          </div>
        </div>

        <div className="relative z-10 flex flex-col xl:flex-row gap-10">
          {/* Visual Analytics */}
          <div className="flex-1 flex flex-col gap-9">
            <div>
              <div className="flex items-center justify-between mb-5">
                <p className="text-[10px] font-black text-dt-textSecondary/50 uppercase tracking-widest">Velocity Pipeline</p>
                <div className="px-2 py-0.5 rounded-md bg-dt-primary/5 border border-dt-primary/10">
                  <span className="text-[9px] font-black text-dt-primary">{weeklyDone}/{weeklyGoal} Weekly</span>
                </div>
              </div>
              <div className="flex items-end gap-1.5 h-16">
                {trendData.map((d, i) => {
                  const h = Math.round((d.count / max) * 64);
                  const isToday = i === trendData.length - 1;
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group/bar">
                      <div
                        className={['w-full max-w-[28px] rounded-t-lg rounded-b-[3px] transition-all duration-700 cubic-bezier(0.22, 1, 0.36, 1)', isToday ? 'bg-dt-primary shadow-[0_0_15px_rgba(124,92,252,0.4)] scale-x-110' : 'bg-dt-textDisabled/20 group-hover/bar:bg-dt-primary/40 group-hover/bar:scale-y-105'].join(' ')}
                        style={{ height: `${Math.max(4, h)}px` }}
                      />
                      <span className={['text-[9px] font-black uppercase tracking-tighter', isToday ? 'text-dt-primary' : 'text-dt-textMuted opacity-40'].join(' ')}>{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Composition */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-dt-textSecondary/50 uppercase tracking-widest">Complexity Variance</p>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-dt-bg/40 flex shadow-inner">
                {(() => {
                  const sum = Math.max(1, difficultyDist.easy + difficultyDist.medium + difficultyDist.hard);
                  const e = Math.round((difficultyDist.easy / sum) * 100);
                  const m = Math.round((difficultyDist.medium / sum) * 100);
                  const h = 100 - e - m;
                  return (
                    <>
                      <div className="h-full transition-all duration-1000 cubic-bezier(0.22, 1, 0.36, 1)" style={{ width: `${e}%`, background: '#10B981' }} />
                      <div className="h-full transition-all duration-1000 cubic-bezier(0.22, 1, 0.36, 1)" style={{ width: `${m}%`, background: '#F59E0B' }} />
                      <div className="h-full transition-all duration-1000 cubic-bezier(0.22, 1, 0.36, 1)" style={{ width: `${h}%`, background: '#F43F5E' }} />
                    </>
                  );
                })()}
              </div>
              <div className="grid grid-cols-3 gap-3 text-[9px] font-black uppercase tracking-widest">
                <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-500/5 py-1.5 rounded-lg border border-emerald-500/10">Easy</div>
                <div className="flex items-center justify-center gap-1.5 text-amber-600 bg-amber-500/5 py-1.5 rounded-lg border border-amber-500/10">Med</div>
                <div className="flex items-center justify-center gap-1.5 text-rose-600 bg-rose-500/5 py-1.5 rounded-lg border border-rose-500/10">Hard</div>
              </div>
            </div>
          </div>

          {/* AI Synthesis */}
          <div className="flex-1 flex flex-col gap-5">
            <div className="flex-1 bg-white/40 backdrop-blur-2xl rounded-[24px] p-6 border border-dt-primary/10 shadow-sm relative group/ai">
              <div className="absolute top-0 left-0 w-1 h-full bg-dt-primary/20 rounded-full" />
              <ul className="space-y-5">
                {insights.map((text, i) => (
                  <li key={`ins-${i}`} className="flex items-start gap-4 group/item">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-dt-primary shrink-0 shadow-[0_0_8px_rgba(124,92,252,0.6)] group-hover/item:scale-125 transition-transform duration-300" />
                    <span className="text-[14px] font-bold text-dt-text leading-tight tracking-tight opacity-80 group-hover/item:opacity-100 transition-opacity">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[20px] bg-dt-primary/5 p-5 border border-dt-primary/10 flex items-start gap-4 hover:bg-dt-primary/10 transition-all duration-500 group/rec">
              <div className="w-10 h-10 rounded-xl bg-white border border-dt-primary/10 flex items-center justify-center shrink-0 shadow-sm group-hover/rec:scale-105 transition-transform duration-500">
                <Icon name="bolt" size={20} className="text-dt-primary" />
              </div>
              <div>
                <p className="text-[9px] font-black text-dt-primary uppercase tracking-[0.2em] mb-1">ROI Focus</p>
                <p className="text-[14px] font-bold text-dt-text leading-tight tracking-tight">
                  {weakestTopic ? `Review ${weakestTopic.name} patterns.` : 'Push boundaries on hard problems.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

InsightsCard.displayName = 'InsightsCard';
