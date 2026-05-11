import React from 'react';
import type { Submission, SubmissionStatus } from '../../types/dsa';
import { Icon } from '../shared/Icon';
import { PlatformLogo } from './PlatformLogo';

export type SubmissionsTableProps = {
  title: string;
  submissions: Submission[];
  className?: string;
};

type DayGroup = {
  label: string;
  date: string;
  submissions: Submission[];
};

const getRelativeDayLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (targetDate.getTime() === today.getTime()) return 'Today';
  if (targetDate.getTime() === yesterday.getTime()) return 'Yesterday';

  const diffDays = Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const groupSubmissionsByDay = (submissions: Submission[]): DayGroup[] => {
  const groups = new Map<string, Submission[]>();

  for (const sub of submissions) {
    const dateKey = sub.date;
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(sub);
  }

  const sortedEntries = Array.from(groups.entries()).sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
  );

  return sortedEntries.map(([date, subs]) => ({
    label: getRelativeDayLabel(date),
    date,
    submissions: subs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  }));
};

const statusGlow = (status: SubmissionStatus) =>
  status === 'accepted'
    ? 'bg-dt-success shadow-[0_0_12px_rgba(34,197,94,0.3)]'
    : 'bg-dt-error shadow-[0_0_12px_rgba(239,68,68,0.3)]';

export const SubmissionsTable: React.FC<SubmissionsTableProps> = React.memo(
  ({ submissions, className }) => {
    const { recentGroups } = React.useMemo(() => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const recent = submissions.filter(sub => {
        const subDate = new Date(sub.date);
        return subDate >= sevenDaysAgo;
      });

      return {
        recentGroups: groupSubmissionsByDay(recent),
      };
    }, [submissions]);

    // Calculate streak
    const streak = React.useMemo(() => {
      if (submissions.length === 0) return 0;
      const sortedDates = [...new Set(submissions.map(s => s.date))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      let count = 0;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (sortedDates[0] !== today && sortedDates[0] !== yesterday) return 0;

      for (let i = 0; i < sortedDates.length; i++) {
        const d1 = new Date(sortedDates[i]);
        const d2 = i + 1 < sortedDates.length ? new Date(sortedDates[i + 1]) : null;
        count++;
        if (d2) {
          const diff = (d1.getTime() - d2.getTime()) / 86400000;
          if (diff > 1.5) break; // Gap larger than 1 day
        }
      }
      return count;
    }, [submissions]);

    return (
      <section className={['dt-card overflow-hidden transition-all duration-700 cubic-bezier(0.22, 1, 0.36, 1) hover:shadow-dt-floating group/table', className].filter(Boolean).join(' ')}>
        {/* Intelligence Header */}
        <div className="px-6 py-4 border-b border-dt-primary/5 bg-white/30 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-dt-primary animate-pulse shadow-[0_0_8px_rgba(124,92,252,0.8)]" />
            <span className="text-[10px] font-black text-dt-textSecondary uppercase tracking-widest opacity-80">Live Telemetry Feed</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/5 border border-orange-500/10 group-hover/table:border-orange-500/20 transition-colors">
            <Icon name="fire" size={10} className="text-orange-500" />
            <span className="text-[9px] font-black text-orange-600 uppercase tracking-tight">{streak} Day Momentum</span>
          </div>
        </div>

        <div className="p-2 sm:p-3">
          {recentGroups.length > 0 ? (
            <div className="flex flex-col gap-1">
              {recentGroups.map((group, groupIndex) => (
                <div key={group.date} className="flex flex-col">
                  {/* Soft Day Divider */}
                  <div className="flex items-center gap-3 py-2 px-3">
                    <span className="text-[9px] font-black text-dt-textSecondary/40 uppercase tracking-[0.15em] shrink-0">
                      {group.label}
                    </span>
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-dt-primary/5 via-dt-primary/5 to-transparent" />
                  </div>

                  {/* Submission Items */}
                  <div className="flex flex-col gap-1">
                    {group.submissions.map((submission, idx) => (
                      <div
                        key={submission.id}
                        className="group/item flex items-center justify-between gap-3 p-3 rounded-[14px] hover:bg-white/60 hover:shadow-sm border border-transparent hover:border-dt-primary/10 transition-all duration-500 cubic-bezier(0.22, 1, 0.36, 1)"
                        style={{ animation: `dtFadeIn 600ms cubic-bezier(0.22, 1, 0.36, 1) ${(groupIndex * 80 + idx * 40)}ms both` }}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={['w-1.5 h-1.5 rounded-full shrink-0 group-hover/item:scale-125 transition-transform duration-500', statusGlow(submission.status)].join(' ')} />
                          <div className="w-8 h-8 rounded-xl bg-white/80 border border-dt-primary/5 flex items-center justify-center shrink-0 shadow-sm group-hover/item:shadow-dt-card group-hover/item:border-dt-primary/20 transition-all duration-500">
                            <PlatformLogo platform={submission.platform} iconSize={16} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[14px] font-bold text-dt-text group-hover/item:text-dt-primary transition-colors truncate block tracking-tight">
                              {submission.problem}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] text-dt-textSecondary font-black uppercase tracking-widest opacity-40">{submission.topic}</span>
                              <span className="w-0.5 h-0.5 rounded-full bg-dt-textSecondary/20" />
                              <span className="text-[9px] text-dt-textSecondary font-black uppercase tracking-widest opacity-40">{submission.platform}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 opacity-40 group-hover/item:opacity-100 transition-opacity duration-500">
                          <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-lg bg-dt-bg text-dt-textSecondary border border-dt-primary/5 group-hover/item:bg-white transition-colors">
                            {submission.difficulty || '—'}
                          </span>
                          <button className="w-7 h-7 rounded-lg bg-dt-bg flex items-center justify-center border border-dt-primary/5 hover:bg-dt-primary hover:text-white hover:border-dt-primary transition-all duration-300">
                            <Icon name="arrow-up-right" size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-[24px] bg-dt-primary/5 flex items-center justify-center border border-dt-primary/10 mb-5 group-hover/table:scale-110 transition-transform duration-700">
                <Icon name="code-bracket" size={24} className="text-dt-primary/20" />
              </div>
              <p className="text-[14px] font-bold text-dt-textSecondary tracking-tight">Zero recent activity packets</p>
              <p className="text-[11px] text-dt-textMuted mt-1 uppercase tracking-widest font-black opacity-50">Initiate coding block to sync</p>
            </div>
          )}
        </div>

        {/* Intelligence Footer */}
        <div className="px-6 py-4 border-t border-dt-primary/5 bg-dt-bg/20 backdrop-blur-md flex justify-center">
          <button
            type="button"
            className="flex items-center gap-2 text-[10px] font-black text-dt-primary uppercase tracking-[0.2em] hover:tracking-[0.25em] transition-all duration-500 group/btn"
          >
            Access full telemetry
            <Icon name="arrow-right" size={10} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
    );
  }
);

SubmissionsTable.displayName = 'SubmissionsTable';