import { create } from 'zustand';

interface ReplayState {
  isReplaying: boolean;
  currentStepIndex: number;
  steps: ReplayStep[];
  startReplay: (steps: ReplayStep[]) => void;
  nextStep: () => void;
  resetReplay: () => void;
}

export interface ReplayStep {
  id: string;
  title: string;
  description: string;
  type: 'extraction' | 'parsing' | 'keyword_match' | 'signal_detection';
  success: boolean;
  artifacts: string[]; // e.g. text snippets, matched keywords
}

export const useReplayState = create<ReplayState>((set) => ({
  isReplaying: false,
  currentStepIndex: 0,
  steps: [],
  
  startReplay: (steps) => set({ isReplaying: true, steps, currentStepIndex: 0 }),
  nextStep: () => set((state) => ({ 
    currentStepIndex: Math.min(state.currentStepIndex + 1, state.steps.length - 1) 
  })),
  resetReplay: () => set({ isReplaying: false, currentStepIndex: 0, steps: [] })
}));
