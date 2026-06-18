// src/features/intelligence-experience/trust/ConfidenceAwareExperience.tsx
// Renders intelligence insights enveloped with confidence metadata.

import React from 'react';

interface Props {
  metric: string;
  value: number | string;
  confidenceScore: number; // 0-1
  uncertaintyFactors: string[];
}

export const ConfidenceAwareExperience: React.FC<Props> = ({
  metric,
  value,
  confidenceScore,
  uncertaintyFactors
}) => {
  const isHighConfidence = confidenceScore > 0.75;
  const opacityClass = isHighConfidence ? 'opacity-100' : 'opacity-70';

  return (
    <div className={`p-4 border rounded-xl ${isHighConfidence ? 'border-slate-700 bg-slate-800' : 'border-slate-700 bg-slate-800/50'} ${opacityClass}`}>
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-slate-300 font-medium">{metric}</h4>
        <div className="text-sm px-2 py-1 bg-slate-900 rounded font-mono text-slate-400">
          Conf: {(confidenceScore * 100).toFixed(0)}%
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-3">{value}</div>
      
      {!isHighConfidence && uncertaintyFactors.length > 0 && (
        <div className="text-xs text-amber-400 bg-amber-400/10 p-2 rounded">
          <span className="font-semibold block mb-1">Uncertainty Factors:</span>
          <ul className="list-disc pl-4 space-y-1">
            {uncertaintyFactors.map((factor, i) => <li key={i}>{factor}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};
