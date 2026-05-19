import { motion } from 'framer-motion';
import { Flame, Trophy, Calendar, Target, ChevronDown, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Card } from '../../components/ui';
import { useRuntimeState, type RuntimeState } from '../../hooks/useRuntimeState';
import { useUserStore } from '../../store/userStore';
import { staggerContainer, staggerItem, smooth } from '../../design-system/motion';
import { copy } from '../../lib/copy';
import { cn } from '../../lib/design-system/tokens.css';

interface ProgressExperienceProps {
  identitySection?: React.ReactNode;
}

export function ProgressExperience({ identitySection }: ProgressExperienceProps) {
  const user = useUserStore((s) => s.user);
  const { data: runtimeState, loading } = useRuntimeState();
  const [identityOpen, setIdentityOpen] = useState(false);

  const streak = runtimeState?.streak ?? 0;
  const longest = runtimeState?.longestStreak ?? streak;
  const goals = runtimeState?.activeGoals ?? [];
  const milestones = runtimeState?.recentMilestones ?? [];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-10 pb-24"
    >
      {/* Premium header - emotionally intelligent, identity-focused */}
      <motion.div variants={staggerItem} className="text-center sm:text-left">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={smooth}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-400 tracking-wide">Your Journey</span>
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-semibold text-[#0F172A] tracking-tight mb-3">
          {user?.displayName ? `${user.displayName}'s rhythm` : copy.progress.title}
        </h1>
        <p className="text-base text-zinc-500 max-w-2xl leading-relaxed">{copy.progress.subtitle}</p>
      </motion.div>

      {/* Calm metrics - reduced density, focused on meaning */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Metric label="Current streak" value={`${streak} days`} icon={<Flame className="w-4 h-4 text-orange-400" />} />
        <Metric label="Best streak" value={`${longest} days`} icon={<Calendar className="w-4 h-4 text-zinc-400" />} />
        <Metric
          label="Active days"
          value={String(runtimeState?.daysActive ?? '—')}
          icon={<Target className="w-4 h-4 text-emerald-400" />}
          className="col-span-2 sm:col-span-1"
        />
      </motion.div>

      {/* Consistency visualization - calm, reflective */}
      <motion.section variants={staggerItem}>
        <SectionTitle icon={<Calendar size={16} />} title="Consistency" />
        <StreakHistory current={streak} />
      </motion.section>

      {/* Goals & challenges - simplified, focused */}
      <motion.section variants={staggerItem}>
        <SectionTitle icon={<Target size={16} />} title="Goals & challenges" />
        <GoalsList goals={goals} loading={loading} />
      </motion.section>

      {/* Milestones timeline - emotionally meaningful */}
      <motion.section variants={staggerItem}>
        <SectionTitle icon={<Trophy size={16} />} title="Milestones" />
        <MilestonesTimeline milestones={milestones} loading={loading} />
      </motion.section>

      {identitySection && (
        <motion.section variants={staggerItem}>
          <button
            type="button"
            onClick={() => setIdentityOpen((o) => !o)}
            className="w-full flex items-center justify-between py-3 text-sm font-medium text-zinc-400 hover:text-zinc-200 border-t border-zinc-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded-lg"
            aria-expanded={identityOpen}
          >
            <span>Profile & platform settings</span>
            <ChevronDown
              size={18}
              className={cn('transition-transform', identityOpen && 'rotate-180')}
            />
          </button>
          {identityOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-4 space-y-6"
            >
              {identitySection}
            </motion.div>
          )}
        </motion.section>
      )}
    </motion.div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="flex items-center gap-2.5 text-sm font-medium text-[#0F172A] mb-5">
      <span className="text-zinc-500">{icon}</span>
      <span className="tracking-wide">{title}</span>
    </h2>
  );
}

function Metric({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('p-5 border-zinc-200 bg-white hover:bg-zinc-50 transition-colors duration-200', className)}>
      <div className="flex items-center gap-2 text-zinc-500 mb-3">{icon}</div>
      <p className="text-xl font-semibold text-[#0F172A] tracking-tight">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1.5 font-medium">{label}</p>
    </Card>
  );
}

function StreakHistory({
  current,
}: {
  current: number;
}) {
  const filled = Math.min(14, current);

  return (
    <Card className="p-5 border-zinc-200 bg-white">
      <motion.div layout className="flex gap-1.5 mb-4">
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03, duration: 0.3 }}
            className={cn(
              'h-7 flex-1 rounded-sm max-w-9 transition-all duration-300',
              i < filled ? 'bg-[#12B76A]/20 border border-[#12B76A]/30' : 'bg-zinc-100'
            )}
            title={`Day ${i + 1}`}
          />
        ))}
      </motion.div>
      <p className="text-sm text-zinc-500 leading-relaxed">
        {current > 0
          ? copy.progress.consistency
          : 'Each day you practice adds to your story.'}
      </p>
    </Card>
  );
}

function GoalsList({ goals, loading }: { goals: RuntimeState['activeGoals']; loading: boolean }) {
  if (loading) {
    return <div className="h-24 rounded-xl bg-zinc-100 animate-pulse" />;
  }
  if (goals.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-8 text-center border border-dashed border-zinc-200 rounded-xl bg-white">
        {copy.dashboard.emptyGoals}
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {goals.slice(0, 5).map((g, i) => (
        <motion.li
          key={g.goalId}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="flex items-center justify-between gap-3 p-3.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors duration-200 text-sm shadow-sm"
        >
          <span className="text-[#0F172A] truncate font-medium">Goal {g.goalId}</span>
          <span
            className={cn(
              'text-xs shrink-0 font-medium',
              g.progress >= g.target ? 'text-emerald-400' : 'text-zinc-500'
            )}
          >
            {g.progress >= g.target ? 'Complete' : `${g.progress}/${g.target}`}
          </span>
        </motion.li>
      ))}
    </ul>
  );
}

function MilestonesTimeline({ milestones, loading }: { milestones: RuntimeState['recentMilestones']; loading: boolean }) {
  if (loading) {
    return <div className="h-32 rounded-xl bg-zinc-100 animate-pulse" />;
  }
  if (milestones.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-8 text-center border border-dashed border-zinc-200 rounded-xl bg-white">
        {copy.progress.timelineEmpty}
      </p>
    );
  }

  return (
    <ol className="relative border-l border-zinc-200 ml-2 space-y-5 pl-6">
      {milestones.slice(0, 6).map((item, i) => (
        <motion.li 
          key={`${item.type}-${item.occurredAt}`} 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3 }}
          className="relative"
        >
          <span className="absolute -left-[1.45rem] top-2 w-2.5 h-2.5 rounded-full bg-[#12B76A]/80 ring-4 ring-white" />
          <p className="text-sm text-[#0F172A] font-medium">{item.label}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {new Date(item.occurredAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </motion.li>
      ))}
    </ol>
  );
}
