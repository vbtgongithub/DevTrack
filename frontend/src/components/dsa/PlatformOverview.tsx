import React from 'react';
import type { Platform, PlatformOverviewItem, Submission } from '../../types/dsa';
import { PlatformLogo } from './PlatformLogo';

export type PlatformOverviewProps = {
  title: string;
  items: PlatformOverviewItem[];
  submissions?: Submission[];
  className?: string;
};

const label: Record<Platform, string> = {
  leetcode: 'LeetCode',
  codeforces: 'Codeforces',
  codechef: 'CodeChef',
  github: 'GitHub',
};

export const PlatformOverview: React.FC<PlatformOverviewProps> = React.memo(({ title, items, submissions, className }) => {
  const platformCounts = React.useMemo(() => {
    const base: Record<Platform, number> = { leetcode: 0, codeforces: 0, codechef: 0, github: 0 };
    if (!submissions) return base;
    return submissions.reduce<Record<Platform, number>>((acc, s) => {
      acc[s.platform] = (acc[s.platform] ?? 0) + 1;
      return acc;
    }, base);
  }, [submissions]);

  return (
    <section
      className={[
        'bg-white/80 backdrop-blur-3xl rounded-[32px] border border-dt-primary/10 shadow-[0_8px_40px_rgba(124,92,252,0.06)] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_16px_60px_rgba(124,92,252,0.12)] group/ecosystem relative p-8 lg:p-10',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(124,92,252,0.03),transparent_50%)] pointer-events-none" />

      {/* Background Mesh - Tighter */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-dt-primary/10 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-60 group-hover/ecosystem:scale-[1.5] transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]" />

      <div className="flex flex-col mb-8 relative z-10">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-dt-primary shadow-[0_0_8px_rgba(124,92,252,0.8)] animate-pulse" />
          <span className="text-[10px] font-black text-dt-primary uppercase tracking-[0.2em]">Platform Intelligence Network</span>
        </div>
        <h3 className="text-2xl font-black tracking-tighter text-dt-text">{title}</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
        {items.map((item, index) => {
          return (
            <div
              key={item.platform}
              className="group/item flex flex-col p-5 rounded-[24px] bg-white/60 backdrop-blur-xl border border-dt-primary/10 hover:bg-white/90 hover:border-dt-primary/30 hover:shadow-[0_8px_30px_rgba(124,92,252,0.08)] hover:-translate-y-1 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden"
              style={{ animation: `dtFadeIn 600ms ease-out ${index * 60}ms both` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-dt-primary/5 to-transparent -translate-x-full group-hover/item:animate-[shimmer_1.5s_infinite]" />

              {/* Platform Watermark - Subtle */}
              <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none group-hover/item:opacity-[0.08] group-hover/item:scale-150 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
                <PlatformLogo platform={item.platform} iconSize={80} />
              </div>

              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="w-12 h-12 bg-white border border-dt-primary/15 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover/item:shadow-md group-hover/item:scale-110 group-hover/item:border-dt-primary/40 transition-all duration-500">
                  <PlatformLogo platform={item.platform} iconSize={24} />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-black text-dt-text tracking-tight truncate leading-none group-hover/item:text-dt-primary transition-colors">{label[item.platform]}</div>
                  <div className="text-[10px] font-black text-dt-textSecondary/60 mt-1.5 uppercase tracking-[0.2em]">{platformCounts[item.platform] ?? 0} Packets</div>
                </div>
              </div>

              <div className="mt-auto pt-5 border-t border-dt-primary/10 relative z-10">
                <div className="text-3xl font-black tracking-tighter text-dt-text group-hover/item:text-dt-primary transition-colors">{item.stat}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-dt-textSecondary/50 mt-1">Ecosystem Index</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});

PlatformOverview.displayName = 'PlatformOverview';
