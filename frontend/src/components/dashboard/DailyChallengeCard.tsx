// ============================================================================
// DailyChallengeCard.tsx — Daily Challenge Hero Card
// ============================================================================
// Prominent card showing today's challenge with countdown, social proof,
// and clear CTA. States: Active, Completed, Expired.
// Features: Dynamic color coding, pulsing urgent rings, emerald particle floaters.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Clock, Users, ExternalLink, CheckCircle2, Zap } from 'lucide-react';
import { prefersReducedMotion } from '../../design-system/motion';

interface DailyChallengeCardProps {
  challenge?: {
    _id?: string;
    date: string; // "YYYY-MM-DD"
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    platform: 'leetcode' | 'codeforces' | 'codechef';
    problemUrl: string;
    xpReward: number;
    completionCount: number;
    userCompleted: boolean;
  } | null;
}

const DIFFICULTY_CONFIG = {
  easy: { color: '#10B981', label: 'Easy', bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-600 font-black', borderColor: 'border-emerald-500/20' },
  medium: { color: '#F59E0B', label: 'Medium', bgColor: 'bg-amber-500/10', textColor: 'text-amber-600 font-black', borderColor: 'border-amber-500/20' },
  hard: { color: '#EF4444', label: 'Hard', bgColor: 'bg-rose-500/10', textColor: 'text-rose-600 font-black', borderColor: 'border-rose-500/20' },
};

const PLATFORM_CONFIG = {
  leetcode: { name: 'LeetCode', icon: '💻', color: '#FFA116' },
  codeforces: { name: 'Codeforces', icon: '🏆', color: '#1F8ACB' },
  codechef: { name: 'CodeChef', icon: '👨‍🍳', color: '#5B4638' },
};

// ---------------------------------------------------------------------------
// Emerald Completed Particles Overlay
// ---------------------------------------------------------------------------

const EmeraldParticles: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  if (reducedMotion) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 10 }).map((_, i) => {
        const size = Math.random() * 4 + 3;
        const left = `${Math.random() * 100}%`;
        const top = `${Math.random() * 100}%`;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-emerald-400 opacity-40 filter blur-[0.5px]"
            style={{
              width: size,
              height: size,
              left,
              top,
            }}
            animate={{
              y: [0, -25, 0],
              x: [0, Math.random() * 12 - 6, 0],
              opacity: [0.1, 0.5, 0.1],
            }}
            transition={{
              duration: Math.random() * 3 + 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random() * 2,
            }}
          />
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Countdown Timer Hook (Resets at midnight local time)
// ---------------------------------------------------------------------------

function useCountdown(dateStr?: string) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isUrgent: boolean; // <4h
    isCritical: boolean; // <1h
    isExpired: boolean;
  }>({
    hours: 24,
    minutes: 0,
    seconds: 0,
    isUrgent: false,
    isCritical: false,
    isExpired: false,
  });

  useEffect(() => {
    if (!dateStr) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      
      // Parse today's local midnight
      const [year, month, day] = dateStr.split('-').map(Number);
      const expiry = new Date(year, month - 1, day, 23, 59, 59, 999);
      
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, isUrgent: false, isCritical: false, isExpired: true };
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const isUrgent = hours < 4;
      const isCritical = hours < 1;

      return { hours, minutes, seconds, isUrgent, isCritical, isExpired: false };
    };

    // Initialize
    setTimeLeft(calculateTimeLeft());

    // Update every second for live high-precision countdown
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [dateStr]);

  return timeLeft;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const DailyChallengeCard: React.FC<DailyChallengeCardProps> = ({ challenge }) => {
  const timeLeft = useCountdown(challenge?.date);

  // Reduced motion detection
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // No challenge available
  if (!challenge) {
    return (
      <div
        className="w-full bg-white/40 backdrop-blur-3xl rounded-[28px] border border-gray-300 shadow-[0_8px_40px_rgba(124,92,252,0.06)] p-6 relative overflow-hidden"
        style={{ animation: 'dtFadeIn 800ms cubic-bezier(0.16,1,0.3,1) 150ms both' }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,252,0.03),transparent_40%)]" />
        
        <div className="relative flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-dt-primary/10 flex items-center justify-center mb-4 border border-dt-primary/5 shadow-sm">
            <Target size={32} className="text-dt-primary/60" />
          </div>
          <h3 className="text-lg font-black text-dt-text mb-2">No Challenge Seeded</h3>
          <p className="text-sm text-dt-textSecondary/70 font-bold">
            Please check back in a moment or sync your account
          </p>
        </div>
      </div>
    );
  }

  const difficultyConfig = DIFFICULTY_CONFIG[challenge.difficulty] || DIFFICULTY_CONFIG.easy;
  const platformConfig = PLATFORM_CONFIG[challenge.platform] || PLATFORM_CONFIG.leetcode;
  const isCompleted = challenge.userCompleted;
  const isExpired = !isCompleted && (timeLeft ? timeLeft.isExpired : false);

  // Dynamic countdown visual styling based on remaining time
  const countdownStyle = (() => {
    if (!timeLeft || isExpired || isCompleted) return { text: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' };
    if (timeLeft.isCritical) return { text: 'text-rose-600 font-extrabold animate-pulse', bg: 'bg-rose-500/15 border-rose-500/35 ring-2 ring-rose-500/20' };
    if (timeLeft.isUrgent) return { text: 'text-rose-500 font-black', bg: 'bg-rose-500/10 border-rose-500/25' };
    if (timeLeft.hours < 12) return { text: 'text-amber-500 font-bold', bg: 'bg-amber-500/10 border-amber-500/25' };
    return { text: 'text-emerald-500 font-bold', bg: 'bg-emerald-500/10 border-emerald-500/25' };
  })();

  return (
    <div
      className={[
        'w-full rounded-[28px] border transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] p-6 relative overflow-hidden group',
        isCompleted 
          ? 'bg-gradient-to-br from-emerald-500/[0.03] via-white/70 to-emerald-500/[0.01] border-emerald-500/35 shadow-[0_20px_50px_rgba(16,185,129,0.12),0_0_0_1px_rgba(16,185,129,0.05)]' 
          : isExpired 
            ? 'bg-slate-50/50 border-slate-200 opacity-75' 
            : 'bg-white/50 border-gray-300 shadow-[0_8px_40px_rgba(124,92,252,0.04)] hover:shadow-[0_20px_60px_rgba(124,92,252,0.1)] hover:border-dt-primary/30',
        timeLeft?.isCritical && !isCompleted && !isExpired && 'shadow-[0_0_35px_rgba(239,68,68,0.25)] border-rose-500/40 ring-2 ring-rose-500/10'
      ].join(' ')}
      style={{ animation: 'dtFadeIn 800ms cubic-bezier(0.16,1,0.3,1) 150ms both' }}
    >
      {/* Floating Emerald particles when completed */}
      {isCompleted && <EmeraldParticles reducedMotion={reducedMotion} />}

      {/* Premium background atmospheric glow */}
      <div className={[
        'absolute inset-0 pointer-events-none transition-opacity duration-1000',
        isCompleted 
          ? 'bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.06),transparent_50%)]' 
          : isExpired 
            ? 'opacity-0' 
            : 'bg-[radial-gradient(circle_at_top_right,rgba(124,92,252,0.06),transparent_50%)]'
      ].join(' ')} />

      {/* Header Row */}
      <div className="relative flex items-start justify-between mb-5 z-10">
        <div className="flex items-center gap-3.5">
          <div className={[
            'w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105 border',
            isCompleted 
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-500/20 shadow-emerald-500/10' 
              : 'bg-dt-primary/10 border-dt-primary/10 text-dt-primary'
          ].join(' ')}>
            {isCompleted ? (
              <CheckCircle2 size={24} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
            ) : (
              <Target size={24} className="animate-pulse" />
            )}
          </div>
          <div>
            <div className="text-[10px] text-dt-textMuted font-black uppercase tracking-[0.25em] flex items-center gap-2">
              <span>Daily Challenge</span>
              <span className="opacity-90">{platformConfig.icon}</span>
            </div>
            <div className="text-lg font-black text-dt-text tracking-tight leading-tight mt-0.5">
              {platformConfig.name}
            </div>
          </div>
        </div>

        {/* Difficulty badge */}
        <div className={[
          'px-3.5 py-1.5 rounded-full border text-xs tracking-wider font-extrabold uppercase shadow-sm',
          difficultyConfig.bgColor,
          difficultyConfig.textColor,
          difficultyConfig.borderColor,
        ].join(' ')}>
          {difficultyConfig.label}
        </div>
      </div>

      {/* Challenge Title & Info */}
      <div className="relative mb-5 z-10">
        <h3 className="text-2xl font-black text-dt-text tracking-tight leading-tight mb-3">
          {challenge.title}
        </h3>
        
        {/* XP reward display */}
        <div className="flex items-center gap-2">
          <div className={[
            'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full shadow-sm border font-black text-sm transition-all duration-300',
            isCompleted 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' 
              : 'bg-amber-500/10 border-amber-500/20 text-amber-700'
          ].join(' ')}>
            <Zap size={14} className={isCompleted ? 'text-emerald-500' : 'text-amber-500'} />
            <span>
              +{challenge.xpReward} XP Reward
            </span>
          </div>
        </div>
      </div>

      {/* Progress & Countdown Summary */}
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-5 border-b border-gray-200/80 z-10">
        {/* Social Proof */}
        <div className="flex items-center gap-2 text-sm text-dt-textSecondary/80 font-semibold">
          <Users size={16} className="text-dt-primary/60" />
          <span>
            <span className="font-extrabold text-dt-text">
              {isCompleted ? (challenge.completionCount || 0).toLocaleString() : (challenge.completionCount || 0).toLocaleString()}
            </span>{' '}
            developers completed today
          </span>
        </div>

        {/* Countdown Timer with interactive colors & ring pulsations */}
        {!isCompleted && !isExpired && timeLeft && (
          <div className={[
            'flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm',
            countdownStyle.bg,
            countdownStyle.text
          ].join(' ')}>
            <Clock size={15} />
            <span className="text-sm font-black tabular-nums">
              {timeLeft.isCritical 
                ? `${timeLeft.minutes}m ${timeLeft.seconds}s remaining!` 
                : `${timeLeft.hours}h ${timeLeft.minutes}m remaining`}
            </span>
          </div>
        )}

        {isCompleted && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-extrabold text-sm shadow-sm">
            <CheckCircle2 size={15} />
            <span>Success Claimed</span>
          </div>
        )}

        {isExpired && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-bold text-sm shadow-sm">
            <Clock size={15} />
            <span>Expired</span>
          </div>
        )}
      </div>

      {/* Quick Action Trigger */}
      <div className="relative z-10">
        {isCompleted ? (
          <div className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/20 border border-emerald-400/20">
            <CheckCircle2 size={18} />
            <span>Completed — +{challenge.xpReward} XP Added to Profile!</span>
          </div>
        ) : isExpired ? (
          <div className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-slate-200 text-slate-500 font-bold text-sm border border-slate-300/40">
            <Clock size={18} />
            <span>Expired — A new daily challenge will seed tomorrow</span>
          </div>
        ) : (
          <motion.a
            href={challenge.problemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#A78BFA] text-white font-extrabold text-sm shadow-[0_4px_20px_rgba(124,92,252,0.3)] transition-all duration-200 hover:shadow-[0_8px_30px_rgba(124,92,252,0.4)]"
            whileHover={reducedMotion ? {} : { y: -2 }}
            whileTap={reducedMotion ? {} : { scale: 0.98 }}
          >
            <span>Solve Daily Challenge</span>
            <ExternalLink size={16} />
          </motion.a>
        )}
      </div>
    </div>
  );
};

export default DailyChallengeCard;
