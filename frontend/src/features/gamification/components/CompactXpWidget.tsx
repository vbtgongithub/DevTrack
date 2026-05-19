// ============================================================================
// CompactXpWidget.tsx — Mobile-Optimized XP Widget
// ============================================================================
// Compact XP progression widget for mobile devices.
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useXpState } from '../hooks/useXpState';
import { XpGainFloat } from './XpGainFloat';
import { fadeUp, smooth, prefersReducedMotion } from '../../../design-system/motion';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CompactXpWidget: React.FC = () => {
  const {
    liveXp,
    currentLevel,
    xpInCurrentLevel,
    xpForNextLevel,
    progressPercent,
    levelName,
    pendingXpGain,
  } = useXpState();

  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      transition={smooth}
      className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-4 overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-dt-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-dt-primary/10 flex items-center justify-center">
              <Zap size={16} className="text-dt-primary" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-dt-primary">
                Level {currentLevel}
              </p>
              <p className="text-[10px] font-medium text-dt-textSecondary">
                {levelName}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-lg font-black text-dt-text tabular-nums">
              {liveXp.toLocaleString()}
            </p>
            <p className="text-[10px] font-medium text-dt-textSecondary">
              Total XP
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-dt-primary to-dt-primary/80 rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={smooth}
            >
              {/* Shimmer effect */}
              {!prefersReducedMotion && (
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite linear',
                  }}
                />
              )}
            </motion.div>
          </div>
          
          {/* XP label */}
          <p className="text-[10px] font-bold text-dt-textSecondary mt-1 text-center tabular-nums">
            {xpInCurrentLevel} / {xpForNextLevel} XP
          </p>
        </div>
      </div>

      {/* XP gain float */}
      {pendingXpGain && <XpGainFloat position="top-right" />}
    </motion.div>
  );
};

export default CompactXpWidget;
