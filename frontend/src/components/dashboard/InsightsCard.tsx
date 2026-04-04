import React from 'react';

export const InsightsCard: React.FC = () => {
  return (
    <div className="h-full bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 space-y-3">
      <div className="text-sm font-medium text-gray-700">Insights</div>
      <p className="text-sm text-gray-600">
        You solved 12 problems this week. Focus on Dynamic Programming today for improvement.
      </p>
    </div>
  );
};
