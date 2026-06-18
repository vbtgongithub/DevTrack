import React from 'react';
import { useSessionState } from '../state/useSessionState';
import { Activity, ShieldAlert, Cpu } from 'lucide-react';

export const ResumeIntelligenceHero: React.FC = () => {
  const { currentSession } = useSessionState();
  const report = currentSession?.reportData;
  const exec = report?.executiveSummary;
  const isPending = !currentSession || !report;

  if (isPending) return null;

  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 p-6">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] text-[10px] font-bold uppercase tracking-widest">
              Intelligence Audit Complete
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">{currentSession.fileInfo.fileName}</h1>
          <p className="text-sm font-medium text-slate-400 mt-1 capitalize">
            {exec.engineeringMaturity} Engineering Profile • {exec.atsSurvivability} ATS Compatibility
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Key Metrics */}
          <div className="flex flex-col gap-1 pr-4 border-r border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Cpu size={12} /> ATS Alignment
            </span>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-black text-emerald-400 leading-none">
                {report.atsAnalysis.atsScore}
              </span>
              <span className="text-sm font-bold text-slate-500 mb-0.5">/100</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 pr-4 border-r border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert size={12} /> Trust Score
            </span>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-black text-amber-400 leading-none">
                {report.credibilityAnalysis.overallScore}
              </span>
              <span className="text-sm font-bold text-slate-500 mb-0.5">/100</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Activity size={12} /> Maturity
            </span>
            <div className="flex items-end gap-1">
              <span className="text-xl font-black text-[#8B5CF6] leading-none capitalize">
                {exec.engineeringMaturity}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
