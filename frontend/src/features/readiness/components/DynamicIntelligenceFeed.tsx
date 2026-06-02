import React from 'react';
import { motion } from 'framer-motion';
import type { ReadinessSnapshot } from '../../../services/readinessService';

interface Props {
  data: ReadinessSnapshot;
}

export const DynamicIntelligenceFeed: React.FC<Props> = ({ data }) => {
  if (!data.intelligenceFeed || data.intelligenceFeed.length === 0) return null;

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200/60">
      <h3 className="text-xl font-bold text-slate-800 mb-6">Intelligence Feed</h3>
      <div className="flex flex-col gap-6">
        {data.intelligenceFeed.map((item, i) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-5 rounded-2xl border ${getTypeStyles(item.type)}`}
          >
            <div className="flex justify-between items-start mb-3">
               <p className="font-semibold text-slate-800 text-lg">{item.message}</p>
               <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-4">
                 {new Date(item.timestamp).toLocaleDateString()}
               </span>
            </div>
            {item.evidenceChain && item.evidenceChain.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.evidenceChain.map((ev, idx) => (
                  <span key={idx} className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${getEvidenceStyles(ev.type)}`}>
                    {ev.type === 'positive' && (
                       <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                       </svg>
                    )}
                    {ev.type === 'negative' && (
                       <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                       </svg>
                    )}
                    {ev.type === 'neutral' && (
                       <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                       </svg>
                    )}
                    {ev.label}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

function getTypeStyles(type: string) {
  switch(type) {
    case 'achievement': return 'bg-emerald-50/50 border-emerald-100';
    case 'warning': return 'bg-amber-50/50 border-amber-100';
    case 'action_needed': return 'bg-indigo-50/50 border-indigo-100';
    default: return 'bg-slate-50 border-slate-100';
  }
}

function getEvidenceStyles(type: string) {
   switch(type) {
    case 'positive': return 'bg-emerald-100 text-emerald-700';
    case 'negative': return 'bg-amber-100 text-amber-700';
    default: return 'bg-slate-200 text-slate-600';
  }
}
