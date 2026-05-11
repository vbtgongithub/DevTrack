// ============================================================================
// ProfileAchievementsCard.tsx — Badge Ecosystem
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../shared/Icon';

const ALL_BADGES = [
  { id: '1', emoji: '🔥', title: '7 Day Streak', description: 'Solved problems for 7 consecutive days' },
  { id: '2', emoji: '🚀', title: 'Fastest Solver', description: 'Solved 5 problems in under an hour' },
  { id: '3', emoji: '🏆', title: 'Contest Winner', description: 'Won a platform contest' },
  { id: '4', emoji: '💻', title: 'Stack Master', description: 'Used 5+ different technologies' },
  { id: '5', emoji: '🌟', title: 'Top 1%', description: 'Ranked in the top 1% globally' },
  { id: '6', emoji: '⚡', title: 'Speed Demon', description: 'First to solve a problem' },
  { id: '7', emoji: '🎯', title: 'Bullseye', description: '100% submission accuracy' },
  { id: '8', emoji: '🧩', title: 'Logic King', description: 'Solved 10 hard problems' },
  { id: '9', emoji: '💎', title: 'Rare Find', description: 'Found a unique solution' },
  { id: '10', emoji: '🛡️', title: 'Defender', description: 'Helped 5 other developers' },
  { id: '11', emoji: '🧬', title: 'Innovator', description: 'Created a new project template' },
  { id: '12', emoji: '📡', title: 'Connected', description: 'Synced all 4 platforms' },
];

export const ProfileAchievementsCard: React.FC = React.memo(() => {
  // Demo: First 4 are unlocked
  const unlockedCount = 4;

  return (
    <motion.div
      className="profile-card"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="profile-card__title" style={{ marginBottom: 0 }}>
          <div className="profile-card__title-icon">
            <Icon name="award" size={18} />
          </div>
          Honorary Achievements
        </h3>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
          {unlockedCount} / {ALL_BADGES.length} Unlocked
        </span>
      </div>

      <div className="achievement-badge-grid">
        {ALL_BADGES.map((badge, i) => {
          const isUnlocked = i < unlockedCount;
          return (
            <motion.div
              key={badge.id}
              className={`achievement-badge ${isUnlocked ? 'achievement-badge--unlocked' : 'achievement-badge--locked'}`}
              title={`${badge.title}: ${badge.description}`}
              whileHover={isUnlocked ? { scale: 1.1, rotate: 5 } : {}}
            >
              <span style={{ fontSize: '24px', lineHeight: 1 }}>{badge.emoji}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
});

ProfileAchievementsCard.displayName = 'ProfileAchievementsCard';
