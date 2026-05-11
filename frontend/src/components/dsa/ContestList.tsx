import React from 'react';
import type { Contest } from '../../types/dsa';
import { PlatformLogo } from './PlatformLogo';
import { Icon } from '../shared/Icon';

export type ContestListProps = {
  title: string;
  contests: Contest[];
  className?: string;
};

const platformFromLabel = (platform: string) => {
  const lower = platform.toLowerCase();
  if (lower.includes('leet')) return 'leetcode';
  if (lower.includes('force')) return 'codeforces';
  return 'codechef';
};

export const ContestList: React.FC<ContestListProps> = React.memo(({ contests, className }) => {
  const [showAll, setShowAll] = React.useState(false);

  // Limit contests for compact view
  const displayedContests = showAll ? contests : contests.slice(0, 5);
  const hiddenCount = contests.length - displayedContests.length;

  if (contests.length === 0) {
    return (
      <section className={['dt-card p-8 flex flex-col items-center justify-center text-center h-full group/contests', className].filter(Boolean).join(' ')}>
        <div className="w-14 h-14 rounded-[24px] bg-dt-secondary/5 flex items-center justify-center border border-dt-secondary/10 mb-5 group-hover/contests:scale-110 transition-transform duration-700">
          <Icon name="trophy" size={24} className="text-dt-secondary/20" />
        </div>
        <p className="text-[14px] font-bold text-dt-textSecondary tracking-tight">No active contest log</p>
        <p className="text-[11px] text-dt-textMuted mt-1 uppercase tracking-widest font-black opacity-50">Join events to benchmark skills</p>
      </section>
    );
  }

  return (
    <section className={['dt-card flex flex-col transition-all duration-700 cubic-bezier(0.22, 1, 0.36, 1) hover:shadow-dt-floating group/contests', className].filter(Boolean).join(' ')}>
      <div className="px-6 py-4 border-b border-dt-primary/5 bg-white/30 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-dt-secondary shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
          <span className="text-[10px] font-black text-dt-textSecondary uppercase tracking-widest opacity-80">Competition Matrix</span>
        </div>
        <span className="text-[9px] font-black text-dt-secondary px-2.5 py-1 rounded-full bg-dt-secondary/5 border border-dt-secondary/10 group-hover/contests:border-dt-secondary/30 transition-colors uppercase tracking-widest">
          {contests.length} Logged
        </span>
      </div>

      <div className="p-2 sm:p-3 flex flex-col gap-1">
        {displayedContests.map((contest, idx) => {
          const ratingChange = contest.ratingChange;
          const isPositive = ratingChange !== null && ratingChange > 0;
          const isNegative = ratingChange !== null && ratingChange < 0;

          return (
            <div
              key={contest.id}
              className="group/item flex items-center justify-between gap-3 p-3 rounded-[14px] hover:bg-white/60 hover:shadow-sm border border-transparent hover:border-dt-secondary/10 transition-all duration-500 cubic-bezier(0.22, 1, 0.36, 1)"
              style={{ animation: `dtFadeIn 600ms cubic-bezier(0.22, 1, 0.36, 1) ${idx * 40}ms both` }}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/80 border border-dt-primary/5 flex items-center justify-center shrink-0 shadow-sm group-hover/item:shadow-dt-card group-hover/item:border-dt-secondary/20 transition-all duration-500">
                  <PlatformLogo platform={platformFromLabel(contest.platform)} iconSize={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-dt-text truncate leading-snug group-hover/item:text-dt-secondary transition-colors tracking-tight">
                    {contest.contestName}
                  </p>
                  <p className="text-[9px] text-dt-textSecondary font-black uppercase tracking-widest opacity-40">
                    {contest.platform} • {new Date(contest.participatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {contest.rank !== null && (
                  <span className="text-[10px] font-black text-dt-textSecondary bg-dt-bg px-2 py-0.5 rounded-lg border border-dt-primary/5 tabular-nums tracking-tighter">
                    #{contest.rank}
                  </span>
                )}
                {ratingChange !== null && (
                  <span className={[
                    'text-[10px] font-black px-2 py-0.5 rounded-lg tabular-nums min-w-[40px] text-center transition-all duration-300',
                    isPositive ? 'text-dt-success bg-dt-success/5 border border-dt-success/10' :
                      isNegative ? 'text-[#F06A6A] bg-[#F06A6A]/5 border border-[#F06A6A]/10' :
                        'text-dt-textMuted bg-dt-bg border border-dt-primary/5',
                  ].join(' ')}>
                    {isPositive ? '+' : ''}{ratingChange}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hiddenCount > 0 && (
        <div className="p-3 pt-1 border-t border-dt-primary/5">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="w-full py-2.5 rounded-xl text-[10px] font-black text-dt-textSecondary/60 uppercase tracking-widest hover:bg-dt-secondary/5 hover:text-dt-secondary transition-all duration-300"
          >
            Show {hiddenCount} historical packets
          </button>
        </div>
      )}

      {showAll && (
        <div className="p-3 pt-1 border-t border-dt-primary/5">
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="w-full py-2.5 rounded-xl text-[9px] font-black text-dt-textMuted uppercase tracking-widest hover:bg-dt-bg transition-all duration-300"
          >
            Collapse Log
          </button>
        </div>
      )}
    </section>
  );
});

ContestList.displayName = 'ContestList';