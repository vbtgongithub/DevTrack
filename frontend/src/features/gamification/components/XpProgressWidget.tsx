// ============================================================================
// XpProgressWidget.tsx — Live XP Progress + Level Display
// ============================================================================
// The critical missing gamification piece. Shows current level, XP progress
// bar with spring animation, level name, and floating XP gain animation.
// Connected to useXp() for server data and gamificationStore for live SSE data.
// ============================================================================

import React, { useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { useXp } from '../../../hooks/useXp';
import { useGamificationStore, getLevelInfo } from '../../../store/gamificationStore';
import { Zap, TrendingUp, Star } from 'lucide-react';

// ---------------------------------------------------------------------------
// XP Gain Float Animation with Reason
// ---------------------------------------------------------------------------

interface XpGainFloatProps {
  gain: number;
  reason?: string;
}

const XpGainFloat: React.FC<XpGainFloatProps> = ({ gain, reason }) => (
  <motion.div
    initial={{ opacity: 0, y: 0, scale: 0.8 }}
    animate={{
      opacity: [0, 1, 1, 0],
      y: [0, -20, -40, -60],
      scale: [0.8, 1.15, 1.05, 0.9],
    }}
    transition={{ duration: 2.0, ease: 'easeOut' }}
    className="absolute -top-2 right-4 pointer-events-none z-20 flex flex-col items-end"
  >
    <motion.span 
      className="text-xl font-black text-amber-500 drop-shadow-[0_2px_16px_rgba(245,158,11,0.7)] tabular-nums"
      animate={{
        textShadow: [
          '0 2px 16px rgba(245,158,11,0.7)',
          '0 4px 24px rgba(245,158,11,0.9)',
          '0 2px 16px rgba(245,158,11,0.7)',
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
        className="text-sm font-extrabold text-amber-600 mt-1 drop-shadow-md px-2 py-0.5 bg-amber-50/90 rounded-md border border-amber-200/50"
      >
        {reason}
      </motion.span>
    )}
  </motion.div>
);

// ---------------------------------------------------------------------------
// Level Badge (circular)
// ---------------------------------------------------------------------------

const LevelBadge: React.FC<{ level: number; color: string }> = ({ level, color }) => (
  <div
    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative overflow-hidden shadow-lg border border-white/20"
    style={{
      background: `linear-gradient(135deg, ${color}CC, ${color}88)`,
      boxShadow: `0 8px 32px ${color}40`,
    }}
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_50%)]" />
    <span className="text-2xl font-black text-white relative z-10 tabular-nums drop-shadow-md">
      {level}
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// Main Widget
// ---------------------------------------------------------------------------

export const XpProgressWidget: React.FC = () => {
  const xpData = useXp();
  const liveXp = useGamificationStore((s) => s.liveXp);
  const pendingXpGain = useGamificationStore((s) => s.pendingXpGain);
  const pendingXpReason = useGamificationStore((s) => s.pendingXpReason);
  const [displayedXp, setDisplayedXp] = React.useState(xpData.totalXp);

  // Use live XP from SSE if available, otherwise fall back to server data
  const targetXp = liveXp ?? xpData.totalXp;
  const level = xpData.currentLevel;
  const levelInfo = getLevelInfo(level);
  const progressPercent = xpData.progressPercent;
  const xpInCurrent = xpData.xpInCurrentLevel;
  const xpToNext = xpData.xpToNextLevel;
  const isNearLevelUp = progressPercent > 80;

  // Animated XP number interpolation
  useEffect(() => {
    if (targetXp === displayedXp) return;
    
    const diff = targetXp - displayedXp;
    const duration = 1000; // 1 second
    const steps = 30;
    const increment = diff / steps;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayedXp(targetXp);
        clearInterval(interval);
      } else {
        setDisplayedXp(prev => Math.round(prev + increment));
      }
    }, stepDuration);
    
    return () => clearInterval(interval);
  }, [targetXp, displayedXp]);

  // Animated progress bar value using spring
  const springProgress = useSpring(0, {
    stiffness: 200,
    damping: 40,
  });

  useEffect(() => {
    springProgress.set(progressPercent);
  }, [progressPercent, springProgress]);

  const progressWidth = useTransform(springProgress, (v) => `${Math.min(100, v)}%`);

  // Glow pulse state
  const [isGlowing, setIsGlowing] = React.useState(false);

  useEffect(() => {
    if (pendingXpGain && pendingXpGain > 0) {
      setIsGlowing(true);
      const timeout = setTimeout(() => setIsGlowing(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [pendingXpGain]);

  return (
    <div
      className="md:col-span-1 dt-card p-4 flex flex-col justify-between bg-white rounded-[28px] border border-gray-300 shadow-dt-floating hover:shadow-dt-card-hover hover:border-dt-primary/30 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden group"
      style={{ animation: 'dtFadeIn 800ms cubic-bezier(0.16,1,0.3,1) 50ms both' }}
    >
      {/* Atmospheric glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,252,0.04),transparent_40%)]" />

      {/* Near level-up glow */}
      {isNearLevelUp && (
        <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(124,92,252,0.06),transparent_50%)]" />
      )}

      {/* Floating XP gain */}
      <AnimatePresence>
        {pendingXpGain !== null && pendingXpGain > 0 && (
          <XpGainFloat key="xp-float" gain={pendingXpGain} reason={pendingXpReason ?? undefined} />
        )}
      </AnimatePresence>

      {/* Header row */}
      <div className="relative flex items-center gap-3">
        <LevelBadge level={level} color={levelInfo.color} />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-dt-textMuted font-black uppercase tracking-[0.2em]">
            Progression
          </div>
          <div className="text-lg font-black text-dt-text tracking-tighter leading-tight">
            {levelInfo.name}
          </div>
          <div className="text-[11px] text-dt-textSecondary/70 font-semibold tracking-tight mt-0.5">
            {levelInfo.title}
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="relative mt-3">
        <div className="flex items-end justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-amber-500" />
            <span className="text-2xl font-black text-dt-text tabular-nums tracking-tighter leading-none">
              {displayedXp.toLocaleString()}
            </span>
            <span className="text-xs text-dt-textSecondary/50 font-bold ml-0.5">XP</span>
          </div>
          <div className="text-[10px] font-bold text-dt-textSecondary/60 tabular-nums">
            {xpInCurrent}/{xpToNext} to Level {level + 1}
          </div>
        </div>

        {/* Progress track */}
        <div
          className="h-2.5 w-full bg-dt-primary/5 rounded-full overflow-hidden relative transition-all duration-300"
          style={{
            boxShadow: isGlowing ? `0 0 10px 2px ${levelInfo.color}40` : 'none',
          }}
        >
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
              boxShadow: isNearLevelUp || isGlowing ? `0 0 12px ${levelInfo.color}80` : 'none',
            }}
          >
            {/* Glow pulse at end when near level-up */}
            {isNearLevelUp && (
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full animate-ping"
                style={{ backgroundColor: levelInfo.color, opacity: 0.6 }}
              />
            )}
          </motion.div>
        </div>

        {/* Quick stats row */}
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-1 text-[10px] font-bold text-dt-textSecondary/50">
            <TrendingUp size={11} />
            <span>Level {level}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-dt-textSecondary/50">
            <Star size={11} />
            <span>{Math.round(progressPercent)}% to next</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XpProgressWidget;
