import React from 'react';
import { useSessionState } from '../state/useSessionState';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface DiagnosticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticsDrawer: React.FC<DiagnosticsDrawerProps> = ({ isOpen, onClose }) => {
  const { currentSession } = useSessionState();

  if (!currentSession) return null;

  const { stages } = currentSession;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[rgba(124,92,252,0.08)] shadow-[-8px_0_32px_rgba(0,0,0,0.08)] z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[rgba(124,92,252,0.06)]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-dt-primary" />
                <h2 className="text-[14px] font-semibold text-dt-text">Advanced Diagnostics</h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-dt-textMuted" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

              {/* Session Info */}
              <div>
                <p className="text-section-label mb-3">Session Information</p>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 font-mono text-[12px] text-dt-textSecondary flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-dt-textMuted">Session ID</span>
                    <span className="text-dt-text font-medium truncate max-w-[200px]">{currentSession.sessionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dt-textMuted">File</span>
                    <span className="text-dt-text font-medium">{currentSession.fileInfo.fileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dt-textMuted">Size</span>
                    <span className="text-dt-text font-medium">{(currentSession.fileInfo.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dt-textMuted">Status</span>
                    <span className="text-dt-primary font-semibold capitalize">{currentSession.status}</span>
                  </div>
                </div>
              </div>

              {/* Pipeline Diagnostics */}
              <div>
                <p className="text-section-label mb-3">Pipeline Stages</p>
                <div className="flex flex-col gap-2">
                  {Object.entries(stages).map(([stageName, stageData]) => {
                    const getIcon = () => {
                      if (stageData.status === 'success') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
                      if (stageData.status === 'processing') return <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />;
                      if (stageData.status === 'failed') return <AlertCircle className="w-4 h-4 text-rose-500" />;
                      return <div className="w-4 h-4 rounded-full border border-slate-300" />;
                    };

                    const getDuration = () => {
                      if (stageData.completedAt && stageData.startedAt) {
                        const ms = new Date(stageData.completedAt).getTime() - new Date(stageData.startedAt).getTime();
                        return `${ms}ms`;
                      }
                      return null;
                    };

                    return (
                      <div key={stageName} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                        <div className="flex items-center gap-2.5">
                          {getIcon()}
                          <span className="text-[13px] font-medium text-dt-text capitalize">{stageName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getDuration() && (
                            <span className="text-[11px] font-mono text-dt-textMuted">{getDuration()}</span>
                          )}
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            stageData.status === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            stageData.status === 'processing' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            stageData.status === 'failed' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            'bg-slate-50 text-slate-400 border-slate-100'
                          }`}>
                            {stageData.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <p className="text-section-label mb-3">Timestamps</p>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 font-mono text-[12px] text-dt-textSecondary flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-dt-textMuted">Created</span>
                    <span className="text-dt-text font-medium">{new Date(currentSession.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dt-textMuted">Updated</span>
                    <span className="text-dt-text font-medium">{new Date(currentSession.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
