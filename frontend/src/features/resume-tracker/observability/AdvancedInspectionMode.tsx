import React, { useState } from 'react';
import { Activity, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { useSessionState } from '../state/useSessionState';

export const AdvancedInspectionMode: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentSession } = useSessionState();

  if (!currentSession) return null;

  return (
    <div className="w-full mt-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 hover:text-slate-300 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-[#8B5CF6]" />
          <span className="text-[11px] font-mono uppercase tracking-widest">Toggle Advanced Telemetry</span>
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div className="mt-3 bg-slate-950 border border-slate-800 rounded-xl p-5 font-mono text-xs text-slate-400 shadow-inner">
          <div className="flex items-center gap-2 text-emerald-400 mb-4 border-b border-slate-800 pb-3">
            <Activity size={14} />
            <span className="uppercase tracking-widest font-bold">Execution Telemetry</span>
          </div>
          <div className="space-y-1.5">
            <p><span className="text-slate-600">Session ID:</span> {currentSession.sessionId}</p>
            <p><span className="text-slate-600">Target File:</span> {currentSession.fileInfo.fileName} ({currentSession.fileInfo.fileSize}b)</p>
            <p><span className="text-slate-600">Active State:</span> <span className="text-[#8B5CF6]">{currentSession.status}</span></p>
          </div>
          <div className="mt-6">
            <p className="text-slate-600 mb-2 uppercase tracking-widest text-[10px] font-bold">Pipeline Diagnostics:</p>
            <div className="flex flex-col gap-1.5 bg-slate-900 p-3 rounded-lg border border-slate-800">
              {Object.entries(currentSession.stages).map(([k, v]) => (
                <div key={k} className="flex justify-between items-center max-w-sm">
                  <span className="capitalize">{k}:</span>
                  <span className={v.status === 'success' ? 'text-emerald-400' : v.status === 'processing' ? 'text-amber-400 animate-pulse' : 'text-slate-500'}>
                    [{v.status.toUpperCase()}] {v.completedAt && v.startedAt ? `+${new Date(v.completedAt).getTime() - new Date(v.startedAt).getTime()}ms` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
