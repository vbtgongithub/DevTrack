// ============================================================================
// EnhancedInsightsCard.tsx — Momentum Intelligence Dashboard Card
// ============================================================================
// Displays: momentum score gauge, trend sparklines, burnout risk indicator,
// peak productivity windows, and actionable recovery suggestions.
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, TrendingUp, AlertCircle, ArrowRight,
  BrainCircuit, Activity, Clock, Target, Zap,
  ArrowUpRight, ArrowDownRight, Minus, Shield, Sun,
} from 'lucide-react';
import { useMomentumIntelligence } from '../../hooks/useMomentumIntelligence';
import { trackInsightView, trackSuggestionClick } from '../../lib/telemetry/analytics';
import type { ProductivityTrend, RecoverySuggestion } from '../../services/observationService';

// ---------------------------------------------------------------------------
// Momentum Gauge
// ---------------------------------------------------------------------------

const MomentumGauge: React.FC<{ score: number; trend: string }> = ({ score, trend }) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const trendConfig: Record<string, { color: string; bg: string; label: string }> = {
    surging: { color: '#10B981', bg: 'bg-emerald-500/10', label: 'Surging' },
    rising: { color: '#3B82F6', bg: 'bg-blue-500/10', label: 'Rising' },
    stable: { color: '#8B5CF6', bg: 'bg-violet-500/10', label: 'Stable' },
    declining: { color: '#F59E0B', bg: 'bg-amber-500/10', label: 'Declining' },
    critical: { color: '#EF4444', bg: 'bg-rose-500/10', label: 'Critical' },
  };

  const config = trendConfig[trend] || trendConfig.stable;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[130px] h-[130px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
          <motion.circle
            cx="60" cy="60" r={radius}
            fill="transparent"
            stroke={config.color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-black text-slate-800 tabular-nums leading-none"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {score}
          </motion.span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Score</span>
        </div>
      </div>
      <div className={`px-3 py-1 rounded-full ${config.bg} border border-${trend === 'surging' ? 'emerald' : trend === 'critical' ? 'rose' : 'slate'}-200/30`}>
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: config.color }}>
          {config.label}
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Breakdown Bar
// ---------------------------------------------------------------------------

const BreakdownBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="flex items-center gap-3">
    <span className="text-[11px] font-bold text-slate-500 w-[90px] truncate">{label}</span>
    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
    <span className="text-[11px] font-black text-slate-700 w-8 text-right tabular-nums">{value}</span>
  </div>
);

// ---------------------------------------------------------------------------
// Trend Item
// ---------------------------------------------------------------------------

const TrendItem: React.FC<{ trend: ProductivityTrend }> = ({ trend }) => {
  const DirectionIcon = trend.direction === 'up' ? ArrowUpRight : trend.direction === 'down' ? ArrowDownRight : Minus;
  const color = trend.direction === 'up' ? 'text-emerald-500' : trend.direction === 'down' ? 'text-rose-500' : 'text-slate-400';
  const bg = trend.direction === 'up' ? 'bg-emerald-50' : trend.direction === 'down' ? 'bg-rose-50' : 'bg-slate-50';

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${bg} border border-slate-100`}>
      <span className="text-[11px] font-bold text-slate-600">{trend.metric}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[12px] font-black text-slate-800 tabular-nums">{trend.current}</span>
        <DirectionIcon size={14} className={color} />
        <span className={`text-[10px] font-bold ${color} tabular-nums`}>
          {trend.changePercent > 0 ? '+' : ''}{trend.changePercent}%
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Recovery Suggestion Item
// ---------------------------------------------------------------------------

const SuggestionItem: React.FC<{ suggestion: RecoverySuggestion }> = ({ suggestion }) => {
  const iconMap: Record<string, React.ReactNode> = {
    solve_problem: <Target size={16} className="text-violet-500" />,
    focus_session: <Clock size={16} className="text-blue-500" />,
    review_topic: <BrainCircuit size={16} className="text-amber-500" />,
    take_break: <Sun size={16} className="text-emerald-500" />,
  };

  const handleClick = () => {
    trackSuggestionClick(suggestion.id, suggestion.actionType);
  };

  return (
    <div 
      onClick={handleClick}
      className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-dt-primary/20 hover:shadow-sm transition-all duration-300 group/suggestion cursor-pointer"
    >
      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
        {iconMap[suggestion.actionType] || <Sparkles size={16} className="text-dt-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="text-[12px] font-black text-slate-800 tracking-tight">{suggestion.title}</h5>
        <p className="text-[11px] font-medium text-slate-400 leading-relaxed mt-0.5">{suggestion.description}</p>
      </div>
      <ArrowRight size={14} className="text-slate-300 group-hover/suggestion:text-dt-primary group-hover/suggestion:translate-x-0.5 transition-all mt-1 shrink-0" />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const EnhancedInsightsCard: React.FC = () => {
  const {
    momentumScore,
    trends,
    burnoutRisk,
    peakWindows,
    recoverySuggestions,
    loading,
    error,
  } = useMomentumIntelligence();

  React.useEffect(() => {
    if (!loading && momentumScore) {
      trackInsightView('momentum_intelligence', 'momentum_score');
    }
  }, [loading, momentumScore]);

  return (
    <div
      className="dt-card p-6 bg-white rounded-[32px] border border-slate-200 shadow-dt-floating hover:shadow-dt-card-hover transition-all duration-700 relative overflow-hidden flex flex-col h-full"
      style={{ animation: 'dtFadeIn 800ms cubic-bezier(0.16,1,0.3,1) 300ms both' }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-dt-primary/5 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dt-primary/20 to-dt-primary/5 flex items-center justify-center border border-dt-primary/10 shadow-sm">
            <BrainCircuit className="text-dt-primary" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tighter">Momentum Intelligence</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Behavioral Analysis Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
          <Activity size={14} className="text-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative z-10">
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200" />
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                </div>
                <div className="h-3 w-full bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-3">
              <AlertCircle size={24} className="text-rose-400" />
            </div>
            <p className="text-sm text-slate-500 font-bold">Intelligence Engine Offline</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">We're recalibrating. Check back shortly.</p>
          </div>
        ) : !momentumScore ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 border border-slate-100">
              <Sparkles size={24} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-500 font-bold">Awaiting Intel...</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">Keep coding and syncing to unlock analysis.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Score + Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <MomentumGauge score={momentumScore.overall} trend={momentumScore.trend} />
              <div className="space-y-2.5">
                <BreakdownBar label="Activity" value={momentumScore.breakdown.activityFrequency} color="#3B82F6" />
                <BreakdownBar label="XP Velocity" value={momentumScore.breakdown.xpVelocity} color="#8B5CF6" />
                <BreakdownBar label="Streak" value={momentumScore.breakdown.streakHealth} color="#10B981" />
                <BreakdownBar label="Focus" value={momentumScore.breakdown.focusConsistency} color="#F59E0B" />
                <BreakdownBar label="Diversity" value={momentumScore.breakdown.problemDiversity} color="#EC4899" />
              </div>
            </div>

            {/* Momentum Message */}
            <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[12px] font-bold text-slate-600 leading-relaxed">{momentumScore.message}</p>
            </div>

            {/* Burnout Risk + Peak Window */}
            <div className="grid grid-cols-2 gap-3">
              {burnoutRisk && (
                <div className={`p-3 rounded-xl border ${
                  burnoutRisk.riskLevel === 'none' || burnoutRisk.riskLevel === 'low'
                    ? 'bg-emerald-50/50 border-emerald-100'
                    : burnoutRisk.riskLevel === 'moderate'
                    ? 'bg-amber-50/50 border-amber-100'
                    : 'bg-rose-50/50 border-rose-100'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield size={14} className={
                      burnoutRisk.riskLevel === 'none' || burnoutRisk.riskLevel === 'low'
                        ? 'text-emerald-500'
                        : burnoutRisk.riskLevel === 'moderate'
                        ? 'text-amber-500'
                        : 'text-rose-500'
                    } />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Burnout Risk</span>
                  </div>
                  <p className="text-[13px] font-black text-slate-800 capitalize">{burnoutRisk.riskLevel}</p>
                </div>
              )}

              {peakWindows?.[0] && peakWindows[0].confidence > 0 && (
                <div className="p-3 rounded-xl border bg-blue-50/50 border-blue-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Peak Window</span>
                  </div>
                  <p className="text-[13px] font-black text-slate-800">{peakWindows[0].label}</p>
                </div>
              )}
            </div>

            {/* Trends */}
            {trends.length > 0 && (
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                  <TrendingUp size={12} /> 7-Day Trends
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {trends.slice(0, 4).map((trend, i) => (
                    <TrendItem key={i} trend={trend} />
                  ))}
                </div>
              </div>
            )}

            {/* Recovery Suggestions */}
            {recoverySuggestions.length > 0 && (
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                  <Zap size={12} /> Recommended Actions
                </h4>
                <div className="space-y-2">
                  {recoverySuggestions.slice(0, 3).map((s) => (
                    <SuggestionItem key={s.id} suggestion={s} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
