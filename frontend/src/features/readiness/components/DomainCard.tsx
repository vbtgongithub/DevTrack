import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, AlertTriangle, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';

interface Props {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: React.ReactNode;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  momentum?: 'improving' | 'stagnating' | 'declining';
  confidence?: number;
  readinessDelta?: number | null;
  criticalBlocker?: string | null;
  nextAction?: string | null;
  summary?: string;
  index?: number;
}

export const DomainCard: React.FC<Props> = ({
  title, description, route, icon, accentColor,
  gradientFrom, gradientTo, momentum, confidence,
  readinessDelta, criticalBlocker, nextAction, summary, index = 0
}) => {
  const navigate = useNavigate();

  const getMomentumIcon = () => {
    switch (momentum) {
      case 'improving': return <TrendingUp size={12} className="text-emerald-400" />;
      case 'declining': return <TrendingDown size={12} className="text-rose-400" />;
      default: return <Minus size={12} className="text-amber-400" />;
    }
  };

  const getMomentumLabel = () => {
    switch (momentum) {
      case 'improving': return 'Accelerating';
      case 'declining': return 'Declining';
      default: return 'Steady';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => navigate(route)}
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-1"
      style={{
        background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
        boxShadow: `0 4px 24px ${accentColor}15, 0 1px 3px rgba(0,0,0,0.06)`,
      }}
    >
      {/* Hover glow overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at 80% 20%, ${accentColor}15, transparent 70%)` }}
      />

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}25` }}
            >
              <span style={{ color: accentColor }}>{icon}</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 group-hover:text-slate-900 transition-colors">{title}</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-sm">
            <ArrowUpRight size={14} style={{ color: accentColor }} />
          </div>
        </div>

        {/* Intelligence Summary */}
        {summary && (
          <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4 line-clamp-2">{summary}</p>
        )}

        {/* Metrics Strip */}
        <div className="flex flex-wrap items-center gap-3 mt-auto">
          {/* Momentum */}
          {momentum && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/60 backdrop-blur-sm">
              {getMomentumIcon()}
              <span className="text-[10px] font-bold text-slate-600">{getMomentumLabel()}</span>
            </div>
          )}

          {/* Confidence */}
          {confidence !== undefined && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/60 backdrop-blur-sm">
              <Sparkles size={10} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-slate-600">{confidence}%</span>
            </div>
          )}

          {/* Delta */}
          {readinessDelta !== null && readinessDelta !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-sm ${readinessDelta >= 0 ? 'bg-emerald-50/80' : 'bg-rose-50/80'}`}>
              <span className={`text-[10px] font-black ${readinessDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {readinessDelta >= 0 ? '+' : ''}{readinessDelta}
              </span>
            </div>
          )}

          {/* Critical Blocker */}
          {criticalBlocker && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50/80 backdrop-blur-sm">
              <AlertTriangle size={10} className="text-amber-500" />
              <span className="text-[10px] font-bold text-amber-700 truncate max-w-[120px]">{criticalBlocker}</span>
            </div>
          )}
        </div>

        {/* Next Action */}
        {nextAction && (
          <div className="mt-3 pt-3 border-t border-white/30">
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full" style={{ background: accentColor }} />
              <span className="text-[10px] font-semibold text-slate-500 truncate">Next: {nextAction}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
