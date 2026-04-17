// ============================================================================
// PersonalInfoCard.tsx — Personal Information Form Card
// ============================================================================

import React from 'react';
import type { ProfileData } from '../../types/profile.types';
import { Icon } from '../shared/Icon';

interface PersonalInfoCardProps {
  profile: ProfileData;
  onUpdate: <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => void;
}

const ROLE_OPTIONS = [
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Mobile Developer',
  'DevOps Engineer',
  'Data Scientist',
  'ML Engineer',
  'Software Engineer',
  'Student',
  'Other',
];

export const PersonalInfoCard: React.FC<PersonalInfoCardProps> = React.memo(({ profile, onUpdate }) => {
  return (
    <div className="profile-card">
      <h3 className="profile-card__title">
        <span className="profile-card__title-icon" style={{ background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)' }}>
          <Icon name="user" size={14} color="#7c3aed" />
        </span>
        Personal Information
      </h3>

      <div className="profile-form-group">
        <label className="profile-form-label" htmlFor="profile-fullname">Full Name</label>
        <input
          id="profile-fullname"
          className="profile-form-input"
          type="text"
          placeholder="Alex Reed"
          value={profile.fullName}
          onChange={(e) => onUpdate('fullName', e.target.value)}
        />
      </div>

      <div className="profile-form-group">
        <label className="profile-form-label" htmlFor="profile-email">Email</label>
        <input
          id="profile-email"
          className="profile-form-input"
          type="email"
          placeholder="alex.reed@gmail.com"
          value={profile.email}
          onChange={(e) => onUpdate('email', e.target.value)}
        />
      </div>

      <div className="profile-form-group">
        <label className="profile-form-label" htmlFor="profile-role">Role</label>
        <select
          id="profile-role"
          className="profile-form-select"
          value={profile.role}
          onChange={(e) => onUpdate('role', e.target.value)}
        >
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      <div className="profile-form-group">
        <label className="profile-form-label" htmlFor="profile-bio">Bio</label>
        <input
          id="profile-bio"
          className="profile-form-input"
          type="text"
          placeholder="Software engineering student focused on DSA..."
          value={profile.bio}
          onChange={(e) => onUpdate('bio', e.target.value)}
        />
      </div>
    </div>
  );
});

PersonalInfoCard.displayName = 'PersonalInfoCard';
