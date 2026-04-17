// ============================================================================
// ProfileHeader.tsx — Profile Header with Avatar, Name & Stats
// ============================================================================

import React from 'react';
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
    const initials = fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

    return (
      <div className="profile-header">
        <div className="profile-header__left">
          <div className="profile-header__avatar" title={fullName || 'User'}>
            {initials}
          </div>
          <div className="profile-header__info">
            <h2>{fullName || 'Your Name'}</h2>
            <p>{bio || 'Software engineering student focused on DSA and full-stack development'}</p>
          </div>
        </div>

        <div className="profile-header__stats">
          <div className="profile-stat-badge">
            <div className="profile-stat-badge__icon profile-stat-badge__icon--purple">
              <Icon name="check-circle" size={16} />
            </div>
            <div>
              <div className="profile-stat-badge__label">Problems Solved</div>
              <div className="profile-stat-badge__value">{totalSolved.toLocaleString()}</div>
            </div>
          </div>

          <div className="profile-stat-badge">
            <div className="profile-stat-badge__icon profile-stat-badge__icon--amber">
              <Icon name="fire" size={16} />
            </div>
            <div>
              <div className="profile-stat-badge__label">Current Streak</div>
              <div className="profile-stat-badge__value">{currentStreak} days</div>
            </div>
          </div>

          <div className="profile-stat-badge">
            <div className="profile-stat-badge__icon profile-stat-badge__icon--emerald">
              <Icon name="trophy" size={16} />
            </div>
            <div>
              <div className="profile-stat-badge__label">Best Rating</div>
              <div className="profile-stat-badge__value">{bestRating || '—'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ProfileHeader.displayName = 'ProfileHeader';
