import React from 'react';
import { useSessionState } from '../state/useSessionState';
import { Network, Loader2, Cloud } from 'lucide-react';
import { motion } from 'framer-motion';

export const EngineeringSignalViewer: React.FC = () => {
  const { currentSession } = useSessionState();
  const isProcessing = currentSession?.stages.intelligence.status === 'processing';
  const isPending = currentSession?.stages.intelligence.status === 'pending';

  if (isPending) return null;

  const report = currentSession?.reportData;
  const infraMaturity = report?.infrastructureMaturity;
  const roleAlignment = report?.roleAlignment;
  const credibilityAnalysis = report?.credibilityAnalysis;
  const tech = infraMaturity?.detectedTechnologies || [];
  const verifiedClaims = credibilityAnalysis?.verifiedClaims || [];
  const suspiciousClaims = credibilityAnalysis?.warnings || [];

  const getInfraRank = (maturity?: string) => {
    switch (maturity) {
      case 'orchestrated': return 'Advanced';
      case 'containerized': return 'Intermediate';
      case 'serverless': return 'Modern';
      default: return 'Basic';
    }
  };

  const getInferredFocus = () => {
    if (!roleAlignment) return 'Pending...';
    const roles = Object.entries(roleAlignment)
      .filter(([key]) => ['backend', 'platform', 'devops', 'ml', 'fullstack'].includes(key))
      .sort((a: any, b: any) => b[1] - a[1]);
    return roles[0] ? roles[0][0].charAt(0).toUpperCase() + roles[0][0].slice(1) : 'Unknown';
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network size={16} className="text-violet-600" />
          <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-900">Engineering Signals</h2>
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Depth Profiling</span>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 relative overflow-hidden">
        {isProcessing || !report ? (
          <div className="flex flex-col items-center justify-center py-20 gap-5 relative group">
            {/* Fancy Sweeping Background Gradient (using framer motion or tailwind pulse as a fallback) */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-fuchsia-50/50 to-transparent animate-pulse pointer-events-none" />
            
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-100 to-violet-100 border border-fuchsia-200 shadow-inner flex items-center justify-center"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-fuchsia-400 to-violet-400 opacity-20 blur-md" />
              <Loader2 className="w-8 h-8 text-fuchsia-600 relative z-10" />
            </motion.div>
            
            <div className="relative z-10 flex flex-col items-center gap-1.5 text-center">
              <p className="text-[11px] font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-600 to-violet-600">
                Extracting Technical Maturity...
              </p>
              <p className="text-xs font-medium text-slate-400">
                Profiling infrastructure patterns and deep skills
              </p>
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
            
            {/* Narrative Layer */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {report.finalVerdict}
              </p>
            </div>

            {/* Classification */}
            <div className="flex items-center gap-6 border-b border-slate-200 pb-5">
              <div className="flex-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inferred Focus</span>
                <p className="text-lg font-black text-slate-900 mt-1">{getInferredFocus()}</p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div className="flex-1 pl-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Infra Maturity</span>
                <p className="text-lg font-black text-violet-600 mt-1">{getInfraRank(infraMaturity?.deploymentMaturity)}</p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div className="flex-1 pl-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Credibility Score</span>
                <p className={`text-lg font-black mt-1 ${
                  (credibilityAnalysis?.overallScore || 0) > 80 ? 'text-emerald-600' :
                  (credibilityAnalysis?.overallScore || 0) > 50 ? 'text-amber-600' : 'text-rose-600'
                }`}>{credibilityAnalysis?.overallScore || 0}/100</p>
              </div>
            </div>

            {/* Evidence Tags */}
            <div className="flex flex-col gap-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Extracted Signals</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {verifiedClaims.map((claim: string, idx: number) => (
                  <div key={`vc-${idx}`} className="flex items-start gap-3 p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 hover:shadow-[0_4px_14px_-2px_rgba(16,185,129,0.08)] transition-all cursor-default">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <Cloud size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-[12px] font-bold text-slate-900 uppercase tracking-wider">Verified Engineering Claim</h4>
                      <p className="text-[11px] font-medium text-slate-600 mt-1 leading-relaxed">{claim}</p>
                    </div>
                  </div>
                ))}
                
                {suspiciousClaims.map((claim: string, idx: number) => (
                  <div key={`sc-${idx}`} className="flex items-start gap-3 p-4 bg-amber-50/80 rounded-xl border border-amber-200 hover:shadow-[0_4px_14px_-2px_rgba(245,158,11,0.08)] transition-all cursor-default">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Network size={16} className="text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-[12px] font-bold text-slate-900 uppercase tracking-wider">Unverified Claim</h4>
                      <p className="text-[11px] font-medium text-slate-600 mt-1 leading-relaxed">{claim}</p>
                    </div>
                  </div>
                ))}

                {tech.map((t: string, idx: number) => (
                  <div key={`t-${idx}`} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-[0_4px_14px_-2px_rgba(99,102,241,0.08)] transition-all cursor-default">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                      <Cloud size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="text-[12px] font-bold text-slate-900 uppercase tracking-wider">{t}</h4>
                      <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">Verifiable engineering telemetry detected in project descriptions.</p>
                    </div>
                  </div>
                ))}
                
                {(tech.length === 0 && verifiedClaims.length === 0 && suspiciousClaims.length === 0) && (
                  <p className="text-xs text-slate-500 font-medium italic">No advanced engineering signals detected.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
