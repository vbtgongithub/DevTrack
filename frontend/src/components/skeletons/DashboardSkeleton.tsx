// ============================================================================
// DashboardSkeleton.tsx — Dashboard Loading Experience
// ============================================================================
// Unified Design System - Uses dt-skeleton tokens
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';

const SkeletonLine: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <div className={`dt-skeleton dt-skeleton-text ${className}`} style={style} />
);

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`dt-skeleton dt-card-base ${className}`} />
);

const StatCardSkeleton: React.FC = () => (
  <div className="dt-card-base dt-card-pad-md flex items-center gap-4">
    <div className="w-10 h-10 rounded-xl bg-dt-primary/5" />
    <div className="flex-1 space-y-2">
      <SkeletonLine className="w-16" />
      <SkeletonLine className="w-24" style={{ height: '20px' }} />
    </div>
  </div>
);

const PlatformCardSkeleton: React.FC = () => (
  <div className="dt-card-base dt-card-pad-md flex flex-col gap-3">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-dt-primary/5" />
      <SkeletonLine className="w-20 h-3" />
    </div>
    <SkeletonLine className="w-12" style={{ height: '24px' }} />
    <SkeletonLine className="w-16" />
  </div>
);

const SectionHeaderSkeleton: React.FC = () => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-dt-primary/5" />
    <div className="space-y-1.5">
      <SkeletonLine className="w-36" />
      <SkeletonLine className="w-48 h-2" />
    </div>
  </div>
);

const SyncButtonSkeleton: React.FC = () => (
  <div className="w-[110px] h-9 rounded-xl bg-white/40 border border-dt-primary/10 dt-skeleton animate-pulse" />
);

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full pb-16">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonLine className="w-64" style={{ height: '32px' }} />
          <SkeletonLine className="w-48 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <SyncButtonSkeleton />
          <SkeletonBlock className="w-32 h-9 dt-radius-md" />
        </div>
      </div>

      {/* Stats grid skeleton — matches StatsGrid layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 items-stretch">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={`stat-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 60, duration: 0.4 }}
          >
            <StatCardSkeleton />
          </motion.div>
        ))}
      </div>

      {/* Platform cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 items-stretch">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={`platform-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 60 + 100, duration: 0.4 }}
          >
            <PlatformCardSkeleton />
          </motion.div>
        ))}
      </div>

      {/* Gamification panel skeleton */}
      <div className="dt-radius-2xl dt-card-base dt-card-pad-xl space-y-6">
        <div className="flex items-center justify-between">
          <SkeletonLine className="w-48 h-6" />
          <SkeletonLine className="w-24 h-3" />
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-dt-primary/15 to-transparent" />
        <div className="flex items-center gap-6">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={`mission-${i}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 80 + 300, duration: 0.3 }}
              className="flex-1"
            >
              <div className="dt-card-base dt-card-pad-sm space-y-3">
                <SkeletonBlock className="w-8 h-8 dt-radius-md" />
                <SkeletonLine className="w-full" />
                <SkeletonLine className="w-3/4" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI Insights & Platform Intel skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <div className="dt-radius-2xl dt-card-base dt-card-pad-lg space-y-4">
            <SectionHeaderSkeleton />
            <div className="space-y-3 mt-4">
              {[0, 1, 2, 3].map((i) => (
                <SkeletonLine key={i} className={i === 3 ? 'w-2/3' : 'w-full'} />
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="dt-radius-2xl dt-card-base dt-card-pad-lg space-y-4">
            <SectionHeaderSkeleton />
            <div className="space-y-3 mt-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="dt-radius-md dt-card-base dt-card-pad-sm space-y-2">
                  <SkeletonLine className="w-20" />
                  <SkeletonLine className="w-full" style={{ height: '20px' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Focus & Productivity skeleton */}
      <div className="space-y-6">
        <SectionHeaderSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`focus-${i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 80 + 600, duration: 0.4 }}
            >
              <div className="dt-radius-2xl dt-card-base dt-card-pad-lg space-y-4">
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="w-8 h-8 dt-radius-md" />
                  <SkeletonLine className="w-28 h-4" />
                </div>
                <SkeletonLine className="w-full" />
                <SkeletonLine className="w-4/5" />
                <SkeletonLine className="w-3/5" />
                <SkeletonBlock className="w-24 h-9 dt-radius-md mt-2" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};