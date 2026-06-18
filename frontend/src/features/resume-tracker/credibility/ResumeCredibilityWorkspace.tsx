import React from 'react';
import { useSessionState } from '../state/useSessionState';
import { AlertOctagon, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const ResumeCredibilityWorkspace: React.FC = () => {
  const { currentSession } = useSessionState();

  const isProcessing = currentSession?.stages.credibility.status === 'processing';
  const isPending = currentSession?.stages.credibility.status === 'pending';

  if (isPending) return null;

  const recState = currentSession?.recommendationState;
  const warnings = recState?.warnings || [];

  const getNarrative = () => {
    if (warnings.length > 0) {
      return `Recruiter trust is currently impacted by ${warnings.length} identified credibility gaps. Addressing these will significantly increase your engineering credibility score.`;
    }
    return "Your engineering credibility is high. No significant metric-to-claim gaps detected in your active descriptions.";
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <AlertOctagon size={16} className="text-slate-800" />
        <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-800">Recruiter Trust Audit</h2>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        {isProcessing ? (
           <div className="flex flex-col items-center justify-center py-6 gap-3">
           <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
           <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verifying Claims...</p>
         </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
            
            {/* Narrative Layer */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {getNarrative()}
              </p>
            </div>

            {/* Dynamic Credibility Blockers */}
            {warnings.map((warning, idx) => (
              <div key={idx} className={`p-4 rounded-xl border flex flex-col gap-2 ${idx === 0 ? 'bg-amber-50 border-amber-200/50' : 'bg-slate-50/50 border-slate-150'}`}>
                <div className="flex items-start gap-3">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-black ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Credibility Risk</h4>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed mt-1">
                      {warning}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {warnings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trust Verified</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
