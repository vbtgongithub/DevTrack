import React from 'react';
import type { Topic } from '../../types/dsa';
import { Icon } from '../shared/Icon';

export type TopicProgressProps = {
  title: string;
  topics: Topic[];
  className?: string;
};

const RANK_LABELS: Record<string, string> = {
  'Arrays': 'Top 15%',
  'Dynamic Programming': 'Top 30%',
  'Trees': 'Top 25%',
  'Graphs': 'Top 60%',
  'Strings': 'Top 25%',
  'Binary Search': 'Top 10%',
  'Linked Lists': 'Top 20%',
  'Sorting': 'Top 15%',
};

export const TopicProgress: React.FC<TopicProgressProps> = React.memo(({ title, topics, className }) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(t);
  }, []);

  const weakest = React.useMemo(() => {
    return topics.reduce<Topic | null>((w, t) => (!w || t.progress < w.progress ? t : w), null);
  }, [topics]);

  const totalSolved = React.useMemo(() => topics.reduce((sum, t) => sum + Math.round(t.progress * 2.5), 0), [topics]);

  return (
    <section
      className={[
        'bg-white/80 backdrop-blur-3xl rounded-[32px] border border-dt-primary/10 shadow-[0_8px_40px_rgba(124,92,252,0.06)] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_16px_60px_rgba(124,92,252,0.12)] group/topics relative p-8 lg:p-10',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.03),transparent_50%)] pointer-events-none" />

      {/* Dynamic Mesh Atmosphere */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-[#10B981]/10 to-dt-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none group-hover/topics:scale-[1.5] transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]" />

      <div className="flex flex-col gap-2 mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
          <span className="text-[11px] font-black text-dt-textSecondary/80 uppercase tracking-[0.25em]">Algorithm Intelligence Matrix</span>
        </div>
        <div className="flex items-end justify-between">
          <h3 className="text-2xl font-black tracking-tighter text-dt-text">{title}</h3>
          <p className="text-[11px] font-bold text-dt-textSecondary/80 tracking-widest uppercase mb-1">
            {totalSolved} solutions <span className="opacity-50 mx-1">•</span> {topics.length} vectors
          </p>
        </div>
      </div>

      <ul className="space-y-6 relative z-10">
        {topics.map((topic, index) => {
          const barColor =
            topic.progress >= 80 ? 'from-emerald-400 to-emerald-300'
              : topic.progress >= 60 ? 'from-dt-primary to-dt-secondary'
                : topic.progress >= 40 ? 'from-amber-400 to-orange-400'
                  : 'from-coral-400 to-red-400';
          const barBg =
            topic.progress >= 80 ? 'bg-emerald-500/5'
              : topic.progress >= 60 ? 'bg-dt-primary/5'
                : topic.progress >= 40 ? 'bg-amber-500/5'
                  : 'bg-coral-500/5';
          const rank = RANK_LABELS[topic.name] || 'Top 40%';

          return (
            <li key={topic.name} className="group/item relative bg-white/40 hover:bg-white/80 p-4 rounded-[20px] border border-dt-primary/5 hover:border-[#10B981]/30 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)] overflow-hidden" style={{ animation: `dtFadeIn 800ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 60}ms both` }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#10B981]/5 to-transparent -translate-x-full group-hover/item:animate-[shimmer_1.5s_infinite]" />
              <div className="mb-3 flex items-end justify-between relative z-10">
                <div className="flex flex-col">
                  <span className="text-[15px] font-black text-dt-text tracking-tight leading-none group-hover/item:text-[#10B981] transition-colors">{topic.name}</span>
                  <span className="text-[10px] text-dt-textSecondary/80 font-black tracking-[0.2em] uppercase mt-2 opacity-60 group-hover/item:opacity-100 transition-opacity">
                    {rank} Tier
                  </span>
                </div>
                <span className="text-[14px] font-black text-dt-text tabular-nums leading-none tracking-tight">{topic.progress}%</span>
              </div>
              <div className={['h-2 w-full rounded-full overflow-hidden transition-colors duration-500 shadow-inner relative z-10', barBg].join(' ')}>
                <div
                  className={['h-full rounded-full bg-gradient-to-r transition-all duration-1000', barColor].join(' ')}
                  style={{
                    width: mounted ? `${topic.progress}%` : '0%',
                    transitionDelay: `${index * 60}ms`,
                    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)'
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {/* Actionable Focus Area */}
      {weakest && (
        <div className="mt-8 relative overflow-hidden p-6 rounded-[24px] bg-amber-500/5 border border-amber-500/10 flex items-start gap-5 group/focus hover:bg-amber-500/10 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.08)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover/focus:scale-[1.5] transition-transform duration-700" />
          <div className="w-12 h-12 rounded-[16px] bg-white border border-amber-500/20 flex items-center justify-center shrink-0 shadow-sm relative z-10 group-hover/focus:scale-110 transition-transform duration-500">
            <Icon name="target" size={20} className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
          </div>
          <div className="relative z-10 min-w-0">
            <div className="text-[10px] font-black text-amber-600/80 tracking-[0.2em] uppercase mb-1.5">Primary Target Vector</div>
            <div className="text-[16px] font-black text-dt-text tracking-tight truncate">{weakest.name} Mastery</div>
            <div className="text-[12px] font-bold text-dt-textSecondary/80 mt-1.5 leading-relaxed">
              Optimize your algorithmic baseline by solving 3 high-impact problems in this vector space.
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

TopicProgress.displayName = 'TopicProgress';
