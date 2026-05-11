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
      <section className={['bg-white/80 backdrop-blur-3xl rounded-[32px] border border-dt-primary/10 shadow-[0_8px_40px_rgba(124,92,252,0.06)] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_16px_60px_rgba(124,92,252,0.12)] group/table relative', className].filter(Boolean).join(' ')}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,92,252,0.03),transparent_50%)] pointer-events-none" />
        {/* Intelligence Header */}
        <div className="px-8 py-6 border-b border-dt-primary/10 bg-white/50 backdrop-blur-md flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            <span className="text-[11px] font-black text-dt-textSecondary/80 uppercase tracking-[0.25em]">Live Intelligence Feed</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 group-hover/table:border-orange-500/30 transition-colors shadow-inner">
            <Icon name="fire" size={12} className="text-orange-500" />
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{streak} Day Momentum</span>
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
                  <div className="flex flex-col gap-2">
                    {group.submissions.map((submission, idx) => (
                      <div
                        key={submission.id}
                        className="group/item relative flex items-center justify-between gap-4 p-4 rounded-[20px] bg-white/40 hover:bg-white/80 shadow-sm hover:shadow-[0_8px_30px_rgba(124,92,252,0.08)] border border-dt-primary/5 hover:border-dt-primary/20 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden"
                        style={{ animation: `dtFadeIn 600ms cubic-bezier(0.22, 1, 0.36, 1) ${(groupIndex * 80 + idx * 40)}ms both` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-dt-primary/5 to-transparent -translate-x-full group-hover/item:animate-[shimmer_1.5s_infinite]" />
                        <div className="flex items-center gap-4 min-w-0 relative z-10">
                          <div className={['w-2 h-2 rounded-full shrink-0 group-hover/item:scale-[1.5] transition-transform duration-500', statusGlow(submission.status)].join(' ')} />
                          <div className="w-10 h-10 rounded-[14px] bg-white border border-dt-primary/10 flex items-center justify-center shrink-0 shadow-sm group-hover/item:shadow-md group-hover/item:border-dt-primary/30 transition-all duration-500 group-hover/item:-translate-y-0.5">
                            <PlatformLogo platform={submission.platform} iconSize={20} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[15px] font-black text-dt-text group-hover/item:text-dt-primary transition-colors truncate block tracking-tight">
                              {submission.problem}
                            </span>
                            <div className="flex items-center gap-2.5 mt-1">
                              <span className="text-[10px] text-dt-textSecondary/70 font-black uppercase tracking-[0.2em]">{submission.topic}</span>
                              <span className="w-1 h-1 rounded-full bg-dt-textSecondary/30" />
                              <span className="text-[10px] text-dt-textSecondary/70 font-black uppercase tracking-[0.2em]">{submission.platform}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 opacity-60 group-hover/item:opacity-100 transition-opacity duration-500 relative z-10">
                          <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-xl bg-dt-bg text-dt-textSecondary border border-dt-primary/10 group-hover/item:bg-white group-hover/item:text-dt-primary group-hover/item:shadow-sm transition-all duration-300">
                            {submission.difficulty || '—'}
                          </span>
                          <button className="w-8 h-8 rounded-xl bg-dt-bg flex items-center justify-center border border-dt-primary/10 hover:bg-dt-primary hover:text-white hover:border-dt-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <Icon name="arrow-up-right" size={14} />
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