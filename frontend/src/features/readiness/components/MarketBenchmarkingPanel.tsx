import React from 'react';
import { Card } from '../../../components/ui/Card';
import type { ReadinessSnapshot } from '../../../services/readinessService';

interface Props {
  data: ReadinessSnapshot;
}

export const MarketBenchmarkingPanel: React.FC<Props> = ({ data }) => {
  const { benchmarks } = data.rawMetrics;
  const segments = benchmarks?.cohortSegments || [];

  if (segments.length === 0) {
    return (
      <Card className="p-6 bg-white border border-slate-200 rounded-[24px]">
        <h3 className="text-lg font-bold text-slate-900">Cohort Benchmarks</h3>
        <p className="text-sm text-slate-500 mt-2">Not enough data to generate reliable percentiles yet.</p>
      </Card>
    );
  }

  const segment = segments[0]; // Display the primary cohort

  return (
    <Card className="p-6 bg-white border border-slate-200 rounded-[24px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Cohort Benchmark</h3>
          <p className="text-sm text-slate-500">Compared against {segment.cohortName}</p>
        </div>
        <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
          Top {100 - (segment.percentileRanking || 0)}%
        </div>
      </div>

      <div className="space-y-4">
        {(segment.relativeComparisons || []).map((comp: any, i: number) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-700">{comp.metricName}</span>
              <span className={comp.status === 'above' ? 'text-emerald-600 font-bold' : comp.status === 'below' ? 'text-amber-600 font-bold' : 'text-slate-600 font-bold'}>
                {comp.status.toUpperCase()}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, comp.userValue)}%` }} />
              <div className="h-full bg-slate-300 w-1 relative" style={{ left: `calc(${comp.cohortAverage}% - 4px)` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>You: {comp.userValue}</span>
              <span>Avg: {comp.cohortAverage}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>Sample Size: {segment.sampleSize}</span>
        <span>Confidence: <span className="uppercase font-bold">{segment.confidenceLevel}</span></span>
      </div>
    </Card>
  );
};
