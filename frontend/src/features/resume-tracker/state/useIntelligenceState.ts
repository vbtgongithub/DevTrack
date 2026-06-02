import { create } from 'zustand';
import type { AtsIntelligenceData, EngineeringSignal, CredibilityGap, ResumeRecommendation } from '../types/resumeContracts';

interface IntelligenceState {
  atsData: AtsIntelligenceData | null;
  engineeringSignals: EngineeringSignal[];
  credibilityGaps: CredibilityGap[];
  recommendations: ResumeRecommendation[];
  
  setAtsData: (data: AtsIntelligenceData) => void;
  setEngineeringSignals: (signals: EngineeringSignal[]) => void;
  setCredibilityGaps: (gaps: CredibilityGap[]) => void;
  setRecommendations: (recommendations: ResumeRecommendation[]) => void;
  reset: () => void;
}

export const useIntelligenceState = create<IntelligenceState>((set) => ({
  atsData: null,
  engineeringSignals: [],
  credibilityGaps: [],
  recommendations: [],
  
  setAtsData: (atsData) => set({ atsData }),
  setEngineeringSignals: (engineeringSignals) => set({ engineeringSignals }),
  setCredibilityGaps: (credibilityGaps) => set({ credibilityGaps }),
  setRecommendations: (recommendations) => set({ recommendations }),
  reset: () => set({ atsData: null, engineeringSignals: [], credibilityGaps: [], recommendations: [] })
}));
