// ============================================================================
// SocialProfilesCard.tsx — Social Profiles Links Card
// ============================================================================

import React from 'react';
import type { ProfileData } from '../../types/profile.types';
import { Icon } from '../shared/Icon';

interface SocialProfilesCardProps {
  profile: ProfileData;
  onUpdate: <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => void;
}

export const SocialProfilesCard: React.FC<SocialProfilesCardProps> = React.memo(({ profile, onUpdate }) => {
  const links = [
    { key: 'githubUrl' as const, label: 'GitHub URL', icon: 'git-branch', placeholder: 'https://github.com/username' },
    { key: 'linkedinUrl' as const, label: 'LinkedIn URL', icon: 'link', placeholder: 'https://linkedin.com/in/username' },
    { key: 'portfolioUrl' as const, label: 'Portfolio URL', icon: 'globe', placeholder: 'https://yourportfolio.com' },
  ];

  return (
    <div className="profile-card">
      <h3 className="profile-card__title">
        <span className="profile-card__title-icon" style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}>
          <Icon name="link" size={14} color="#059669" />
        </span>
        Social Profiles
      </h3>

      {links.map(({ key, label, icon, placeholder }) => (
        <div key={key} className="social-link-row">
          <div className="social-link-icon">
            <Icon name={icon} size={16} color="#6b7280" />
          </div>
          <div className="social-link-input">
            <input
              type="url"
              placeholder={placeholder}
              value={profile[key]}
              onChange={(e) => onUpdate(key, e.target.value)}
              aria-label={label}
            />
          </div>
        </div>
      ))}
    </div>
  );
});

SocialProfilesCard.displayName = 'SocialProfilesCard';
