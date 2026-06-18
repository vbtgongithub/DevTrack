import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface Blocker {
  id: string;
  label: string;
  reason?: string;
}

interface Props {
  blockers: Blocker[];
}

export const ActiveBlockersPanel: React.FC<Props> = ({ blockers }) => {
  if (!blockers || blockers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/60 border border-amber-200/50 p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
          <AlertTriangle size={16} className="text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Active Blockers</h3>
          <p className="text-[10px] font-medium text-amber-600 uppercase tracking-wider">Highest-impact bottlenecks</p>
        </div>
      </div>

      <div className="space-y-2">
        {blockers.map((blocker, i) => (
          <motion.div
            key={blocker.id || i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/70 border border-amber-100/60 group hover:bg-white transition-colors"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-slate-700">{blocker.label}</span>
              {blocker.reason && (
                <p className="text-[10px] text-slate-500 mt-0.5">{blocker.reason}</p>
              )}
            </div>
            <ArrowRight size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
