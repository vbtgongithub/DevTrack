import React, { type ReactNode } from 'react';
import { useSessionState } from '../state/useSessionState';
import { useUploadState } from '../state/useUploadState';
import { useSse } from '../../../hooks/useSse';

const STAGE_MAP: Record<string, any> = {
  UPLOADED: { stage: 'uploading', stageResult: 'upload' },
  VALIDATING: { stage: 'validating', stageResult: 'upload' },
  PARSING: { stage: 'parsing', stageResult: 'ats' },
  EXTRACTING: { stage: 'extracting', stageResult: 'ats' },
  ATS_ANALYZING: { stage: 'analyzing', stageResult: 'ats' },
  EMBEDDING: { stage: 'analyzing', stageResult: 'intelligence' },
  SEMANTIC_ANALYZING: { stage: 'analyzing', stageResult: 'intelligence' },
  RECOMMENDING: { stage: 'analyzing', stageResult: 'recommendations' },
  REPLAY_GENERATING: { stage: 'analyzing', stageResult: 'recommendations' },
  REPORT_GENERATING: { stage: 'analyzing', stageResult: 'recommendations' },
  COMPLETED: { stage: 'completed', stageResult: 'recommendations' },
  FAILED: { stage: 'failed', stageResult: 'recommendations' },
};

export const ResumeProcessingOrchestrator: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentSession, updateStage, updateStageResult } = useSessionState();
  const { setProgress } = useUploadState();

  useSse({
    onEvent: (e) => {
      if (e.type === 'resume_progression' && e.payload?.sessionId === currentSession?.sessionId) {
        const { stage, internalStage, status, progress } = e.payload;
        
        const lookupStage = internalStage || stage;
        const mapped = STAGE_MAP[lookupStage];
        if (mapped) {
          updateStage(mapped.stage);
          
          const stageStatus = status === 'completed' || stage === 'COMPLETED' ? 'success' : 
                             status === 'failed' || stage === 'FAILED' ? 'failed' : 'processing';
          
          updateStageResult(mapped.stageResult, stageStatus);
          
          if (progress !== undefined) {
            setProgress(progress);
          }
        }
      }
    }
  });

  return <>{children}</>;
};
