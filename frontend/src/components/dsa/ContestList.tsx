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
    <section className={['bg-white/80 backdrop-blur-3xl rounded-[32px] border border-dt-primary/10 shadow-[0_8px_40px_rgba(124,92,252,0.06)] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_16px_60px_rgba(124,92,252,0.12)] group/contests relative', className].filter(Boolean).join(' ')}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,0.03),transparent_50%)] pointer-events-none" />
      <div className="px-8 py-6 border-b border-dt-primary/10 bg-white/50 backdrop-blur-md flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#A78BFA] shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
          <span className="text-[11px] font-black text-dt-textSecondary/80 uppercase tracking-[0.25em]">Competition Matrix</span>
        </div>
        <span className="text-[10px] font-black text-[#A78BFA] px-3 py-1.5 rounded-full bg-[#A78BFA]/10 border border-[#A78BFA]/20 group-hover/contests:border-[#A78BFA]/40 transition-colors uppercase tracking-widest shadow-inner">
          {contests.length} Logged
        </span>
      </div>

      <div className="p-3 flex flex-col gap-2 relative z-10">
        {displayedContests.map((contest, idx) => {
          const ratingChange = contest.ratingChange;
          const isPositive = ratingChange !== null && ratingChange > 0;
          const isNegative = ratingChange !== null && ratingChange < 0;

          return (
            <div
              key={contest.id}
              className="group/item relative flex items-center justify-between gap-4 p-4 rounded-[20px] bg-white/40 hover:bg-white/80 shadow-sm hover:shadow-[0_8px_30px_rgba(167,139,250,0.08)] border border-dt-primary/5 hover:border-[#A78BFA]/30 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden"
              style={{ animation: `dtFadeIn 600ms cubic-bezier(0.22, 1, 0.36, 1) ${idx * 40}ms both` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#A78BFA]/5 to-transparent -translate-x-full group-hover/item:animate-[shimmer_1.5s_infinite]" />
              <div className="flex items-center gap-4 min-w-0 relative z-10">
                <div className="w-10 h-10 rounded-[14px] bg-white border border-dt-primary/10 flex items-center justify-center shrink-0 shadow-sm group-hover/item:shadow-md group-hover/item:border-[#A78BFA]/40 transition-all duration-500 group-hover/item:-translate-y-0.5">
                  <PlatformLogo platform={platformFromLabel(contest.platform)} iconSize={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-black text-dt-text truncate leading-snug group-hover/item:text-[#A78BFA] transition-colors tracking-tight">
                    {contest.contestName}
                  </p>
                  <p className="text-[10px] text-dt-textSecondary/70 font-black uppercase tracking-[0.2em] mt-1">
                    {contest.platform} <span className="opacity-50 mx-1">•</span> {new Date(contest.participatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 relative z-10">
                {contest.rank !== null && (
                  <span className="text-[11px] font-black text-dt-textSecondary/80 bg-dt-bg px-3 py-1 rounded-xl border border-dt-primary/10 tabular-nums tracking-tighter shadow-inner">
                    #{contest.rank}
                  </span>
                )}
                {ratingChange !== null && (
                  <span className={[
                    'text-[11px] font-black px-3 py-1 rounded-xl tabular-nums min-w-[48px] text-center transition-all duration-300 shadow-sm',
                    isPositive ? 'text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20' :
                      isNegative ? 'text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20' :
                        'text-dt-textSecondary bg-dt-bg border border-dt-primary/10',
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