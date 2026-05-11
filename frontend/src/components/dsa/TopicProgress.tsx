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
  'Stacks': 'Top 20%',
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
        'dt-card p-4 sm:p-5 shadow-dt-card overflow-hidden relative group/topics',
        'hover:shadow-dt-floating hover:-translate-y-0.5 transition-all duration-500',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Dynamic Mesh Atmosphere */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-dt-primary/5 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-50 group-hover/topics:scale-110 transition-transform duration-700" />

      <div className="flex items-start justify-between gap-3 mb-4 relative z-10">
        <div>
          <h3 className="text-[15px] font-black tracking-tighter text-dt-text">{title}</h3>
          <p className="text-[9px] font-black text-dt-textSecondary/50 tracking-[0.15em] uppercase mt-0.5">
            {totalSolved} solutions • {topics.length} vectors
          </p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-dt-primary/5 border border-dt-primary/10 flex items-center justify-center text-dt-primary shadow-sm">
          <Icon name="chart-bar" size={16} />
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
            <li key={topic.name} className="group/item" style={{ animation: `dtFadeIn 800ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 60}ms both` }}>
              <div className="mb-2.5 flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-dt-text tracking-tight leading-none group-hover/item:text-dt-primary transition-colors">{topic.name}</span>
                  <span className="text-[9px] text-dt-textSecondary font-black tracking-widest uppercase mt-1.5 opacity-30 group-hover/item:opacity-60 transition-opacity">
                    {rank} Tier
                  </span>
                </div>
                <span className="text-[12px] font-black text-dt-text tabular-nums leading-none tracking-tighter">{topic.progress}%</span>
              </div>
              <div className={['h-[5px] w-full rounded-full overflow-hidden transition-colors duration-500', barBg].join(' ')}>
                <div
                  className={['h-full rounded-full bg-gradient-to-r transition-all duration-1000', barColor].join(' ')}
                  style={{
                    width: mounted ? `${topic.progress}%` : '0%',
                    transitionDelay: `${index * 60}ms`,
                    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)'
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {/* Actionable Focus Area */}
      {weakest && (
        <div className="mt-9 relative overflow-hidden p-5 rounded-[22px] bg-amber-500/5 border border-amber-500/10 flex items-start gap-4 group/focus hover:bg-amber-500/10 transition-colors duration-500">
          <div className="w-10 h-10 rounded-xl bg-white border border-amber-500/10 flex items-center justify-center shrink-0 shadow-sm relative z-10 group-hover/focus:scale-105 transition-transform duration-500">
            <Icon name="target" size={18} className="text-amber-500" />
          </div>
          <div className="relative z-10 min-w-0">
            <div className="text-[9px] font-black text-amber-600/60 tracking-widest uppercase mb-1">Primary Target</div>
            <div className="text-[14px] font-bold text-dt-text tracking-tight truncate">{weakest.name} Mastery</div>
            <div className="text-[11px] font-medium text-dt-textSecondary mt-1 leading-relaxed opacity-80">
              Optimize your algorithmic baseline by solving 3 high-impact problems.
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

TopicProgress.displayName = 'TopicProgress';
