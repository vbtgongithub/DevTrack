import { motion as framerMotion } from 'framer-motion';
import { Activity, GitMerge } from 'lucide-react';
import { motion, typography, colors, depth } from '../../design-system/tokens/index.ts';
import type { ApiDashboardRecentActivity } from '../../types/api.types';
import { DormantIntelligenceState } from '../../runtime-presence/DormantIntelligenceState.tsx';

interface ActivityFeedProps {
  items: ApiDashboardRecentActivity[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return <DormantIntelligenceState label="NO RECENT RUNTIME EVENTS" sublabel="Waiting for active platform synchronization." />;
  }

  return (
    <div 
      className="flex flex-col gap-4 rounded-xl p-6"
      style={{
        background: colors.surface.elevated,
        border: `1px solid ${colors.surface.border}`,
        boxShadow: depth.shadows.level1,
      }}
    >
      <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: colors.surface.border }}>
        <Activity size={16} color={colors.accent.primary} className="animate-pulse" />
        <h3 
          style={{ 
            fontFamily: typography.family.display, 
            fontWeight: typography.weights.semibold,
            fontSize: '14px',
            color: colors.text.primary,
          }}
        >
          Realtime Operational Feed
        </h3>
      </div>
      
      <ul className="space-y-4 pt-2">
        {items.slice(0, 8).map((item, i) => (
          <framerMotion.li
            key={item.id ?? i}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: parseFloat(motion.duration.normal) / 1000, 
              delay: i * motion.stagger.fast / 1000,
              ease: [0.175, 0.885, 0.32, 1.275] // Custom snappy spring
            }}
            className="flex gap-4 relative group"
          >
            {/* Timeline trace line */}
            <div className="absolute left-[9px] top-5 bottom-[-16px] w-[1px]" style={{ background: colors.surface.borderGlow }} />
            
            {/* Action node */}
            <div 
              className="relative z-10 w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-shadow duration-300 group-hover:shadow-[0_0_10px_rgba(0,230,118,0.3)]"
              style={{ background: colors.surface.base, border: `2px solid ${colors.accent.primary}` }}
            >
              <div className="w-[6px] h-[6px] rounded-full" style={{ background: colors.accent.primary }} />
            </div>

            <div className="flex-1 flex flex-col pt-0.5 min-w-0">
              <div className="flex justify-between items-baseline gap-2">
                <span 
                  className="truncate"
                  style={{
                    fontFamily: typography.family.sans,
                    fontWeight: typography.weights.medium,
                    fontSize: '13px',
                    color: colors.text.primary
                  }}
                >
                  {item.title ?? item.description ?? 'Progression State Mutated'}
                </span>
                <span 
                  className="shrink-0"
                  style={{
                    fontFamily: typography.family.mono,
                    fontSize: '10px',
                    color: colors.text.tertiary
                  }}
                >
                  {item.occurredAt ? new Date(item.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Live'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                <GitMerge size={12} color={colors.text.secondary} />
                <span 
                  className="truncate"
                  style={{
                    fontFamily: typography.family.mono,
                    fontSize: '11px',
                    color: colors.text.secondary
                  }}
                >
                  Trace Lineage Indexed
                </span>
              </div>
            </div>
          </framerMotion.li>
        ))}
      </ul>
    </div>
  );
}
