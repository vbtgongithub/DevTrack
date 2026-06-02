import React from 'react';
import { PlayCircle, Cpu, FileJson, CheckCircle2 } from 'lucide-react';
import { useSessionState } from '../state/useSessionState';
import { motion } from 'framer-motion';

export const ATSReplayViewer: React.FC = () => {
  const { currentSession } = useSessionState();
  const isPending = currentSession?.stages.ats.status === 'pending';

  if (isPending) return null;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <PlayCircle size={16} className="text-[#8B5CF6]" />
        <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-100">Operational Replay Workspace</h2>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-6">
        <div className="flex flex-col gap-6 relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-6 bottom-6 w-px bg-slate-800 z-0" />

          {/* Step 1 */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex items-start gap-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center shrink-0 shadow-sm">
              <FileJson size={16} className="text-emerald-500" />
            </div>
            <div className="pt-1">
              <h4 className="text-sm font-bold text-slate-200">Text Extraction</h4>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-1">Parsed 4,203 characters</p>
              <div className="mt-2 p-2 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400">
                Found embedded fonts. Text layer intact.
              </div>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex items-start gap-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center shrink-0 shadow-sm">
              <Cpu size={16} className="text-emerald-500" />
            </div>
            <div className="pt-1">
              <h4 className="text-sm font-bold text-slate-200">Section Identification</h4>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-1">Identified 4 blocks</p>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="flex items-start gap-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 size={16} className="text-[#8B5CF6]" />
            </div>
            <div className="pt-1">
              <h4 className="text-sm font-bold text-slate-200">Semantic Matching</h4>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-1">Aligned with Backend roles</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
