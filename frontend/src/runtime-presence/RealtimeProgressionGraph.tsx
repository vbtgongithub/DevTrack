// frontend/src/runtime-presence/RealtimeProgressionGraph.tsx
// Signature visual experience: A cinematic, realtime intelligence graph.
// Combines Datadog-style trace streams, GitHub heatmaps, and neural glows.

import React, { useEffect, useState } from 'react';
import { motion as motionTokens, depth, colors, telemetry } from '../design-system/tokens/index.ts';

interface DataNode {
  id: string;
  x: number;
  y: number;
  active: boolean;
  intensity: number;
  platform: 'leetcode' | 'codeforces' | 'github' | 'codechef';
}

export const RealtimeProgressionGraph: React.FC = () => {
  const [nodes, setNodes] = useState<DataNode[]>([]);
  const [activeSignal, setActiveSignal] = useState(false);

  // Initialize a subtle neural grid layout
  useEffect(() => {
    const generated: DataNode[] = [];
    for (let i = 0; i < 40; i++) {
      generated.push({
        id: `node-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        active: Math.random() > 0.8,
        intensity: Math.random(),
        platform: ['leetcode', 'codeforces', 'github', 'codechef'][Math.floor(Math.random() * 4)] as any,
      });
    }
    setNodes(generated);

    // Simulate incoming SSE propagation waves
    const interval = setInterval(() => {
      setActiveSignal(prev => !prev);
      setNodes(prev => prev.map(n => ({
        ...n,
        active: Math.random() > 0.75, // Fluctuate active nodes
        intensity: Math.random(),
      })));
    }, parseInt(motionTokens.duration.ambient.replace('ms','')));

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="relative w-full h-[400px] rounded-xl overflow-hidden"
      style={{
        background: colors.surface.elevated,
        border: `1px solid ${colors.surface.border}`,
        boxShadow: depth.shadows.level2,
        backgroundImage: `linear-gradient(${telemetry.grid.color} 1px, transparent 1px), linear-gradient(90deg, ${telemetry.grid.color} 1px, transparent 1px)`,
        backgroundSize: `${telemetry.grid.size} ${telemetry.grid.size}`,
      }}
    >
      {/* Dynamic ambient background glow */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${activeSignal ? colors.accent.primary : colors.accent.secondary}40, transparent 70%)`,
        }}
      />

      {/* Nodes Map */}
      {nodes.map(node => (
        <div
          key={node.id}
          className="absolute rounded-full transition-all duration-[1200ms] pointer-events-none"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: node.active ? '12px' : '4px',
            height: node.active ? '12px' : '4px',
            background: node.active ? colors.accent.primary : colors.text.tertiary,
            boxShadow: node.active ? `0 0 ${node.intensity * 20}px ${colors.accent.primary}` : 'none',
            transform: `translate(-50%, -50%) scale(${node.active ? 1 + node.intensity : 1})`,
            transitionTimingFunction: motionTokens.spring.fluid,
            zIndex: node.active ? 10 : 1,
          }}
        />
      ))}

      {/* Line connections simulating telemetry lineage */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
        <defs>
          <linearGradient id="lineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.accent.primary} stopOpacity="0" />
            <stop offset="50%" stopColor={colors.accent.primary} stopOpacity="0.8" />
            <stop offset="100%" stopColor={colors.accent.primary} stopOpacity="0" />
          </linearGradient>
        </defs>
        {nodes.filter(n => n.active).map((node, i, arr) => {
          if (i === arr.length - 1) return null;
          const next = arr[i + 1];
          return (
            <line
              key={`link-${node.id}`}
              x1={`${node.x}%`}
              y1={`${node.y}%`}
              x2={`${next.x}%`}
              y2={`${next.y}%`}
              stroke="url(#lineGlow)"
              strokeWidth="1.5"
              className="transition-all duration-[1200ms] ease-out"
              style={{ transitionTimingFunction: motionTokens.spring.cinematic }}
            />
          );
        })}
      </svg>
      
      {/* Overlay vignette for depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 100px ${colors.surface.base}`,
        }}
      />
    </div>
  );
};
