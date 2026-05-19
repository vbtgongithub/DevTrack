// ============================================================================
// AdaptiveStreakCard.tsx — Responsive Streak Card
// ============================================================================
// Streak card that adapts density based on viewport.
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, AlertTriangle } from 'lucide-react';
import { useStreakState } from '../hooks/useStreakState';
import { useBreakpoint } from '../../../hooks/useMediaQuery';
import { fadeUp, smooth } from '../../../design-system/motion';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AdaptiveStreakCard: React.FC = () => {
  const {
    liveStreak,
    isActiveToday,
    isAtRisk,
    hoursRemaining,
    nextMilestone,
    daysUntilMilestone,
  } = useStreakState();
  
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  // Determine streak status
  const status = isAtRisk ? 'at-risk' : isActiveToday ? 'active' : 'inactive';
  
  const statusConfig = {
    'at-risk': {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: AlertTriangle,
      message: `${hoursRemaining}h remaining`,
    },
    'active': {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: Flame,
      message: 'Secured today',
    },
    'inactive': {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      icon: Flame,
      message: 'Keep it going',
    },
  }[status];

  const Icon = statusConfig.icon;

  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      transition={smooth}
      className={[
        'relative rounded-2xl border shadow-sm overflow-hidden',
        statusConfig.bg,
        statusConfig.border,
        isMobile ? 'p-4' : 'p-6',
      ].join(' ')}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={[
              'rounded-lg flex items-center justify-center',
              isMobile ? 'w-8 h-8' : 'w-10 h-10',
              statusConfig.bg,
            ].join(' ')}>
              <Icon size={isMobile ? 16 : 20} className={statusConfig.text} />
            </div>
            <div>
              <p className={[
                'font-black uppercase tracking-wider',
                isMobile ? 'text-xs' : 'text-sm',
                statusConfig.text,
              ].join(' ')}>
                {liveStreak} Day Streak
              </p>
              <p className={[
                'font-medium',
                isMobile ? 'text-[10px]' : 'text-xs',
                statusConfig.text,
                'opacity-70',
              ].join(' ')}>
                {statusConfig.message}
              </p>
            </div>
          </div>
        </div>

        {/* Progress to next milestone */}
        {!isMobile && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-dt-textSecondary">
                Next milestone
              </p>
              <p className="text-xs font-black text-dt-text tabular-nums">
                {nextMilestone} days
              </p>
            </div>
            <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
              <motion.div
                className={['h-full rounded-full', statusConfig.text.replace('text-', 'bg-')].join(' ')}
                initial={{ width: 0 }}
                animate={{ width: `${((liveStreak % nextMilestone) / nextMilestone) * 100}%` }}
                transition={smooth}
              />
            </div>
            <p className="text-[10px] font-medium text-dt-textSecondary mt-1">
              {daysUntilMilestone} days to go
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdaptiveStreakCard;
