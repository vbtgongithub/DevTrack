import React from 'react';

export const AdaptiveGuidanceFeed: React.FC = () => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Contextual Insights</h3>
      
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
        <span className="text-blue-500 mt-0.5">💡</span>
        <p className="text-sm text-blue-900 leading-relaxed">
          Your projects show API maturity but limited deployment sophistication. Deploying your latest React/Node project to a cloud provider will boost your Project Credibility score.
        </p>
      </div>

      <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl flex gap-3">
        <span className="text-purple-500 mt-0.5">📊</span>
        <p className="text-sm text-purple-900 leading-relaxed">
          Your Graph consistency is below your Backend cohort average. Consider solving 3 Graph problems this week to restore your cohort percentile.
        </p>
      </div>
    </div>
  );
};
