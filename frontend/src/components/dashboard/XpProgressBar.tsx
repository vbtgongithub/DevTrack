// ============================================================================
// XpProgressBar.tsx — Full-Width XP Progress Hero Component
// ============================================================================
// Displays level, XP progress, and floating XP gain animations.
// Full-width bar positioned prominently in dashboard hierarchy.
// Shows near level-up glow effect when >80% progress.
// ============================================================================

import React, { useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { useXp } from '../../hooks/useXp';
import { useGamificationStore, getLevelInfo } from '../../store/gamificationStore';
import { Zap, Star } from 'lucide-react';

// ---------------------------------------------------------------------------
// XP Gain Float Animation
// ---------------------------------------------------------------------------

const XpGainFloat: React.FC<{ gain: number; reason?: string }> = ({ gain, reason }) => (
  <motion.div
    initial={{ opacity: 0, y: 0, scale: 0.8 }}
    animate={{
      opacity: [0, 1, 1, 0],
      y: [0, -20, -40, -60],
      scale: [0.8, 1.15, 1.05, 0.9],
    }}
    transition={{ duration: 2.0, ease: 'easeOut' }}
    className="absolute -top-8 right-8 pointer-events-none z-20 flex flex-col items-end"
  >
    <motion.span 
      className="text-3xl font-black text-amber-500 drop-shadow-[0_4px_20px_rgba(245,158,11,0.8)] tabular-nums"
      animate={{
        textShadow: [
          '0 4px 20px rgba(245,158,11,0.8)',
          '0 6px 30px rgba(245,158,11,1)',
          '0 4px 20px rgba(245,158,11,0.8)',
        ],
      }}
      transition={{ duration: 0.6, repeat: 2 }}
    >
      +{gain} XP
    </motion.span>
    {reason && (
      <motion.span
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="text-sm font-extrabold text-amber-600 mt-1.5 drop-shadow-md px-3 py-1 bg-amber-50/95 rounded-lg border border-amber-200/60 shadow-sm"
      >
        {reason}
      </motion.span>
    )}
  </motion.div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const XpProgressBar: React.FC = () => {
  const xpData = useXp();
  const liveXp = useGamificationStore((s) => s.liveXp);
  const pendingXpGain = useGamificationStore((s) => s.pendingXpGain);
  const pendingXpReason = useGamificationStore((s) => s.pendingXpReason);

  // Use live XP from SSE if available, otherwise fall back to server data
  const displayXp = liveXp ?? xpData.totalXp;
  const level = xpData.currentLevel;
  const levelInfo = getLevelInfo(level);
  const progressPercent = xpData.progressPercent;
  const xpInCurrent = xpData.xpInCurrentLevel;
  const xpToNext = xpData.xpToNextLevel;
  const isNearLevelUp = progressPercent > 80;

  // Animated progress bar value using spring
  const springProgress = useSpring(0, {
    stiffness: 200,
    damping: 40,
  });

  useEffect(() => {
    springProgress.set(progressPercent);
  }, [progressPercent, springProgress]);

  const progressWidth = useTransform(springProgress, (v) => `${Math.min(100, v)}%`);

  // Null state handling - show skeleton if no data
  if (!xpData || xpData.totalXp === null || xpData.totalXp === undefined) {
    return (
      <div className="w-full bg-white/50 rounded-[28px] border border-gray-200 shadow-dt-floating p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-dt-primary/5 animate-pulse" />
            <div className="space-y-2">
              <div className="w-20 h-2 bg-dt-primary/5 animate-pulse rounded" />
              <div className="w-32 h-5 bg-dt-primary/5 animate-pulse rounded" />
              <div className="w-24 h-3 bg-dt-primary/5 animate-pulse rounded" />
            </div>
          </div>
          <div className="space-y-2 flex flex-col items-end">
            <div className="w-12 h-6 bg-dt-primary/5 animate-pulse rounded" />
            <div className="w-16 h-2 bg-dt-primary/5 animate-pulse rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="w-24 h-3 bg-dt-primary/5 animate-pulse rounded" />
            <div className="w-28 h-3 bg-dt-primary/5 animate-pulse rounded" />
          </div>
          <div className="h-4 w-full bg-dt-primary/5 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full bg-white rounded-[28px] border border-gray-300 shadow-dt-floating hover:shadow-dt-card-hover hover:border-dt-primary/30 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden p-6"
      style={{ animation: 'dtFadeIn 800ms cubic-bezier(0.16,1,0.3,1) 100ms both' }}
    >
      {/* Atmospheric glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,92,252,0.04),transparent_40%)]" />

      {/* Near level-up glow */}
      {isNearLevelUp && (
        <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(124,92,252,0.08),transparent_50%)]" />
      )}

      {/* Floating XP gain */}
      <AnimatePresence>
        {pendingXpGain !== null && pendingXpGain > 0 && (
          <XpGainFloat
            key={`${pendingXpGain}-${pendingXpReason || ''}`}
            gain={pendingXpGain}
            reason={pendingXpReason ?? undefined}
          />
        )}
      </AnimatePresence>

      {/* Header: Level badge + name */}
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Level badge */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 relative overflow-hidden shadow-lg border border-white/20"
            style={{
              background: `linear-gradient(135deg, ${levelInfo.color}CC, ${levelInfo.color}88)`,
              boxShadow: `0 8px 32px ${levelInfo.color}40`,
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_50%)]" />
            <span className="text-3xl font-black text-white relative z-10 tabular-nums drop-shadow-md">
              {level}
            </span>
          </div>

          {/* Level name */}
          <div>
            <div className="text-[10px] text-dt-textMuted font-black uppercase tracking-[0.2em]">
              Level {level}
            </div>
            <div className="text-2xl font-black text-dt-text tracking-tighter leading-tight">
              {levelInfo.name}
            </div>
            <div className="text-sm text-dt-textSecondary/70 font-semibold tracking-tight mt-0.5">
              {levelInfo.title}
            </div>
          </div>
        </div>

        {/* XP total */}
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-amber-500" />
          <div className="text-right">
            <div className="text-3xl font-black text-dt-text tabular-nums tracking-tighter leading-none">
              {displayXp.toLocaleString()}
            </div>
            <div className="text-xs text-dt-textSecondary/60 font-bold uppercase tracking-wider mt-0.5">
              Total XP
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold text-dt-textSecondary/70">
            {xpInCurrent.toLocaleString()} / {xpToNext.toLocaleString()} XP
          </div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-dt-textSecondary/70">
            <Star size={14} className="text-amber-500" />
            <span>{Math.round(progressPercent)}% to Level {level + 1}</span>
          </div>
        </div>

        {/* Progress track */}
        <div className="h-4 w-full bg-dt-primary/5 rounded-full overflow-hidden relative">
          {/* Shimmer overlay for "alive" feel */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
              animation: 'shimmer 2s infinite linear',
              backgroundSize: '200% 100%',
            }}
          />
          {/* Animated fill */}
          <motion.div
            className="h-full rounded-full relative"
            style={{
              width: progressWidth,
              background: `linear-gradient(90deg, ${levelInfo.color}CC, ${levelInfo.color})`,
              boxShadow: isNearLevelUp ? `0 0 16px ${levelInfo.color}60` : 'none',
            }}
          >
            {/* Glow pulse at end when near level-up */}
            {isNearLevelUp && (
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full animate-ping"
                style={{ backgroundColor: levelInfo.color, opacity: 0.6 }}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default XpProgressBar;
