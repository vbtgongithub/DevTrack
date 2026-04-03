// ============================================================================
// PlatformSummaryRow.tsx — Connected Platforms Summary
// ============================================================================

import React from 'react';
import type { PlatformSummaryRowProps } from '../../types/ui.types';
import { Icon } from '../shared/Icon';
import './Dashboard.css';

export const PlatformSummaryRow: React.FC<PlatformSummaryRowProps> = ({
  platforms,
}) => {
  if (platforms.length === 0) {
    return (
      <div className="platform-empty">
        <Icon name="link" size={24} />
        <p>No platforms connected. Go to Settings to connect your accounts.</p>
      </div>
    );
  }

  return (
    <div className="platform-row">
      {platforms.map((platform) => (
        <div key={platform.id} className="platform-card">
          <div className="platform-card__header">
            <div className="platform-card__icon">
              <Icon name={platform.icon} size={20} />
            </div>
            <div className="platform-card__title">
              <h4 className="platform-card__name">{platform.displayName}</h4>
              <span className="platform-card__username">@{platform.username}</span>
            </div>
            <span
              className={`platform-card__status ${
                platform.isConnected
                  ? 'platform-card__status--connected'
                  : 'platform-card__status--disconnected'
              }`}
            >
              {platform.syncStatusLabel}
            </span>
          </div>

          <div className="platform-card__stats">
            {platform.stats.map((stat) => (
              <div key={stat.label} className="platform-card__stat">
                <span className="platform-card__stat-value">{stat.value}</span>
                <span className="platform-card__stat-label">{stat.label}</span>
              </div>
            ))}
          </div>

          {platform.difficulty && (
            <div className="platform-card__difficulty">
              <div className="platform-card__diff-bar">
                <div
                  className="platform-card__diff-segment platform-card__diff-segment--easy"
                  style={{ width: `${platform.difficulty.easy.percent}%` }}
                  title={`Easy: ${platform.difficulty.easy.solved}`}
                />
                <div
                  className="platform-card__diff-segment platform-card__diff-segment--medium"
                  style={{ width: `${platform.difficulty.medium.percent}%` }}
                  title={`Medium: ${platform.difficulty.medium.solved}`}
                />
                <div
                  className="platform-card__diff-segment platform-card__diff-segment--hard"
                  style={{ width: `${platform.difficulty.hard.percent}%` }}
                  title={`Hard: ${platform.difficulty.hard.solved}`}
                />
              </div>
              <div className="platform-card__diff-legend">
                <span className="platform-card__diff-label" style={{ color: '#00B8A3' }}>
                  E: {platform.difficulty.easy.solved}
                </span>
                <span className="platform-card__diff-label" style={{ color: '#FFC01E' }}>
                  M: {platform.difficulty.medium.solved}
                </span>
                <span className="platform-card__diff-label" style={{ color: '#FF375F' }}>
                  H: {platform.difficulty.hard.solved}
                </span>
              </div>
            </div>
          )}

          <div className="platform-card__footer">
            <span className="platform-card__sync-time">
              Synced {platform.lastSynced}
            </span>
            {platform.profileUrl && (
              <a
                href={platform.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="platform-card__link"
              >
                View Profile →
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
