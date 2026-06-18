import React from 'react';
import { useSessionState } from '../state/useSessionState';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../../../lib/design-system/tokens.css';

export const PartialIntelligenceDegradationLayer: React.FC = () => {
  const { currentSession } = useSessionState();

  if (!currentSession) return null;

  const { stages } = currentSession;

  const hasErrors = Object.values(stages).some(s => s.status === 'failed' || s.status === 'partial');

  if (!hasErrors) return null;

  return (
    <div className="w-full bg-rose-950/20 border-y border-rose-900/50 p-4 flex flex-col gap-3">
      <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-3">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-[11px] uppercase tracking-widest">
          <AlertCircle size={14} />
          <span>Partial Intelligence Degradation</span>
        </div>

        <p className="text-[11px] text-slate-400 font-medium max-w-2xl leading-relaxed">
          The extraction pipeline encountered non-critical failures in certain intelligence layers.
          Real-time insights are currently being derived from a partial data state.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-1">
          {Object.entries(stages).map(([stageName, stageData]) => {
            if (stageName === 'upload') return null;

            let icon = <Loader2 size={12} className="animate-spin text-slate-600" />;
            let color = 'text-slate-500';
            let bg = 'bg-slate-900 border-slate-800';

            if (stageData.status === 'success') {
              icon = <CheckCircle2 size={12} className="text-emerald-500" />;
              color = 'text-emerald-400';
              bg = 'bg-emerald-950/10 border-emerald-900/30';
            } else if (stageData.status === 'failed' || stageData.status === 'partial') {
              icon = <AlertCircle size={12} className="text-rose-500" />;
              color = 'text-rose-400';
              bg = 'bg-rose-950/20 border-rose-900/40';
            }

            return (
              <div key={stageName} className={cn("flex items-center justify-between p-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider", bg, color)}>
                <div className="flex items-center gap-2">
                  {icon}
                  <span>{stageName}</span>
                </div>
                {stageData.status === 'failed' && (
                  <button className="p-1 hover:bg-rose-500/20 rounded transition-colors">
                    <RefreshCw size={10} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
