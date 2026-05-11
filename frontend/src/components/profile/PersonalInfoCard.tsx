// ============================================================================
// PersonalInfoCard.tsx — Core Identity Configuration
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import type { ProfileData } from '../../types/profile.types';
import { Icon } from '../shared/Icon';

interface PersonalInfoCardProps {
  profile: ProfileData;
  onUpdate: <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => void;
}

export const PersonalInfoCard: React.FC<PersonalInfoCardProps> = React.memo(({ profile, onUpdate }) => {
  return (
    <motion.div
      className="profile-card"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="profile-card__title">
        <div className="profile-card__title-icon">
          <Icon name="user" size={18} />
        </div>
        Operational Identity
      </h3>

      <div className="space-y-4">
        <div className="profile-form-group">
          <label className="profile-form-label" htmlFor="profile-fullname">Legal Engineering Name</label>
          <input
            id="profile-fullname"
            className="profile-form-input"
            type="text"
            placeholder="e.g. Satya Nadella"
            value={profile.fullName}
            onChange={(e) => onUpdate('fullName', e.target.value)}
          />
        </div>

        <div className="profile-form-group">
          <label className="profile-form-label" htmlFor="profile-bio">Operational Brief (Bio)</label>
          <textarea
            id="profile-bio"
            className="profile-form-input min-h-[100px] resize-none"
            placeholder="Focusing on distributed systems and cloud architecture..."
            value={profile.bio}
            onChange={(e) => onUpdate('bio', e.target.value)}
          />
        </div>

        <div className="profile-form-group">
          <label className="profile-form-label" htmlFor="profile-location">Geographical Node</label>
          <input
            id="profile-location"
            className="profile-form-input"
            type="text"
            placeholder="e.g. Seattle, WA"
            value={profile.location}
            onChange={(e) => onUpdate('location', e.target.value)}
          />
        </div>
      </div>
    </motion.div>
  );
});

PersonalInfoCard.displayName = 'PersonalInfoCard';
