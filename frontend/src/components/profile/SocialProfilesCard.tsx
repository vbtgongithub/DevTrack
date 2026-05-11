// ============================================================================
// SocialProfilesCard.tsx — Digital Presence Panel
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import type { ProfileData } from '../../types/profile.types';
import { Icon } from '../shared/Icon';

interface SocialProfilesCardProps {
  profile: ProfileData;
  onUpdate: <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => void;
}

export const SocialProfilesCard: React.FC<SocialProfilesCardProps> = React.memo(({ profile, onUpdate }) => {
  const links = [
    { key: 'githubUrl' as const, label: 'GitHub Ecosystem', icon: 'github', placeholder: 'https://github.com/username' },
    { key: 'linkedinUrl' as const, label: 'Professional Network', icon: 'link', placeholder: 'https://linkedin.com/in/username' },
    { key: 'portfolioUrl' as const, label: 'Digital Portfolio', icon: 'globe', placeholder: 'https://yourportfolio.com' },
  ];

  return (
    <motion.div
      className="profile-card"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h3 className="profile-card__title">
        <div className="profile-card__title-icon">
          <Icon name="globe" size={18} />
        </div>
        Digital Presence
      </h3>

      <div className="space-y-4">
        {links.map(({ key, label, icon, placeholder }) => (
          <div key={key} className="social-link-node group">
            <div className="social-link-icon-box">
              <Icon name={icon} size={18} />
            </div>
            <div className="flex-1">
              <label className="profile-form-label !mb-1">{label}</label>
              <input
                type="url"
                placeholder={placeholder}
                value={profile[key]}
                onChange={(e) => onUpdate(key, e.target.value)}
                className="profile-form-input !py-2 !text-xs font-semibold"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="visibility-banner">
        <div className="visibility-banner__dot" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Public identity visibility active</span>
      </div>
    </motion.div>
  );
});

SocialProfilesCard.displayName = 'SocialProfilesCard';
