// frontend/src/runtime-presence/DormantIntelligenceState.tsx
// Cinematic replacement for generic empty states.
// Visualizes an active, intelligent background system searching for signals.

import React from 'react';
import { colors, typography, telemetry } from '../design-system/tokens/index.ts';

interface DormantIntelligenceStateProps {
  label?: string;
  sublabel?: string;
}

export const DormantIntelligenceState: React.FC<DormantIntelligenceStateProps> = ({ 
  label = "AWAITING TELEMETRY", 
  sublabel = "Initializing neural event scan across all platform channels." 
}) => {
  return (
    <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden rounded-xl border border-dashed"
      style={{
        borderColor: colors.surface.border,
        backgroundColor: colors.surface.base,
        backgroundImage: `linear-gradient(${telemetry.grid.color} 1px, transparent 1px), linear-gradient(90deg, ${telemetry.grid.color} 1px, transparent 1px)`,
        backgroundSize: `${telemetry.grid.size} ${telemetry.grid.size}`,
      }}
    >
      {/* Animated Radar/Scanner overlay */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 270deg, ${colors.accent.primary} 360deg)`,
          animation: 'spin 4s linear infinite',
        }}
      />

      {/* Orbiting runtime nodes container */}
      <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
        {/* Core processor glow */}
        <div 
          className="w-12 h-12 rounded-full absolute"
          style={{
            background: colors.surface.elevated,
            border: `1px solid ${colors.surface.border}`,
            boxShadow: `0 0 40px ${colors.accent.primaryDim}`,
          }}
        >
          <div 
            className="w-full h-full rounded-full animate-ping opacity-50"
            style={{
              background: colors.accent.primaryDim,
              animationDuration: '3s',
            }}
          />
        </div>
        
        {/* Orbit ring 1 */}
        <div className="absolute w-24 h-24 rounded-full border border-gray-800 animate-spin" style={{ animationDuration: '8s' }}>
          <div className="w-2 h-2 rounded-full absolute -top-1 left-1/2 -translate-x-1/2" style={{ background: colors.accent.secondary }} />
        </div>

        {/* Orbit ring 2 */}
        <div className="absolute w-32 h-32 rounded-full border border-gray-800 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }}>
          <div className="w-1.5 h-1.5 rounded-full absolute top-1/2 -right-0.5 -translate-y-1/2" style={{ background: colors.text.secondary }} />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md px-6">
        <h3 
          className="mb-2"
          style={{
            fontFamily: typography.family.mono,
            fontWeight: typography.weights.bold,
            color: colors.text.primary,
            fontSize: '13px',
            letterSpacing: typography.tracking.widest,
            textTransform: 'uppercase'
          }}
        >
          {label}
        </h3>
        <p
          style={{
            fontFamily: typography.family.sans,
            color: colors.text.secondary,
            fontSize: '14px',
            lineHeight: 1.6,
          }}
        >
          {sublabel}
        </p>
      </div>

      {/* Deep vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 60px ${colors.surface.base}`,
        }}
      />
    </div>
  );
};
