// ============================================================================
// SyncProgressIndicator.tsx — Platform Sync Progress Display
// ============================================================================
// Shows progress for each platform during sync operation
// Displays platform status: pending, syncing, success, error
// Real-time status updates via SSE
// ============================================================================

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Loader } from 'lucide-react';
import { prefersReducedMotion } from '../../design-system/motion';

export type PlatformStatus = 'pending' | 'syncing' | 'success' | 'error' | 'skipped';

export interface PlatformProgress {
  platform: 'leetcode' | 'codeforces' | 'codechef' | 'github' | 'codeblocks';
  status: PlatformStatus;
  progress?: number; // 0-100
  itemsProcessed?: number;
  itemsTotal?: number;
  error?: string;
}

interface SyncProgressIndicatorProps {
  platforms: PlatformProgress[];
  isVisible?: boolean;
  compact?: boolean;
}

const PLATFORM_CONFIG = {
  leetcode: { name: 'LeetCode', icon: '💻', color: 'from-orange-500 to-orange-600' },
  codeforces: { name: 'Codeforces', icon: '🏆', color: 'from-blue-500 to-blue-600' },
  codechef: { name: 'CodeChef', icon: '👨‍🍳', color: 'from-amber-700 to-amber-800' },
  github: { name: 'GitHub', icon: '🐙', color: 'from-slate-700 to-slate-800' },
  codeblocks: { name: 'CodeBlocks', icon: '📝', color: 'from-sky-500 to-sky-600' },
};

const STATUS_ICON: Record<PlatformStatus, React.ReactNode> = {
  pending: <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />,
  syncing: <Loader className="w-5 h-5 text-blue-500 animate-spin" />,
  success: <Check className="w-5 h-5 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  skipped: <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600" />,
};

const STATUS_COLOR: Record<PlatformStatus, string> = {
  pending: 'text-slate-500 dark:text-slate-400',
  syncing: 'text-blue-500',
  success: 'text-green-500',
  error: 'text-red-500',
  skipped: 'text-slate-400 dark:text-slate-600',
};

const STATUS_BG: Record<PlatformStatus, string> = {
  pending: 'bg-slate-100 dark:bg-slate-800',
  syncing: 'bg-blue-50 dark:bg-blue-950',
  success: 'bg-green-50 dark:bg-green-950',
  error: 'bg-red-50 dark:bg-red-950',
  skipped: 'bg-slate-100 dark:bg-slate-800',
};

/**
 * PlatformProgressItem — Individual platform sync status
 */
const PlatformProgressItem: React.FC<{
  platform: PlatformProgress;
  reducedMotion: boolean;
}> = ({ platform, reducedMotion }) => {
  const config = PLATFORM_CONFIG[platform.platform];
  const progressPercent = platform.progress ?? 0;

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${STATUS_BG[platform.status]} border-transparent`}
    >
      {/* Platform Icon & Name */}
      <div className="flex-shrink-0 flex items-center gap-2 min-w-0">
        <span className="text-lg">{config.icon}</span>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
          {config.name}
        </span>
      </div>

      {/* Progress or Items Count */}
      {platform.itemsTotal && platform.status === 'syncing' ? (
        <div className="flex-grow min-w-0 text-xs text-slate-600 dark:text-slate-400">
          <span>
            {platform.itemsProcessed ?? 0}/{platform.itemsTotal}
          </span>
        </div>
      ) : platform.error ? (
        <div className="flex-grow min-w-0 text-xs text-red-600 dark:text-red-400 truncate">
          {platform.error}
        </div>
      ) : null}

      {/* Status Icon */}
      <div className="flex-shrink-0 w-5 h-5">{STATUS_ICON[platform.status]}</div>
    </motion.div>
  );
};

/**
 * CompactSyncProgress — Minimal progress display
 */
const CompactSyncProgress: React.FC<{ platforms: PlatformProgress[] }> = ({
  platforms,
}) => {
  const total = platforms.length;
  const completed = platforms.filter((p) => p.status === 'success').length;
  const failed = platforms.filter((p) => p.status === 'error').length;
  const syncing = platforms.filter((p) => p.status === 'syncing').length;

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800">
      <div className="flex-shrink-0">
        <Loader className="w-5 h-5 text-blue-500 animate-spin" />
      </div>
      <div className="flex-grow text-sm">
        <div className="font-semibold text-slate-900 dark:text-white">
          Syncing... {syncing} active
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">
          {completed} ✓ {failed > 0 ? `${failed} ✗` : ''}
        </div>
      </div>
      <div className="flex gap-1">
        {platforms.map((p) => (
          <motion.div
            key={p.platform}
            className={`w-2 h-2 rounded-full transition-colors ${
              p.status === 'success'
                ? 'bg-green-500'
                : p.status === 'error'
                  ? 'bg-red-500'
                  : p.status === 'syncing'
                    ? 'bg-blue-500'
                    : 'bg-slate-400'
            }`}
            animate={p.status === 'syncing' ? { scale: [0.8, 1.2, 0.8] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * SyncProgressIndicator — Full progress display with platform details
 */
export const SyncProgressIndicator: React.FC<SyncProgressIndicatorProps> = ({
  platforms,
  isVisible = true,
  compact = false,
}) => {
  const reducedMotion = prefersReducedMotion();
  const allCompleted = platforms.every(
    (p) => p.status === 'success' || p.status === 'error' || p.status === 'skipped'
  );

  if (!isVisible) return null;

  if (compact) {
    return <CompactSyncProgress platforms={platforms} />;
  }

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg"
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Platform Sync Progress
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {platforms.filter((p) => p.status === 'success').length} of{' '}
          {platforms.length} complete
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{
            width: `${(platforms.filter((p) => p.status === 'success').length / platforms.length) * 100}%`,
          }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Platform List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {platforms.map((platform) => (
            <PlatformProgressItem
              key={platform.platform}
              platform={platform}
              reducedMotion={reducedMotion}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Completion Message */}
      {allCompleted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-950 text-xs text-green-700 dark:text-green-300 font-medium text-center"
        >
          ✅ Sync complete! Check your updates.
        </motion.div>
      )}
    </motion.div>
  );
};

export default SyncProgressIndicator;
