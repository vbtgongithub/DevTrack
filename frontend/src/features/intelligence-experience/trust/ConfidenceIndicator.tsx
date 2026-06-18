import React from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface ConfidenceIndicatorProps {
  score: number; // 0 to 100
  evidenceCount: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  score,
  evidenceCount,
  label = 'System Confidence',
  size = 'md',
}) => {
  const getConfidenceLevel = () => {
    if (score >= 85) return { level: 'High', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 };
    if (score >= 60) return { level: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Info };
    return { level: 'Low', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', icon: AlertTriangle };
  };

  const { level, color, bg, border, icon: Icon } = getConfidenceLevel();

  const sizeClasses = {
    sm: 'p-2 text-xs',
    md: 'p-3 text-sm',
    lg: 'p-4 text-base',
  };

  return (
    <div className={`flex items-start gap-3 rounded-xl border ${bg} ${border} ${sizeClasses[size]} transition-all hover:shadow-sm`}>
      <Icon className={`shrink-0 ${color} ${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-slate-800">{label}</span>
          <span className={`font-bold ${color}`}>{score}%</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
          <span>{level} Confidence</span>
          <span>{evidenceCount} Evidence Points</span>
        </div>
      </div>
    </div>
  );
};
