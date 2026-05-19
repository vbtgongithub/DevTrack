// ============================================================================
// VelocityChart.tsx — Weekly task completion SVG bar chart
// ============================================================================
// Pure SVG — no chart library. Shows 8 weeks of task completion data.
// ============================================================================

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../../../components/shared/Icon';

interface WeekData {
  weekLabel: string;  // "May 12"
  count: number;
}

interface VelocityChartProps {
  data: WeekData[];
  className?: string;
}

const BAR_GAP = 6;
const BAR_RADIUS = 4;
const CHART_HEIGHT = 120;
const LABEL_HEIGHT = 24;

export const VelocityChart: React.FC<VelocityChartProps> = ({ data, className = '' }) => {
  const maxCount = useMemo(() => Math.max(...data.map(d => d.count), 1), [data]);
  const avgVelocity = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.count, 0);
    return data.length > 0 ? (total / data.length).toFixed(1) : '0';
  }, [data]);

  // Trend: compare last 4 weeks to first 4 weeks
  const trend = useMemo(() => {
    if (data.length < 4) return 'flat' as const;
    const mid = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, mid).reduce((s, d) => s + d.count, 0);
    const secondHalf = data.slice(mid).reduce((s, d) => s + d.count, 0);
    if (secondHalf > firstHalf * 1.1) return 'up' as const;
    if (secondHalf < firstHalf * 0.9) return 'down' as const;
    return 'flat' as const;
  }, [data]);

  const trendConfig = {
    up: { icon: 'arrow-trending-up' as const, color: 'text-emerald-500', label: 'Increasing' },
    down: { icon: 'arrow-trending-down' as const, color: 'text-rose-500', label: 'Decreasing' },
    flat: { icon: 'minus' as const, color: 'text-dt-textMuted', label: 'Steady' },
  };

  const barCount = data.length || 1;

  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-bold text-dt-text tracking-tight">Velocity</h3>
          <p className="text-[11px] text-dt-textMuted mt-0.5">Tasks completed per week</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Icon name={trendConfig[trend].icon} size={14} className={trendConfig[trend].color} />
            <span className={`text-[11px] font-semibold ${trendConfig[trend].color}`}>{trendConfig[trend].label}</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100">
            <span className="text-[11px] font-bold text-dt-text tabular-nums">{avgVelocity}</span>
            <span className="text-[10px] text-dt-textMuted ml-1">avg/week</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <svg
        width="100%"
        viewBox={`0 0 ${barCount * 40 + BAR_GAP * (barCount - 1)} ${CHART_HEIGHT + LABEL_HEIGHT}`}
        className="overflow-visible"
        role="img"
        aria-label={`Velocity chart showing ${data.length} weeks of task completion`}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1="0"
            y1={CHART_HEIGHT * (1 - pct)}
            x2={barCount * 40 + BAR_GAP * (barCount - 1)}
            y2={CHART_HEIGHT * (1 - pct)}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
        ))}

        {/* Bars */}
        {data.map((week, i) => {
          const barWidth = 40;
          const x = i * (barWidth + BAR_GAP);
          const barHeight = (week.count / maxCount) * (CHART_HEIGHT - 8);
          const y = CHART_HEIGHT - barHeight;
          const isLast = i === data.length - 1;

          return (
            <g key={week.weekLabel}>
              {/* Bar */}
              <motion.rect
                x={x + 4}
                y={y}
                width={barWidth - 8}
                height={Math.max(barHeight, 2)}
                rx={BAR_RADIUS}
                fill={isLast ? '#7C5CFC' : '#E2E8F0'}
                initial={{ height: 0, y: CHART_HEIGHT }}
                animate={{ height: Math.max(barHeight, 2), y }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* Value label on hover */}
              {week.count > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-dt-textSecondary opacity-0 hover:opacity-100 transition-opacity"
                  style={{ fontSize: '10px', fontWeight: 700 }}
                >
                  {week.count}
                </text>
              )}

              {/* Week label */}
              <text
                x={x + barWidth / 2}
                y={CHART_HEIGHT + 16}
                textAnchor="middle"
                className="fill-dt-textMuted"
                style={{ fontSize: '9px', fontWeight: 600 }}
              >
                {week.weekLabel}
              </text>
            </g>
          );
        })}

        {/* Trend line */}
        {data.length >= 3 && (
          <motion.polyline
            points={data.map((week, i) => {
              const barWidth = 40;
              const x = i * (barWidth + BAR_GAP) + barWidth / 2;
              const y = CHART_HEIGHT - (week.count / maxCount) * (CHART_HEIGHT - 8);
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#7C5CFC"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 3"
            opacity={0.4}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
          />
        )}
      </svg>

      {/* Empty state */}
      {data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8">
          <Icon name="chart-bar" size={24} className="text-dt-textMuted/30 mb-2" />
          <p className="text-[12px] text-dt-textMuted">No task data yet</p>
        </div>
      )}
    </div>
  );
};

export default VelocityChart;
