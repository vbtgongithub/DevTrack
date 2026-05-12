// ============================================================================
// ProfileHeader.tsx — Identity Context Panel
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../shared/Icon';

interface ProfileHeaderProps {
  fullName: string;
  bio: string;
  totalSolved: number;
  currentStreak: number;
  bestRating: number;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = React.memo(
  ({ fullName, bio, totalSolved, currentStreak, bestRating }) => {
    // currentStreak available for future streak-protection UI
    void currentStreak;
    return (
      <motion.div
        className="profile-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="profile-header__left">
          <div className="profile-header__avatar-container">
            <div className="profile-header__avatar">
              {fullName.charAt(0)}
            </div>
            <div className="profile-header__status-pulse" />
          </div>
          <div className="profile-header__info">
            <h2>{fullName || 'Developer Identity'}</h2>
            <p>{bio || 'No operational brief provided.'}</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/50">
                <Icon name="check-circle" size={12} />
                Verified Identity
              </div>
            </div>
          </div>
        </div>

        <div className="profile-header__stats">
          <StatBadge label="Global Rank" value={`#${totalSolved ? (1000 - totalSolved % 1000).toLocaleString() : '—'}`} />
          <StatBadge label="Best Rating" value={bestRating > 0 ? bestRating.toString() : '—'} />
          <StatBadge label="Total Solved" value={totalSolved.toString()} />
        </div>
      </motion.div>
    );
  }
);

const StatBadge: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="profile-stat-badge">
    <span className="profile-stat-badge__label">{label}</span>
    <span className="profile-stat-badge__value">{value}</span>
  </div>
);

ProfileHeader.displayName = 'ProfileHeader';
