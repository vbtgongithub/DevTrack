import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import type { ReadinessSnapshot } from '../../../services/readinessService';

interface Props {
  data: ReadinessSnapshot;
}

export const AdaptiveRoadmapUI: React.FC<Props> = ({ data }) => {
  const roadmapNodes = data.adaptiveRoadmap || [];
  
  // Group nodes by priority
  const blockers = roadmapNodes.filter(n => n.isPrioritizedBlocker);
  const others = roadmapNodes.filter(n => !n.isPrioritizedBlocker).slice(0, 6);

  if (roadmapNodes.length === 0) return null;

  return (
    <Card className="p-8 bg-white border border-slate-200/60 rounded-[32px] shadow-sm">
      <div className="mb-8">
        <h3 className="text-xl font-bold text-slate-800">Progression Graph</h3>
        <p className="text-sm text-slate-500 font-medium mt-1">Adaptive tracking of your engineering dependencies</p>
      </div>

      <div className="space-y-8">
        {blockers.length > 0 && (
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-500 mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
              Active Blockers
            </h4>
            <div className="flex flex-wrap gap-3">
              {blockers.map((node: any, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={node.id} 
                  className="px-4 py-2.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm"
                >
                  <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {node.label || node.id}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            {blockers.length > 0 ? "Upcoming Dependencies" : "Current Trajectory"}
          </h4>
          <div className="flex flex-wrap gap-2.5">
            {others.map((node: any) => (
              <div key={node.id} className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                {node.label || node.id}
              </div>
            ))}
            {roadmapNodes.length > 6 && (
              <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-400 rounded-lg text-sm font-medium">
                +{roadmapNodes.length - 6} more
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
