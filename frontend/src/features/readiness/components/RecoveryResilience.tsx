import React from 'react';
import { ShieldAlert, RefreshCcw, ShieldCheck } from 'lucide-react';
import type { RetentionContext, BurnoutRiskAssessment } from '../../../services/observationService';

interface Props {
  retention: RetentionContext;
  burnoutRisk: BurnoutRiskAssessment;
}

export const RecoveryResilience: React.FC<Props> = ({ retention, burnoutRisk }) => {
  const isAtRisk = burnoutRisk.riskLevel === 'high' || burnoutRisk.riskLevel === 'critical';
  const hasComeback = retention.comebackReward?.eligible;

  return (
    <div className="dt-card-base bg-white/60 backdrop-blur-3xl p-6 lg:p-8 flex flex-col justify-center">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">Recovery & Resilience</h3>
        <p className="text-xs text-slate-500 font-medium">Emotional intelligence & burnout protection</p>
      </div>

      <div className="space-y-4">
        {isAtRisk ? (
          <div className="bg-rose-50/80 border border-rose-100 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-800 tracking-tight mb-1">Burnout Warning</h4>
              <p className="text-xs text-rose-600/80 font-medium leading-relaxed">
                {burnoutRisk.suggestion || "Your execution velocity is unsustainable right now. DevTrack recommends taking a 24-hour cognitive rest. Your streaks are protected."}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-800 tracking-tight mb-1">Sustainable Pacing</h4>
              <p className="text-xs text-emerald-600/80 font-medium leading-relaxed">
                You are operating at a healthy velocity. Burnout risk is currently calculated at {Math.round(burnoutRisk.score * 100)}%.
              </p>
            </div>
          </div>
        )}

        {hasComeback && (
          <div className="bg-violet-50/80 border border-violet-100 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
              <RefreshCcw size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-violet-800 tracking-tight mb-1">Comeback Activated</h4>
              <p className="text-xs text-violet-600/80 font-medium leading-relaxed">
                {retention.comebackReward?.message || "You've successfully returned from a break. Resilience is more important than perfect streaks."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
