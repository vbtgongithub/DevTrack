// ============================================================================
// CareerGoalsCard.tsx — Strategic Alignment Panel
// ============================================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      <motion.div
        className="profile-card"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="profile-card__title">
          <div className="profile-card__title-icon">
            <Icon name="rocket" size={18} />
          </div>
          Strategic Objectives
        </h3>

        <div className="space-y-4">
          <div className="profile-form-group">
            <label className="profile-form-label" htmlFor="profile-target-role">Target Role</label>
            <input
              id="profile-target-role"
              className="profile-form-input"
              type="text"
              placeholder="e.g. Senior Software Engineer"
              value={profile.targetRole}
              onChange={(e) => onUpdate('targetRole', e.target.value)}
            />
          </div>

          <div className="profile-form-group">
            <label className="profile-form-label" htmlFor="profile-target-companies">Target Ecosystems</label>
            <input
              id="profile-target-companies"
              className="profile-form-input"
              type="text"
              placeholder="e.g. Stripe, OpenAI, Vercel"
              value={profile.targetCompanies}
              onChange={(e) => onUpdate('targetCompanies', e.target.value)}
            />
          </div>

          <div className="profile-form-group">
            <label className="profile-form-label">Core Tech Matrix</label>
            <div className="tech-stack-tags">
              <AnimatePresence>
                {profile.techStack.map((tag) => (
                  <motion.span
                    key={tag}
                    className="tech-stack-tag"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    {tag}
                    <button
                      type="button"
                      className="tech-stack-tag__remove"
                      onClick={() => onRemoveTech(tag)}
                    >
                      <Icon name="x-mark" size={10} />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
            <div className="tech-stack-input-row">
              <input
                className="profile-form-input"
                type="text"
                placeholder="Add technology..."
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
                Add Node
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

CareerGoalsCard.displayName = 'CareerGoalsCard';
