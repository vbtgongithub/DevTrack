// ============================================================================
// ActivityFeed.tsx — Project-specific event feed
// ============================================================================
// Shows recent activity for a project: task updates, commits, status changes.
// Falls back to derived data from tasks when no dedicated activity endpoint.
// ============================================================================

import React from 'react';
import { Icon, type IconName } from '../../../components/shared/Icon';
import type { ProjectDetailVM } from '../../../types/vm.types';

interface ActivityItem {
  id: string;
  type: 'task_created' | 'task_completed' | 'status_change' | 'milestone' | 'commit';
  title: string;
  description?: string;
  timestamp: string;
  icon: IconName;
  color: string;
}

interface ActivityFeedProps {
  detail: ProjectDetailVM;
  className?: string;
}

function deriveActivities(detail: ProjectDetailVM): ActivityItem[] {
  const items: ActivityItem[] = [];

  // Derive from tasks
  for (const task of detail.tasks) {
    const statusKey = task.statusLabel.toLowerCase().replace(/\s+/g, '_');

    if (statusKey === 'done') {
      items.push({
        id: `task-done-${task.id}`,
        type: 'task_completed',
        title: `Completed: ${task.title}`,
        description: 'Task moved to done',
        timestamp: task.dueDate || 'Recently',
        icon: 'check-circle',
        color: 'text-emerald-500',
      });
    } else if (statusKey === 'in_progress') {
      items.push({
        id: `task-ip-${task.id}`,
        type: 'status_change',
        title: `Started: ${task.title}`,
        description: 'Task moved to in progress',
        timestamp: task.dueDate || 'Recently',
        icon: 'play',
        color: 'text-blue-500',
      });
    } else if (statusKey === 'review') {
      items.push({
        id: `task-rev-${task.id}`,
        type: 'status_change',
        title: `In review: ${task.title}`,
        description: 'Task moved to review',
        timestamp: task.dueDate || 'Recently',
        icon: 'eye',
        color: 'text-amber-500',
      });
    } else {
      items.push({
        id: `task-created-${task.id}`,
        type: 'task_created',
        title: `Created: ${task.title}`,
        description: `Priority: ${task.priorityLabel}`,
        timestamp: task.dueDate || 'Recently',
        icon: 'plus-circle',
        color: 'text-gray-400',
      });
    }
  }

  // Derive from milestones
  for (const ms of detail.milestones) {
    if (ms.statusLabel === 'Completed') {
      items.push({
        id: `ms-${ms.id}`,
        type: 'milestone',
        title: `Milestone reached: ${ms.title}`,
        description: ms.description || undefined,
        timestamp: ms.dueDate || 'Recently',
        icon: 'flag',
        color: 'text-dt-primary',
      });
    }
  }

  // Add project creation event
  items.push({
    id: 'project-created',
    type: 'status_change',
    title: `Project "${detail.name}" created`,
    description: detail.description || undefined,
    timestamp: detail.createdFormatted,
    icon: 'folder-plus',
    color: 'text-dt-primary',
  });

  return items;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ detail, className = '' }) => {
  const activities = React.useMemo(() => deriveActivities(detail), [detail]);

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon name="clock" size={32} className="text-dt-textMuted/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-dt-textMuted">No activity yet</p>
        <p className="text-xs text-dt-textMuted/60 mt-1">Activity will appear here as you work on the project</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

      <div className="space-y-4">
        {activities.map((item) => (
          <div key={item.id} className="relative flex gap-3 pl-1">
            {/* Icon node */}
            <div className={`relative z-10 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0`}>
              <Icon name={item.icon} size={13} className={item.color} />
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5 min-w-0">
              <p className="text-[13px] font-medium text-dt-text leading-snug truncate">
                {item.title}
              </p>
              {item.description && (
                <p className="text-[11px] text-dt-textMuted mt-0.5 truncate">{item.description}</p>
              )}
              <span className="text-[10px] text-dt-textMuted/60 font-medium mt-1 block">
                {item.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
