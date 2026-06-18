// ============================================================================
// RetentionBanner.tsx — Adaptive Retention Banner
// ============================================================================
// Context-aware dashboard banner showing:
// - Streak pressure urgency
// - Recovery missions
// - Comeback welcome rewards
// - Near-milestone encouragement
// - Motivational messages
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import {
  Flame, Trophy, Zap, Target,
  Clock, Gift, TrendingUp,
  X,
} from 'lucide-react';
import { useRetentionContext } from '../../hooks/useRetentionContext';
import { trackRetentionBannerView, trackRetentionBannerDismiss } from '../../lib/telemetry/analytics';

const RetentionBanner: React.FC = () => {
  const {
    streakPressure,
    recoveryMission,
    comebackReward,
    milestoneAnticipation,
    nearLevelUp,
    motivationalMessage,
    loading,
  } = useRetentionContext();

  const [dismissed, setDismissed] = React.useState(false);

  const bannerType = React.useMemo(() => {
    if (comebackReward?.eligible) return 'comeback';
    if (recoveryMission) return 'recovery';
    if (streakPressure && streakPressure.level !== 'none') return 'streak';
    if (milestoneAnticipation?.[0]?.urgency === 'high') return 'milestone';
    if (nearLevelUp) return 'level_up';
    if (motivationalMessage) return 'motivation';
    return null;
  }, [comebackReward, recoveryMission, streakPressure, milestoneAnticipation, nearLevelUp, motivationalMessage]);

  React.useEffect(() => {
    if (!loading && bannerType && !dismissed) {
      trackRetentionBannerView(bannerType, '');
    }
  }, [loading, bannerType, dismissed]);

  const handleDismiss = () => {
    if (bannerType) trackRetentionBannerDismiss(bannerType);
    setDismissed(true);
  };

  if (loading || dismissed) return null;

  // Priority rendering: comeback > recovery > streak > milestone > motivation
  if (comebackReward?.eligible) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }}
        className="relative rounded-[24px] overflow-hidden border border-amber-200/50 bg-gradient-to-r from-amber-50 via-orange-50/30 to-yellow-50/50 p-4 shadow-[0_8px_30px_rgba(245,158,11,0.08)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.06),transparent_50%)] pointer-events-none" />
        <button onClick={handleDismiss} className="absolute top-3 right-3 p-1 rounded-full text-amber-400 hover:text-amber-600 hover:bg-amber-100 transition-colors z-10">
          <X size={14} />
        </button>
        <div className="relative flex items-center gap-4 z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Gift size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="text-[14px] font-black text-amber-900 tracking-tight">Welcome Back!</h4>
              <span className="text-lg">{comebackReward.eligible ? '🎉' : ''}</span>
            </div>
            <p className="text-[12px] font-semibold text-amber-700/80 leading-relaxed">
              {comebackReward.message}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
            <Zap size={14} className="text-amber-500" />
            <span className="text-[12px] font-black text-amber-700">+{comebackReward.bonusXp} XP</span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (recoveryMission) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative rounded-[24px] overflow-hidden border border-violet-200/50 bg-gradient-to-r from-violet-50 via-purple-50/30 to-indigo-50/50 p-4 shadow-[0_8px_30px_rgba(124,92,252,0.08)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,252,0.06),transparent_50%)] pointer-events-none" />
        <button onClick={handleDismiss} className="absolute top-3 right-3 p-1 rounded-full text-violet-400 hover:text-violet-600 hover:bg-violet-100 transition-colors z-10">
          <X size={14} />
        </button>
        <div className="relative flex items-center gap-4 z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
            <Target size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[9px] font-black text-violet-600 uppercase tracking-widest">Recovery Mission</span>
            </div>
            <h4 className="text-[14px] font-black text-violet-900 tracking-tight">{recoveryMission.title}</h4>
            <p className="text-[12px] font-semibold text-violet-700/70 leading-relaxed">{recoveryMission.description}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Zap size={14} className="text-violet-500" />
              <span className="text-[12px] font-black text-violet-700">+{recoveryMission.reward} XP</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-violet-400">
              <Clock size={10} />
              <span>{recoveryMission.expiresInHours}h remaining</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (streakPressure && streakPressure.level !== 'none') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-[20px] overflow-hidden border border-slate-200/60 bg-white p-4 shadow-sm"
      >
        <button onClick={handleDismiss} className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors z-10">
          <X size={14} />
        </button>
        <div className="relative flex items-center gap-4 z-10">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
            <Flame size={18} className={streakPressure.level === 'critical' ? 'text-red-500' : 'text-indigo-500'} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-bold text-slate-800 tracking-tight">
              Maintain Operational Momentum
            </h4>
            <p className="text-[12px] text-slate-500 font-medium">
              {streakPressure.message}
            </p>
          </div>
          {streakPressure.level === 'critical' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 border border-red-100 shrink-0">
              <Clock size={12} className="text-red-500" />
              <span className="text-[11px] font-bold text-red-600">{streakPressure.hoursRemaining}h action window</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Milestone anticipation
  const topMilestone = milestoneAnticipation?.[0];
  if (topMilestone && topMilestone.urgency === 'high') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative rounded-[24px] overflow-hidden border border-emerald-200/50 bg-gradient-to-r from-emerald-50 via-teal-50/30 to-green-50/50 p-4 shadow-[0_8px_30px_rgba(16,185,129,0.06)]"
      >
        <button onClick={handleDismiss} className="absolute top-3 right-3 p-1 rounded-full text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100 transition-colors z-10">
          <X size={14} />
        </button>
        <div className="relative flex items-center gap-4 z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Trophy size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[14px] font-black text-emerald-900 tracking-tight">{topMilestone.message}</h4>
            <div className="mt-2 w-full bg-emerald-200/50 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${topMilestone.progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
              />
            </div>
            <p className="text-[10px] font-bold text-emerald-500 mt-1">{topMilestone.current}/{topMilestone.target}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Near level up
  if (nearLevelUp) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative rounded-[24px] overflow-hidden border border-indigo-200/50 bg-gradient-to-r from-indigo-50 via-violet-50/30 to-purple-50/50 p-4 shadow-[0_8px_30px_rgba(99,102,241,0.06)]"
      >
        <button onClick={handleDismiss} className="absolute top-3 right-3 p-1 rounded-full text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors z-10">
          <X size={14} />
        </button>
        <div className="relative flex items-center gap-4 z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <TrendingUp size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[14px] font-black text-indigo-900 tracking-tight">{nearLevelUp.message}</h4>
            <div className="mt-2 w-full bg-indigo-200/50 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${nearLevelUp.progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-indigo-400 to-violet-500 rounded-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0">
            <Zap size={14} className="text-indigo-500" />
            <span className="text-[12px] font-black text-indigo-700">{nearLevelUp.xpToNextLevel} XP to go</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default motivational message
  if (motivationalMessage) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-[20px] overflow-hidden border border-slate-200/50 bg-gradient-to-r from-slate-50 to-white p-3.5 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl shrink-0">{motivationalMessage.emoji}</span>
          <div className="min-w-0">
            <p className="text-[13px] font-black text-slate-800 tracking-tight">{motivationalMessage.text}</p>
            {motivationalMessage.subtext && (
              <p className="text-[11px] font-semibold text-slate-400">{motivationalMessage.subtext}</p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};

export { RetentionBanner };
export default RetentionBanner;
