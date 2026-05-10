import React from 'react';
import { PlatformLogo } from './PlatformLogo';
import type { DsaStat, Platform, Submission, Topic } from '../../types/dsa';

export type InsightsCardProps = {
  title: string;
  submissions: Submission[];
  topics: Topic[];
  stats?: DsaStat[];
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
  ({ title, submissions, topics, stats, className }) => {
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

      const weekendBias = weekend > weekday ? 'You solve more on weekends — keep that ritual.' : 'Weekdays are your strength — protect those focus blocks.';
      const accuracyHint = recentWorstTopic ? `Accuracy dipped in ${recentWorstTopic} recently — do 3 focused reps.` : 'Accuracy looks stable — push one harder problem today.';
      const rec = weakestTopic ? `Try solving 3 ${weakestTopic.name} problems to improve.` : 'Pick one weak topic and do 3 reps.';

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

    const rating = React.useMemo(() => {
      const item = (stats ?? []).find((s) => s.label.toLowerCase().includes('rating'));
      const n = item ? Number(String(item.value).replace(/[^0-9]/g, '')) : NaN;
      return Number.isFinite(n) ? n : null;
    }, [stats]);

    return (
      <section
        className={[
          'dt-card p-4',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <h3 className="text-lg font-semibold tracking-tight text-dt-text">{title}</h3>

        {/* Quick stats row */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-dt-muted">Acceptance rate</p>
            <p className="text-sm font-semibold text-dt-text">{acceptanceRate}%</p>
            <p className="text-xs text-dt-muted">{accepted}/{total} accepted</p>
          </div>
          <div>
            <p className="text-xs text-dt-muted">Most active</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <PlatformLogo platform={mostActivePlatform} iconSize={12} className="" />
              <p className="text-sm font-semibold text-dt-text">{platformLabel[mostActivePlatform]}</p>
            </div>
            <p className="text-xs text-dt-muted">{platformCounts[mostActivePlatform]} submissions</p>
          </div>
          <div>
            <p className="text-xs text-dt-muted">Top topic</p>
            <p className="text-sm font-semibold text-dt-text">{topTopic?.name ?? '—'}</p>
            <p className="text-xs text-dt-muted">{topTopic?.progress ?? 0}% mastery</p>
          </div>
        </div>

        {/* 7-day mini bar chart */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-dt-muted">Last 7 days</p>
            <p className="text-xs font-semibold text-dt-text">{weeklyDone}/{weeklyGoal} goal</p>
          </div>
          <div className="mt-3 flex items-end gap-2 h-16">
            {trendData.map((d) => {
              const h = Math.round((d.count / max) * 56);
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full max-w-[28px] rounded-sm"
                    style={{ height: `${Math.max(3, h)}px`, backgroundColor: '#9CA3AF' }}
                    title={`${d.count} submissions`}
                  />
                  <span className="text-[10px] text-dt-muted">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Difficulty distribution */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-dt-muted">Difficulty distribution</p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-sm bg-[#E5E7EB]">
            {(() => {
              const sum = Math.max(1, difficultyDist.easy + difficultyDist.medium + difficultyDist.hard);
              const e = Math.round((difficultyDist.easy / sum) * 100);
              const m = Math.round((difficultyDist.medium / sum) * 100);
              const h = 100 - e - m;
              return (
                <div className="flex h-full w-full">
                  <div className="h-full" style={{ width: `${e}%`, background: '#D1D5DB' }} title={`${difficultyDist.easy} easy`} />
                  <div className="h-full" style={{ width: `${m}%`, background: '#9CA3AF' }} title={`${difficultyDist.medium} medium`} />
                  <div className="h-full" style={{ width: `${h}%`, background: '#6B7280' }} title={`${difficultyDist.hard} hard`} />
                </div>
              );
            })()}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-dt-muted">
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: '#D1D5DB' }} />Easy</div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: '#9CA3AF' }} />Medium</div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: '#6B7280' }} />Hard</div>
          </div>
        </div>

        {/* Intelligent insights */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-dt-muted">Intelligent insights</p>
          <ul className="mt-2 space-y-2">
            {insights.map((text, i) => (
              <li key={`ins-${i}`} className="text-sm text-dt-text flex items-start gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-[#9CA3AF] shrink-0" aria-hidden="true" />
                <span className="leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendation */}
        <div className="mt-5 rounded-md bg-[#F9FAFB] px-3 py-2.5">
          <p className="text-xs font-semibold text-dt-muted">Focus area</p>
          <p className="mt-1 text-sm text-dt-text leading-relaxed">
            {weakestTopic ? (
              <>
                Focus next: <span className="font-semibold">{weakestTopic.name}</span>. Solve 3 problems and re-check mastery.
              </>
            ) : (
              'Pick one weak topic and solve 3 problems.'
            )}
          </p>
        </div>

        {/* Rating */}
        {rating ? (
          <div className="mt-4 flex items-center justify-between text-sm">
            <div>
              <p className="text-xs text-dt-muted">Contest rating</p>
              <p className="font-semibold text-dt-text">{rating}</p>
            </div>
          </div>
        ) : null}
      </section>
    );
  }
);

InsightsCard.displayName = 'InsightsCard';
