import React from 'react';
import { Card } from '../../../components/ui/Card';
import type { ReadinessSnapshot } from '../../../services/readinessService';

interface Props {
  data: ReadinessSnapshot;
}

export const MomentumConsistencyAnalytics: React.FC<Props> = ({ data }) => {
  const { core } = data.rawMetrics;
  const trend = core?.momentumTrend || 'stagnating';

  return (
    <Card className="p-6 bg-white border border-slate-200 rounded-[24px]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Momentum & Consistency</h3>
        <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-md ${
          trend === 'improving' ? 'bg-emerald-50 text-emerald-600' :
          trend === 'declining' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
        }`}>
          {trend}
        </span>
      </div>
      
      <p className="text-sm text-slate-600 mb-6">
        {trend === 'improving' ? "You are demonstrating sustained long-term growth. This is highly valued by engineering recruiters." :
         trend === 'declining' ? "Your momentum has slowed down recently. Consistent execution matters more than short bursts." :
         "Your engineering consistency is stable."}
      </p>

      {/* Mock Heatmap visualization */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(12px,1fr))] gap-1 h-20 w-full mb-2">
        {Array.from({ length: 90 }).map((_, i) => {
          // Fake some recent heat based on trend
          const isActive = trend === 'improving' ? Math.random() > 0.3 : trend === 'stagnating' ? Math.random() > 0.6 : Math.random() > 0.8;
          return (
            <div 
              key={i} 
              className={`rounded-sm ${isActive ? 'bg-indigo-400' : 'bg-slate-100'}`} 
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-slate-400 font-medium">
        <span>90 Days Ago</span>
        <span>Today</span>
      </div>
    </Card>
  );
};
