import React from 'react';

export const InsightsCard: React.FC = () => {
  return (
    <div className="h-full bg-[#faf7f2] border border-[#e5dfd6] rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 space-y-3">
      <div className="text-sm font-medium text-[#444]">Insights</div>
      <p className="text-sm text-[#6b6b6b]">
        You solved 12 problems this week. Focus on Dynamic Programming today for improvement.
      </p>
    </div>
  );
};
