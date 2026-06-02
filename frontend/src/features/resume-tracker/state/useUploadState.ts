import { create } from 'zustand';

interface UploadState {
  progress: number;
  isDragging: boolean;
  validationErrors: string[];
  setDragging: (dragging: boolean) => void;
  setProgress: (progress: number) => void;
  setValidationErrors: (errors: string[]) => void;
  reset: () => void;
}

export const useUploadState = create<UploadState>((set) => ({
  progress: 0,
  isDragging: false,
  validationErrors: [],
  setDragging: (dragging) => set({ isDragging: dragging }),
  setProgress: (progress) => set({ progress }),
  setValidationErrors: (errors) => set({ validationErrors: errors }),
  reset: () => set({ progress: 0, isDragging: false, validationErrors: [] })
}));
