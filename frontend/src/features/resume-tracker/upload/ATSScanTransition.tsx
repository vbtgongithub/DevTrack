import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useSse } from '../../../hooks/useSse';
import axiosClient from '../../../utils/axiosClient';

const SCAN_STAGES = [
  'Uploading Document...',
  'Parsing Document Structure...',
  'Extracting Engineering Signals...',
  'Running ATS Simulation...',
  'Analyzing Recruiter Readability...',
  'Generating Semantic Alignment...',
  'Building Credibility Graph...',
  'Finalizing Intelligence Report...'
];

const STAGE_MAP: Record<string, number> = {
  UPLOADED: 0,
  VALIDATING: 0,
  UPLOADING: 0,
  PARSING: 1,
  EXTRACTING: 2,
  SECTION_EXTRACTION: 2,
  ATS_ANALYZING: 3,
  EMBEDDING: 4,
  EMBEDDING_GENERATION: 4,
  SEMANTIC_ANALYZING: 5,
  SEMANTIC_RETRIEVAL: 5,
  RECOMMENDING: 6,
  RECOMMENDATION_GENERATION: 6,
  REPLAY_GENERATING: 7,
  DOSSIER_GENERATION: 7,
  REPORT_GENERATING: 7,
  COMPLETED: 8,
  FAILED: 8,
};

interface ATSScanTransitionProps {
  sessionId: string;
  onComplete: () => void;
}

export const ATSScanTransition: React.FC<ATSScanTransitionProps> = ({ sessionId, onComplete }) => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // SSE Real-time Updates
  useSse({
    onEvent: (e) => {
      if (e.type === 'resume_progression' && e.payload?.sessionId === sessionId) {
        const { stage, internalStage, status, errors } = e.payload;
        
        const lookupStage = internalStage || stage;
        if (STAGE_MAP[lookupStage] !== undefined) {
          setCurrentStageIdx(prev => Math.max(prev, STAGE_MAP[lookupStage]));
        }

        if (status === 'completed' || stage === 'COMPLETED') {
          setTimeout(() => {
            onComplete();
          }, 800);
        } else if (status === 'failed' || stage === 'FAILED') {
          setErrorMsg(errors?.[0] || 'Orchestration stage execution failed.');
        }
      }
    }
  });

  // DB Status Polling Fallback (Resiliency Safeguard for offline/SSE blockages)
  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const pollStatus = async () => {
      try {
        const response = await axiosClient.get(`/resume/session/${sessionId}/status`);
        if (!active) return;
        
        const data = response.data?.data;
        if (data) {
          const { currentStage, errors } = data;
          
          if (STAGE_MAP[currentStage] !== undefined) {
            setCurrentStageIdx(prev => Math.max(prev, STAGE_MAP[currentStage]));
          }

          if (currentStage === 'COMPLETED') {
            setTimeout(() => {
              if (active) onComplete();
            }, 800);
            return; // stop polling
          } else if (currentStage === 'FAILED') {
            setErrorMsg(errors?.[0] || 'Orchestration stage execution failed.');
            return; // stop polling
          }
        }
      } catch (err) {
        console.warn('[ATSScanTransition] Poll fallback failed', err);
      }

      if (active) {
        timeoutId = setTimeout(pollStatus, 1500);
      }
    };

    // Initial delay of 1s to allow processing to begin
    timeoutId = setTimeout(pollStatus, 1000);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [sessionId, onComplete]);

  if (errorMsg) {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col gap-6">
        <div className="text-center animate-fade-in">
          <h1 className="text-2xl font-black text-rose-500 tracking-tight">Intelligence Failure</h1>
          <p className="text-slate-400 mt-2 font-medium">Orchestration pipeline execution stalled.</p>
        </div>
        <div className="bg-slate-900 border border-rose-950/50 rounded-2xl p-6 font-mono text-rose-200 text-sm shadow-2xl shadow-rose-950/20">
          <p className="font-bold text-rose-400 uppercase tracking-widest text-[10px]">Error Trace</p>
          <p className="mt-2 text-slate-300 font-medium leading-relaxed">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Processing Intelligence</h1>
        <p className="text-slate-400 mt-2 font-medium">Running deep pipeline extraction.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 font-mono shadow-2xl">
        <div className="flex flex-col gap-3">
          {SCAN_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            const isUpcoming = idx > currentStageIdx;

            return (
              <motion.div
                key={stage}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: isUpcoming ? 0.3 : 1, x: 0 }}
                className={`flex items-center gap-3 text-[12px] uppercase tracking-wider ${
                  isCurrent ? 'text-[#8B5CF6] font-bold' : isCompleted ? 'text-emerald-500' : 'text-slate-600'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 size={16} className="animate-spin shrink-0 text-[#8B5CF6]" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                )}
                <span>{stage}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
