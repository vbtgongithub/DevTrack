import { motion as framerMotion } from 'framer-motion';
import { Activity, Radio, Cpu } from 'lucide-react';
import { typography, colors, depth } from '../../design-system/tokens/index.ts';
import { RealtimeProgressionGraph } from '../../runtime-presence/RealtimeProgressionGraph.tsx';

interface MomentumHeroProps {
  streak: number;
  atRisk?: boolean;
  comeback?: boolean;
}

export function MomentumHero({ streak, atRisk, comeback }: MomentumHeroProps) {
  const headline = comeback 
    ? 'SYSTEM AWAKE' 
    : atRisk 
      ? 'SYNCHRONIZATION AT RISK' 
      : 'OPERATIONAL MOMENTUM';
      
  const subline = comeback
    ? 'Awaiting first telemetry signal to resume sequence.'
    : atRisk
      ? 'Dormancy detected. Sequence degradation imminent without new solve data.'
      : 'Runtime progression sequence stable and compounding.';

  return (
    <div 
      className="relative w-full rounded-2xl overflow-hidden flex flex-col md:flex-row gap-6 p-1"
      style={{
        background: colors.surface.elevated,
        border: `1px solid ${colors.surface.border}`,
        boxShadow: depth.shadows.level2,
      }}
    >
      {/* 
        Signature Visual Centerpiece
        The Realtime Progression Intelligence Graph takes up the left/top side
      */}
      <div className="w-full md:w-3/5 h-[300px] md:h-[400px] relative rounded-xl overflow-hidden">
        <RealtimeProgressionGraph />
        
        {/* Overlay Badges */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md"
            style={{ 
              background: 'rgba(10, 10, 11, 0.6)', 
              border: `1px solid ${colors.surface.borderGlow}`
            }}
          >
            <Radio size={12} color={colors.accent.primary} className="animate-pulse" />
            <span style={{ fontFamily: typography.family.mono, fontSize: '10px', color: colors.accent.primary, letterSpacing: typography.tracking.widest }}>
              LIVE MESH
            </span>
          </div>
        </div>
      </div>

      {/* 
        Intelligence Dashboard Surface
      */}
      <div className="w-full md:w-2/5 p-6 md:py-8 md:pr-8 flex flex-col justify-center">
        <framerMotion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.175, 0.885, 0.32, 1.275] }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={14} color={colors.text.secondary} />
            <span 
              style={{
                fontFamily: typography.family.mono,
                fontSize: '11px',
                color: colors.text.secondary,
                letterSpacing: typography.tracking.widest,
                textTransform: 'uppercase'
              }}
            >
              System Status
            </span>
          </div>

          <h1 
            className="text-3xl font-bold mb-3 tracking-tight"
            style={{ 
              fontFamily: typography.family.display,
              color: colors.text.primary,
              letterSpacing: typography.tracking.tight
            }}
          >
            {headline}
          </h1>
          
          <p 
            className="text-sm mb-10 leading-relaxed max-w-sm"
            style={{
              fontFamily: typography.family.sans,
              color: colors.text.tertiary
            }}
          >
            {subline}
          </p>

          {/* Operational Metrics Sub-Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Streak Card */}
            <div 
              className="p-4 rounded-xl relative overflow-hidden group transition-all duration-500"
              style={{
                background: colors.surface.base,
                border: `1px solid ${streak > 0 ? colors.accent.primaryDim : colors.surface.border}`,
              }}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at top right, ${colors.accent.primary}, transparent 70%)` }}
              />
              <span style={{ fontFamily: typography.family.mono, fontSize: '10px', color: colors.text.tertiary, letterSpacing: typography.tracking.widest }}>
                CURRENT STREAK
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span style={{ fontFamily: typography.family.display, fontSize: '32px', fontWeight: 700, color: colors.text.primary }}>
                  {streak}
                </span>
                <span style={{ fontFamily: typography.family.mono, fontSize: '12px', color: colors.text.secondary }}>
                  DAYS
                </span>
              </div>
            </div>

            {/* Network State Card */}
            <div 
              className="p-4 rounded-xl relative overflow-hidden group transition-all duration-500"
              style={{
                background: colors.surface.base,
                border: `1px solid ${colors.surface.border}`,
              }}
            >
              <span style={{ fontFamily: typography.family.mono, fontSize: '10px', color: colors.text.tertiary, letterSpacing: typography.tracking.widest }}>
                ORCHESTRATION
              </span>
              <div className="flex items-center gap-2 mt-4">
                <Activity size={16} color={colors.accent.secondary} />
                <span style={{ fontFamily: typography.family.display, fontSize: '14px', fontWeight: 600, color: colors.accent.secondary }}>
                  STABLE
                </span>
              </div>
            </div>
          </div>
        </framerMotion.div>
      </div>
    </div>
  );
}
