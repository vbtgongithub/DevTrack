// ============================================================================
// CareerGoalsCard.tsx — Career Goals Form Card
// ============================================================================

import React from 'react';
import type { ProfileData } from '../../types/profile.types';
import { Icon } from '../shared/Icon';

interface CareerGoalsCardProps {
  profile: ProfileData;
  onUpdate: <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => void;
  onAddTech: (tag: string) => void;
  onRemoveTech: (tag: string) => void;
}

export const CareerGoalsCard: React.FC<CareerGoalsCardProps> = React.memo(
  ({ profile, onUpdate, onAddTech, onRemoveTech }) => {
    const [newTag, setNewTag] = React.useState('');

    const handleAddTag = () => {
      if (newTag.trim()) {
        onAddTech(newTag.trim());
        setNewTag('');
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
      }
    };

    return (
      <div className="profile-card">
        <h3 className="profile-card__title">
          <span className="profile-card__title-icon" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
            <Icon name="trophy" size={14} color="#d97706" />
          </span>
          Career Goals
        </h3>

        <div className="profile-form-group">
          <label className="profile-form-label" htmlFor="profile-target-role">Target Role</label>
          <input
            id="profile-target-role"
            className="profile-form-input"
            type="text"
            placeholder="Software Development Engineer"
            value={profile.targetRole}
            onChange={(e) => onUpdate('targetRole', e.target.value)}
          />
        </div>

        <div className="profile-form-group">
          <label className="profile-form-label" htmlFor="profile-target-companies">Target Companies</label>
          <input
            id="profile-target-companies"
            className="profile-form-input"
            type="text"
            placeholder="Amazon, Google, Microsoft"
            value={profile.targetCompanies}
            onChange={(e) => onUpdate('targetCompanies', e.target.value)}
          />
        </div>

        <div className="profile-form-group">
          <label className="profile-form-label">Preferred Tech Stack</label>
          <div className="tech-stack-tags">
            {profile.techStack.map((tag) => (
              <span key={tag} className="tech-stack-tag">
                {tag}
                <button
                  type="button"
                  className="tech-stack-tag__remove"
                  onClick={() => onRemoveTech(tag)}
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="tech-stack-input-row">
            <input
              className="profile-form-input"
              type="text"
              placeholder="Add a technology..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="tech-stack-add-btn"
              onClick={handleAddTag}
              disabled={!newTag.trim()}
            >
              + Add
            </button>
          </div>
        </div>
      </div>
    );
  }
);

CareerGoalsCard.displayName = 'CareerGoalsCard';
