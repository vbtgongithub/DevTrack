// ============================================================================
// SystemHealthBar.tsx — Live System Status Indicators
// ============================================================================
// Subtle, OS-level health indicators for the settings page.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../../../components/shared/Icon';

interface SystemStatus {
  id: string;
  label: string;
  status: 'healthy' | 'warning' | 'error' | 'syncing';
  detail?: string;
  icon: string;
}

interface SystemHealthBarProps {
  onSettingsChange?: (status: SystemStatus[]) => void;
}

// Simulated system status - in production, this would come from actual API
export const SystemHealthBar: React.FC<SystemHealthBarProps> = ({ onSettingsChange }) => {
  const [statuses, setStatuses] = useState<SystemStatus[]>([
    { id: 'sync', label: 'Sync', status: 'healthy', detail: 'Connected', icon: 'cloud' },
    { id: 'github', label: 'GitHub', status: 'healthy', detail: 'Synced 14s ago', icon: 'brand-github' },
    { id: 'leetcode', label: 'LeetCode', status: 'warning', detail: 'Needs refresh', icon: 'code-bracket' },
    { id: 'api', label: 'API', status: 'healthy', detail: '45ms latency', icon: 'server' },
  ]);

  const [expanded, setExpanded] = useState(false);

  // Simulate periodic status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStatuses(prev => prev.map(s => ({
        ...s,
        detail: s.id === 'api' ? `${40 + Math.floor(Math.random() * 20)}ms latency` : s.detail,
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Notify parent of status changes
  useEffect(() => {
    onSettingsChange?.(statuses);
  }, [statuses, onSettingsChange]);

  const getStatusColor = (status: SystemStatus['status']) => {
    switch (status) {
      case 'healthy':
        return {
          bg: 'bg-dt-success/10',
          dot: 'bg-dt-success',
          text: 'text-dt-success',
          icon: 'text-dt-success/70',
        };
      case 'warning':
        return {
          bg: 'bg-dt-warning/10',
          dot: 'bg-dt-warning',
          text: 'text-dt-warning',
          icon: 'text-dt-warning/70',
        };
      case 'error':
        return {
          bg: 'bg-dt-error/10',
          dot: 'bg-dt-error',
          text: 'text-dt-error',
          icon: 'text-dt-error/70',
        };
      case 'syncing':
        return {
          bg: 'bg-dt-primary/10',
          dot: 'bg-dt-primary animate-pulse',
          text: 'text-dt-primary',
          icon: 'text-dt-primary/70',
        };
    }
  };

  const healthyCount = statuses.filter(s => s.status === 'healthy').length;
  const totalCount = statuses.length;

  return (
    <div className="relative">
      {/* Collapsed Status Bar */}
      <motion.button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-dt-primary/5 hover:bg-white/80 transition-all duration-200"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-1.5">
          {statuses.slice(0, 3).map((status) => {
            const colors = getStatusColor(status.status);
            return (
              <div
                key={status.id}
                className={`w-2 h-2 rounded-full ${colors.dot}`}
              />
            );
          })}
        </div>
        <span className="text-xs font-semibold text-dt-textSecondary/70">
          {healthyCount}/{totalCount} connected
        </span>
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={12}
          className="text-dt-textMuted/50"
        />
      </motion.button>

      {/* Expanded Status Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute top-full right-0 mt-2 w-72 bg-white/95 backdrop-blur-2xl border border-dt-primary/10 rounded-2xl shadow-[0_16px_48px_rgba(124,92,252,0.12)] overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-dt-primary/5 bg-dt-bg/30">
              <h4 className="text-xs font-black text-dt-text uppercase tracking-wider">System Status</h4>
            </div>

            <div className="p-3 space-y-1">
              {statuses.map((status) => {
                const colors = getStatusColor(status.status);
                return (
                  <div
                    key={status.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${colors.bg} transition-all duration-200`}
                  >
                    <Icon name={status.icon} size={16} className={colors.icon} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-dt-text">{status.label}</span>
                        <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                      </div>
                      {status.detail && (
                        <p className={`text-[11px] font-medium ${colors.text} mt-0.5`}>
                          {status.detail}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-4 py-2.5 border-t border-dt-primary/5 bg-dt-bg/30 flex items-center justify-between">
              <span className="text-[11px] font-medium text-dt-textMuted/50">
                Last updated just now
              </span>
              <button className="text-[11px] font-black text-dt-primary uppercase tracking-wider hover:underline">
                Refresh
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Import AnimatePresence
import { AnimatePresence } from 'framer-motion';