// ============================================================================
// EnhancedInsightsCard.tsx — AI Insights (Visually Dominant)
// ============================================================================

import React from 'react';
import { Icon } from '../shared/Icon';

export const EnhancedInsightsCard: React.FC = () => {
  // Backend doesn't provide AI insights data yet - show empty state
  // The feature requires backend ML/AI service to generate insights

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900">AI Insights</h3>
          <p className="text-xs text-gray-500 mt-0.5">Personalized recommendations based on your activity</p>
        </div>
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center shadow-sm">
          <Icon name="bolt" size={16} className="text-violet-600" />
        </div>
      </div>

      {/* Empty state - no backend data for AI insights */}
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
          <Icon name="sparkles" size={32} className="text-gray-300" />
        </div>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Insights Coming Soon</h4>
        <p className="text-xs text-gray-500 max-w-xs">
          AI-powered insights will appear here once you sync your platforms and build up activity data.
        </p>
      </div>
    </div>
  );
};
