import React from 'react';
import { ConfidenceIndicator } from './trust/ConfidenceIndicator';
import { Target, Activity, Zap, FileText } from 'lucide-react';

export const ReadinessIntelligenceWorkspace: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-[#FAFAFC] text-slate-800">
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800">Readiness Intelligence Workspace</h1>
        <p className="text-slate-500 mt-1 font-medium">
          Your active engineering progression, backed by deterministic evidence.
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          {/* Engineering Evolution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-indigo-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Engineering Evolution</h2>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50">
                <div className="w-1.5 rounded-full bg-emerald-500"></div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-800">Backend System Optimization</h3>
                  <p className="text-xs text-slate-500 mt-1">Evidence: 3 merged PRs, reduced latency by 45%.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">+15% Readiness</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recommendation Intelligence */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Recommendation Intelligence</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-sm">High Impact Action</span>
                  <ConfidenceIndicator score={92} evidenceCount={4} size="sm" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">Implement Rate Limiting on Public APIs</h3>
                <p className="text-xs text-slate-600">Your recent projects handle public traffic but lack rate limiting. Adding this aligns with Senior Backend patterns.</p>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          {/* Recruiter Projection */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-rose-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">ATS Projection</h2>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-600">Match Rate</span>
                <span className="text-sm font-black text-rose-600">78%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '78%' }}></div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                Strong alignment with <strong>Backend Engineer</strong> roles. Missing explicit mentions of <strong>CI/CD</strong> pipelines.
              </p>
            </div>
          </div>
          
          {/* Confidence Matrix */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Confidence Matrix</h2>
            </div>
            <ConfidenceIndicator score={88} evidenceCount={14} size="md" />
          </div>
        </aside>
      </div>
    </div>
  );
};
