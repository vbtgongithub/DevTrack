import React, { Suspense } from 'react';

// Lazy loading the domain sections
const ATSIntelligenceWorkspace = React.lazy(() => import('../ats/ATSIntelligenceWorkspace').then(m => ({ default: m.ATSIntelligenceWorkspace })));
const EngineeringSignalViewer = React.lazy(() => import('../signals/EngineeringSignalViewer').then(m => ({ default: m.EngineeringSignalViewer })));
const ResumeCredibilityWorkspace = React.lazy(() => import('../credibility/ResumeCredibilityWorkspace').then(m => ({ default: m.ResumeCredibilityWorkspace })));
const ResumeRecommendationPanel = React.lazy(() => import('../recommendations/ResumeRecommendationPanel').then(m => ({ default: m.ResumeRecommendationPanel })));
const ATSReplayViewer = React.lazy(() => import('../replay/ATSReplayViewer').then(m => ({ default: m.ATSReplayViewer })));
const ResumeEvolutionTimeline = React.lazy(() => import('../versioning/ResumeEvolutionTimeline').then(m => ({ default: m.ResumeEvolutionTimeline })));
const AdvancedInspectionMode = React.lazy(() => import('../observability/AdvancedInspectionMode').then(m => ({ default: m.AdvancedInspectionMode })));
const ResumeIntelligenceDossier = React.lazy(() => import('../intelligence/ResumeIntelligenceDossier').then(m => ({ default: m.ResumeIntelligenceDossier })));

interface CanvasProps {
  activeSection: string;
}

const CanvasFallback: React.FC = () => (
  <div className="w-full h-40 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
);

export const DynamicIntelligenceCanvas: React.FC<CanvasProps> = ({ activeSection }) => {

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-6">
      <Suspense fallback={<CanvasFallback />}>
        {activeSection === 'overview' && (
          <div className="flex flex-col gap-6">
            <ATSIntelligenceWorkspace />
            <EngineeringSignalViewer />
          </div>
        )}
        {activeSection === 'ats' && <ATSIntelligenceWorkspace />}
        {activeSection === 'dossier' && <ResumeIntelligenceDossier />}
        {activeSection === 'signals' && <EngineeringSignalViewer />}
        {activeSection === 'credibility' && <ResumeCredibilityWorkspace />}
        {activeSection === 'recommendations' && <ResumeRecommendationPanel />}
        {activeSection === 'replay' && <ATSReplayViewer />}
        {activeSection === 'evolution' && <ResumeEvolutionTimeline />}
        {activeSection === 'inspection' && <AdvancedInspectionMode />}
      </Suspense>
    </div>
  );
};
