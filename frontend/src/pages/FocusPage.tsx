import React from 'react';
import { motion as framerMotion } from 'framer-motion';
import { useDashboardData } from '../hooks/useDashboardData';
import { useRuntimeState } from '../hooks/useRuntimeState';
import { useCoachingStore } from '../store/coachingStore';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { MomentumHero } from '../features/dashboard/MomentumHero';
import { CoachingWidget } from '../features/coaching/CoachingWidget';
import { PomodoroTimer } from '../components/dashboard/PomodoroTimer';
import { DashboardSkeleton } from '../components/skeletons/DashboardSkeleton';
import { FocusAnalytics } from '../components/focus/FocusAnalytics';
import { RecoveryIntelligence } from '../components/focus/RecoveryIntelligence';

const FocusPage: React.FC = () => {
  const { loading, error } = useDashboardData();
  const { data: runtimeState } = useRuntimeState();
  const { momentum } = useCoachingStore();
  const streak = runtimeState?.streak ?? 0;
  
  // Ambient State Logic
  const isBurnoutRisk = momentum?.momentumScore?.trend === 'critical' || momentum?.momentumScore?.trend === 'declining';
  const isRecovery = momentum?.momentumScore?.trend === 'rising';
  
  let bgGradient1 = 'from-indigo-200/50 via-purple-200/30';
  let bgGradient2 = 'from-blue-200/50 via-violet-200/30';
  
  if (isBurnoutRisk) {
    bgGradient1 = 'from-orange-200/50 via-red-200/30';
    bgGradient2 = 'from-amber-200/50 via-orange-200/30';
  } else if (isRecovery) {
    bgGradient1 = 'from-teal-200/50 via-emerald-200/30';
    bgGradient2 = 'from-emerald-200/50 via-cyan-200/30';
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
    }
  };

  if (loading) {
    return (
      <div className="dt-fade-in max-w-[1400px] mx-auto w-full">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] dt-fade-in">
        <div className="text-center bg-white border border-red-100 rounded-3xl p-10 shadow-xl max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6 border border-red-100">
            !
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Sync Failed</h2>
          <p className="text-[14px] text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-xl bg-dt-primary text-white font-semibold hover:bg-dt-primary/90 transition-all shadow-md shadow-dt-primary/20"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <framerMotion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-12 max-w-[1400px] mx-auto w-full pb-32 px-4 lg:px-8 relative"
      >
        {/* Ambient State Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-gradient-to-br from-[#FAFBFD] via-[#F8F9FC] to-[#F6F8FB] transition-colors duration-1000">
          <div className={`absolute top-[-15%] right-[-8%] w-[900px] h-[900px] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] ${bgGradient1} to-transparent blur-[120px] rounded-full mix-blend-multiply opacity-70 animate-[pulse_8s_ease-in-out_infinite] transition-colors duration-[2000ms]`} />
          <div className={`absolute bottom-[-10%] left-[-12%] w-[700px] h-[700px] bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] ${bgGradient2} to-transparent blur-[120px] rounded-full mix-blend-multiply opacity-50 animate-[pulse_10s_ease-in-out_infinite_2s] transition-colors duration-[2000ms]`} />
        </div>

        {/* ABOVE THE FOLD */}
        <div className="flex flex-col gap-12 pt-8 relative z-10">
          {/* Operational Momentum (Full Width Row) */}
          <framerMotion.section variants={itemVariants} className="w-full">
            <MomentumHero streak={streak} />
          </framerMotion.section>
          
          {/* Focus Engine (Full Width Row) */}
          <framerMotion.section variants={itemVariants} className="w-full">
            <PomodoroTimer />
          </framerMotion.section>

          {/* Neural Coaching (Full width) */}
          <framerMotion.section variants={itemVariants}>
            <CoachingWidget />
          </framerMotion.section>
        </div>

        {/* BELOW THE FOLD */}
        <div className="flex flex-col gap-16 relative z-10">
          <framerMotion.section variants={itemVariants}>
            <FocusAnalytics />
          </framerMotion.section>
          
          <framerMotion.section variants={itemVariants}>
            <RecoveryIntelligence />
          </framerMotion.section>
        </div>
      </framerMotion.div>
    </ErrorBoundary>
  );
};

export default FocusPage;
