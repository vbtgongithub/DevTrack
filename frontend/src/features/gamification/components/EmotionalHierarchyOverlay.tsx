// src/features/gamification/components/EmotionalHierarchyOverlay.tsx — Emotional Hierarchy Overlay
// Visual hierarchy wrapper for overlay notifications with priority-based styling

import { motion, AnimatePresence } from 'framer-motion';
import { useOverlayQueue, type OverlayType } from '../hooks/useOverlayQueue';
import { useGamificationStore } from '../../../store/gamificationStore';

// Priority-based visual configurations
const OVERLAY_CONFIG: Record<OverlayType, {
  scale: number;
  zIndex: number;
  blur: number;
  animationDuration: number;
  backgroundColor: string;
}> = {
  streak_at_risk: {
    scale: 1.2,
    zIndex: 1000,
    blur: 0,
    animationDuration: 0.5,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // Red tint
  },
  level_up: {
    scale: 1.15,
    zIndex: 999,
    blur: 2,
    animationDuration: 0.6,
    backgroundColor: 'rgba(251, 191, 36, 0.1)', // Gold tint
  },
  streak_milestone: {
    scale: 1.1,
    zIndex: 998,
    blur: 4,
    animationDuration: 0.5,
    backgroundColor: 'rgba(59, 130, 246, 0.1)', // Blue tint
  },
  challenge_completed: {
    scale: 1.05,
    zIndex: 997,
    blur: 6,
    animationDuration: 0.4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)', // Green tint
  },
  achievement_unlocked: {
    scale: 1.0,
    zIndex: 996,
    blur: 8,
    animationDuration: 0.4,
    backgroundColor: 'rgba(139, 92, 246, 0.1)', // Purple tint
  },
};

export function EmotionalHierarchyOverlay() {
  const { activeOverlay, dismiss } = useOverlayQueue();
  const dismissCurrentOverlay = useGamificationStore((s) => s.dismissCurrentOverlay);

  const handleDismiss = () => {
    dismiss();
    dismissCurrentOverlay();
  };

  if (!activeOverlay) return null;

  const config = OVERLAY_CONFIG[activeOverlay.type as OverlayType];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: config.scale }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: config.animationDuration }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          backgroundColor: config.backgroundColor,
          backdropFilter: `blur(${config.blur}px)`,
          zIndex: config.zIndex,
        }}
        onClick={handleDismiss}
      >
        {/* The actual overlay content is rendered by the existing overlay components
            which use the gamificationStore. This wrapper provides the emotional
            hierarchy visual effects (scale, blur, background tint, z-index). */}
        <div className="relative">
          {/* Placeholder - the actual overlay is rendered by the existing system */}
          {/* This component can be enhanced to integrate with the existing overlay system */}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default EmotionalHierarchyOverlay;
