import React from 'react';
import type { Submission, Platform, SubmissionStatus } from '../../types/dsa';
import { Icon } from '../shared/Icon';
import { PlatformLogo } from './PlatformLogo';

export type SubmissionsTableProps = {
  title: string;
  submissions: Submission[];
  className?: string;
};

const statusClass = (status: SubmissionStatus) =>
  status === 'accepted'
    ? 'bg-[#ECFDF3] text-[#065F46]'
    : 'bg-[#FEF2F2] text-[#991B1B]';

const difficultyClass = (difficulty?: Submission['difficulty']) => {
  if (difficulty === 'easy') return 'bg-[#F0FDF4] text-[#166534]';
  if (difficulty === 'medium') return 'bg-[#FFFBEB] text-[#92400E]';
  if (difficulty === 'hard') return 'bg-[#FEF2F2] text-[#991B1B]';
  return 'bg-[#F3F4F6] text-dt-muted';
};

const platformLabel: Record<Platform, string> = {
  leetcode: 'LeetCode',
  codeforces: 'Codeforces',
  codechef: 'CodeChef',
  github: 'GitHub',
};

const statusMeta: Record<SubmissionStatus, { label: string; icon: string }> = {
  accepted: { label: 'Accepted', icon: 'check-circle' },
  wrong: { label: 'Wrong', icon: 'exclamation-triangle' },
};

export const SubmissionsTable: React.FC<SubmissionsTableProps> = React.memo(
  ({ title, submissions, className }) => {
    const [statusFilter, setStatusFilter] = React.useState<'all' | SubmissionStatus>('all');
    const [difficultyFilter, setDifficultyFilter] = React.useState<'all' | NonNullable<Submission['difficulty']>>('all');
    const [platformFilter, setPlatformFilter] = React.useState<'all' | Platform>('all');
    const [sortBy, setSortBy] = React.useState<'date-desc' | 'date-asc' | 'status' | 'platform' | 'difficulty'>('date-desc');

    const rows = React.useMemo(() => {
      const filtered = submissions.filter((s) => {
        const okStatus = statusFilter === 'all' ? true : s.status === statusFilter;
        const okDifficulty = difficultyFilter === 'all' ? true : s.difficulty === difficultyFilter;
        const okPlatform = platformFilter === 'all' ? true : s.platform === platformFilter;
        return okStatus && okDifficulty && okPlatform;
      });

      const byDate = (a: Submission, b: Submission) => {
        const ad = new Date(a.date).getTime();
        const bd = new Date(b.date).getTime();
        const safeA = Number.isFinite(ad) ? ad : 0;
        const safeB = Number.isFinite(bd) ? bd : 0;
        return safeA - safeB;
      };

      const byText = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' });

      const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'date-asc') return byDate(a, b);
        if (sortBy === 'date-desc') return byDate(b, a);
        if (sortBy === 'status') return byText(a.status, b.status);
        if (sortBy === 'platform') return byText(a.platform, b.platform);
        if (sortBy === 'difficulty') return byText(a.difficulty ?? 'z', b.difficulty ?? 'z');
        return 0;
      });

      return sorted;
    }, [submissions, statusFilter, difficultyFilter, platformFilter, sortBy]);

    return (
      <section
        className={[
          'dt-card p-4',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-tight text-dt-text">{title}</h3>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-dt-border/70 bg-dt-bg/40 px-3 py-2">
              <span className="text-xs font-semibold text-dt-muted">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="bg-transparent text-sm text-dt-text outline-none"
                aria-label="Filter by status"
              >
                <option value="all">All</option>
                <option value="accepted">Accepted</option>
                <option value="wrong">Wrong</option>
              </select>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-dt-border/70 bg-dt-bg/40 px-3 py-2">
              <span className="text-xs font-semibold text-dt-muted">Difficulty</span>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as typeof difficultyFilter)}
                className="bg-transparent text-sm text-dt-text outline-none"
                aria-label="Filter by difficulty"
              >
                <option value="all">All</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-dt-border/70 bg-dt-bg/40 px-3 py-2">
              <span className="text-xs font-semibold text-dt-muted">Platform</span>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value as typeof platformFilter)}
                className="bg-transparent text-sm text-dt-text outline-none"
                aria-label="Filter by platform"
              >
                <option value="all">All</option>
                <option value="leetcode">LeetCode</option>
                <option value="codeforces">Codeforces</option>
                <option value="github">GitHub</option>
              </select>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-dt-border/70 bg-dt-bg/40 px-3 py-2">
              <span className="text-xs font-semibold text-dt-muted">Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-transparent text-sm text-dt-text outline-none"
                aria-label="Sort submissions"
              >
                <option value="date-desc">Newest</option>
                <option value="date-asc">Oldest</option>
                <option value="status">Status</option>
                <option value="difficulty">Difficulty</option>
                <option value="platform">Platform</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-dt-muted uppercase border-b border-black/5">
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 pr-4 font-medium">Problem</th>
                <th className="pb-3 pr-4 font-medium">Topic</th>
                <th className="pb-3 pr-4 font-medium">Difficulty</th>
                <th className="pb-3 pr-4 font-medium">Platform</th>
                <th className="pb-3 pr-4 font-medium">Language</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((submission) => (
                <tr
                  key={submission.id}
                  className="border-b border-black/5 hover:bg-[#F3F4F6] cursor-default transition-colors duration-150"
                >
                  <td className="py-3 pr-4">
                    <span
                      className={[
                        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium',
                        statusClass(submission.status),
                      ].join(' ')}
                    >
                      <Icon name={statusMeta[submission.status].icon} size={14} className="text-current" />
                      {statusMeta[submission.status].label}
                    </span>
                  </td>
                  <td className="py-4 pr-4">
                    <button
                      type="button"
                      className="text-dt-text font-medium hover:underline underline-offset-4"
                      onClick={() => {}}
                    >
                      {submission.problem}
                    </button>
                  </td>
                  <td className="py-4 pr-4 text-dt-muted">{submission.topic}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={[
                        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
                        difficultyClass(submission.difficulty),
                      ].join(' ')}
                    >
                      {submission.difficulty ? submission.difficulty[0].toUpperCase() + submission.difficulty.slice(1) : '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-dt-muted">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-white">
                        <PlatformLogo platform={submission.platform} iconSize={14} className="" />
                      </div>
                      <span className="text-sm text-dt-text">{platformLabel[submission.platform]}</span>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-dt-muted">{submission.language}</td>
                  <td className="py-4 text-dt-muted">{submission.date}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-dt-muted">
              No submissions match your filters.
            </div>
          ) : null}
        </div>
      </section>
    );
  }
);

SubmissionsTable.displayName = 'SubmissionsTable';
