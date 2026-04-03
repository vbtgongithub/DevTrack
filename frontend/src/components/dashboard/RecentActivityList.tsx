// ============================================================================
// RecentActivityList.tsx — Recent Activity Feed
// ============================================================================

import React from 'react';
import type { RecentActivityListProps } from '../../types/ui.types';
import { Icon } from '../shared/Icon';
import './Dashboard.css';

export const RecentActivityList: React.FC<RecentActivityListProps> = ({
  activities,
  maxItems = 8,
  onViewAll,
}) => {
  const displayed = activities.slice(0, maxItems);

  return (
    <div className="recent-activity">
      <div className="recent-activity__header">
        <h3 className="recent-activity__title">Recent Activity</h3>
        {onViewAll && (
          <button className="recent-activity__view-all" onClick={onViewAll}>
            View All →
          </button>
        )}
      </div>

      <div className="recent-activity__list">
        {displayed.map((activity) => (
          <div key={activity.id} className="recent-activity__item">
            <div
              className="recent-activity__icon"
              style={{ color: activity.typeColor }}
            >
              <Icon name={activity.icon} size={18} />
            </div>
            <div className="recent-activity__content">
              <div className="recent-activity__item-header">
                <span className="recent-activity__item-title">{activity.title}</span>
                <span className="recent-activity__item-platform">
                  {activity.platformLabel}
                </span>
              </div>
              <p className="recent-activity__item-desc">{activity.description}</p>
              <span className="recent-activity__item-time">{activity.timeAgo}</span>
            </div>
            {activity.url && (
              <a
                href={activity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="recent-activity__item-link"
                aria-label="View"
              >
                <Icon name="link" size={14} />
              </a>
            )}
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="recent-activity__empty">
          <Icon name="clock" size={32} />
          <p>No recent activity yet. Start coding!</p>
        </div>
      )}
    </div>
  );
};
