import React from 'react';
import { useSessionState } from '../state/useSessionState';
import { GitCommit, TrendingUp } from 'lucide-react';

export const ResumeEvolutionTimeline: React.FC = () => {
  const { currentSession } = useSessionState();
  const report = currentSession?.reportData;
  const evolution = report?.evolution;
  const isCompleted = currentSession?.stages.recommendations.status === 'success';

  if (!isCompleted || !report) return null;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <TrendingUp size={16} className="text-emerald-500" />
        <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-100">Resume Evolution</h2>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-6">
        <div className="flex flex-col gap-5 relative">
          <div className="absolute left-[11px] top-3 bottom-3 w-px bg-slate-800 z-0" />

          {/* Current Version */}
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-6 h-6 rounded-full bg-slate-950 border-2 border-emerald-500/50 flex items-center justify-center shrink-0 mt-0.5">
              <GitCommit size={12} className="text-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-200">Current Intelligence</span>
                <span className="px-2 py-0.5 rounded bg-emerald-900/30 text-[10px] font-bold text-emerald-400 uppercase tracking-wider border border-emerald-800/50">
                  ATS {report.atsAnalysis.atsScore}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 mt-1.5">{report.finalVerdict.slice(0, 100)}...</p>
            </div>
          </div>

          {/* Historical Delta (if exists) */}
          {evolution ? (
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-6 h-6 rounded-full bg-slate-950 border-2 border-indigo-500/50 flex items-center justify-center shrink-0 mt-0.5">
                <GitCommit size={12} className="text-indigo-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-200">Growth Profile</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${evolution.atsDelta >= 0 ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' : 'bg-rose-900/30 text-rose-400 border-rose-800/50'}`}>
                    {evolution.atsDelta >= 0 ? '+' : ''}{evolution.atsDelta} ATS
                  </span>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  {evolution.improvements.map((imp: string, idx: number) => (
                    <p key={idx} className="text-[11px] font-medium text-slate-500 leading-relaxed italic border-l border-indigo-500/30 pl-2">
                      {imp}
                    </p>
                  ))}
                  {evolution.infraDelta > 0 && (
                    <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mt-1">
                      +{evolution.infraDelta} INFRA MODULES DETECTED
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-6 h-6 rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                <GitCommit size={12} className="text-slate-600" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Baseline Established</span>
                <p className="text-[11px] font-medium text-slate-600 mt-1">First intelligence snapshot recorded. Delta tracking active.</p>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};
