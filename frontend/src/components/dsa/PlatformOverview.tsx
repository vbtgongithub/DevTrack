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
        'dt-card p-4 sm:p-5 shadow-dt-card relative overflow-hidden group/ecosystem',
        'hover:shadow-dt-floating transition-all duration-500',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Background Mesh - Tighter */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-dt-primary/5 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover/ecosystem:scale-110 transition-transform duration-700" />

      <div className="flex flex-col mb-4 relative z-10">
        <h3 className="text-[15px] font-black tracking-tighter text-dt-text">{title}</h3>
        <p className="text-[9px] font-black text-dt-textSecondary/50 tracking-[0.15em] uppercase mt-0.5">Global Node Infrastructure</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
        {items.map((item, index) => {
          return (
            <div
              key={item.platform}
              className="group/item flex flex-col p-4 rounded-2xl bg-white/40 backdrop-blur-md border border-dt-primary/5 hover:bg-white/80 hover:border-dt-primary/20 hover:shadow-dt-card hover:-translate-y-0.5 transition-all duration-400 relative overflow-hidden"
              style={{ animation: `dtFadeIn 400ms ease-out ${index * 60}ms both` }}
            >
              {/* Platform Watermark - Subtle */}
              <div className="absolute top-0 right-0 p-3 opacity-[0.02] pointer-events-none group-hover/item:opacity-[0.05] group-hover/item:scale-125 transition-all duration-500">
                <PlatformLogo platform={item.platform} iconSize={60} />
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-white border border-dt-primary/5 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover/item:shadow-dt-card group-hover/item:scale-105 group-hover/item:border-dt-primary/10 transition-all duration-500">
                  <PlatformLogo platform={item.platform} iconSize={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-black text-dt-text tracking-tight truncate leading-none group-hover/item:text-dt-primary transition-colors">{label[item.platform]}</div>
                  <div className="text-[10px] font-black text-dt-textSecondary/40 mt-1.5 uppercase tracking-widest">{platformCounts[item.platform] ?? 0} Packets</div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-dt-primary/5">
                <div className="text-2xl font-black tracking-tighter text-dt-text group-hover/item:text-dt-primary transition-colors">{item.stat}</div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-dt-textSecondary/30 mt-1">Ecosystem Index</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});

PlatformOverview.displayName = 'PlatformOverview';
