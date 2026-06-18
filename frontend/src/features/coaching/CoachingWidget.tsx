import React, { useEffect, useState } from 'react';
import { motion as framerMotion, AnimatePresence } from 'framer-motion';
import { useCoachingStore } from '../../store/coachingStore';
import { useMissionStore } from '../../store/missionStore';
import { useUserStore } from '../../store/userStore';
import { trackInsightView } from '../../lib/telemetry/analytics';
import { EmptyState } from '../../components/shared/EmptyState';

export const CoachingWidget: React.FC = () => {
  const { insights, reflection, fetchAll, isLoading } = useCoachingStore();
  const getActiveMission = useMissionStore(state => state.getActiveMission);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const activeMission = getActiveMission();
  const [isExpanded, setIsExpanded] = useState(false);

  const missionSignal = activeMission ? `Mission Operation [${activeMission.title}]: ${activeMission.aiInsight}` : null;
  const combinedInsights = [
    ...(missionSignal ? [missionSignal] : []),
    ...(insights?.insights || [])
  ];

  useEffect(() => {
    if (isAuthenticated) {
      fetchAll();
    }
  }, [fetchAll, isAuthenticated]);

  useEffect(() => {
    if (!isLoading && insights?.insights && insights.insights.length > 0) {
      trackInsightView('neural_coaching', 'ai_insights');
    }
  }, [isLoading, insights?.insights]);

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[300px] bg-white rounded-[32px] border border-slate-200 p-6 space-y-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-slate-100 rounded" />
            <div className="h-3 w-20 bg-slate-50 rounded" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-16 w-full bg-slate-50/80 rounded-xl" />
          <div className="h-16 w-full bg-slate-50/80 rounded-xl" />
          <div className="space-y-2 pt-2">
            <div className="h-3 w-24 bg-slate-100 rounded" />
            <div className="h-4 w-full bg-slate-50 rounded" />
            <div className="h-4 w-4/5 bg-slate-50 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const hasData = combinedInsights.length > 0 || (reflection?.summaries && reflection.summaries.length > 0);

  return (
    <div 
      className="dt-card p-6 lg:p-8 bg-white/60 backdrop-blur-3xl rounded-[40px] border border-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-700 shadow-inner relative overflow-hidden flex flex-col h-full group"
      style={{ animation: 'dtFadeIn 800ms cubic-bezier(0.16,1,0.3,1) 400ms both' }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none group-hover:bg-violet-500/10 transition-colors duration-700" />

      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center border border-violet-500/20 shadow-sm">
            <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Neural Coaching</h3>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Adaptive Insights</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative z-10">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
            <EmptyState
              size="sm"
              icon="sparkles"
              title="Awaiting Coaching Data..."
              description="Complete more focus sessions to unlock personalized coaching."
            />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {combinedInsights.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="text-[14px] text-slate-700 font-medium bg-white/50 backdrop-blur-md p-5 rounded-[24px] border border-white/60 leading-relaxed shadow-sm hover:shadow-md transition-shadow">
                  {combinedInsights[0]}
                </div>
                
                {combinedInsights.length > 1 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs font-bold text-violet-600 self-start hover:text-violet-700 transition-colors flex items-center gap-1 bg-white/40 px-3 py-1.5 rounded-full border border-white/60 hover:bg-white/60 shadow-sm"
                  >
                    {isExpanded ? 'Hide detailed analysis' : `View ${combinedInsights.length - 1} more insights`}
                  </button>
                )}

                <AnimatePresence>
                  {isExpanded && (
                    <framerMotion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="flex flex-col gap-3 overflow-hidden"
                    >
                      {combinedInsights.slice(1).map((insight, idx) => (
                        <div key={idx} className="text-[14px] text-slate-700 font-medium bg-white/50 backdrop-blur-md p-5 rounded-[24px] border border-white/60 leading-relaxed shadow-sm">
                          {insight}
                        </div>
                      ))}
                      
                      {reflection?.summaries && reflection.summaries.length > 0 && (
                        <div className="mt-2 pt-4 border-t border-slate-100">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            Weekly Reflection
                          </h4>
                          <div className="flex flex-col gap-2">
                            {reflection.summaries.map((summary, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-[12px] text-slate-600 font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-500/40 mt-1.5 shrink-0" />
                                <span>{summary}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </framerMotion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};
