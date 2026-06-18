import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, CheckCircle, Archive, Edit2 } from 'lucide-react';
import { useMissionStore } from '../../../store/missionStore';

// Sections
import { MissionIdentity } from './MissionIdentity';
import { MissionRuntimePanel } from './MissionRuntimePanel';
import { IntelligenceInsights } from './IntelligenceInsights';
import { SessionTimeline } from './SessionTimeline';
import { ForecastEngine } from './ForecastEngine';
import { LinkedSystems } from './LinkedSystems';
import { OperationalNotes } from './OperationalNotes';

interface MissionDrawerProps {
  missionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MissionDrawer: React.FC<MissionDrawerProps> = ({ missionId, isOpen, onClose }) => {
  const mission = useMissionStore(state => state.missions.find(m => m.id === missionId));
  const completeMission = useMissionStore(state => state.completeMission);
  const archiveMission = useMissionStore(state => state.archiveMission);

  if (!mission) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100]"
          />
          
          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full md:w-[90vw] lg:w-[640px] bg-slate-50/95 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.1)] border-l border-white/60 z-[101] flex flex-col overflow-hidden"
          >
            {/* Drawer Header (Sticky) */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200/50 bg-white/50 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest px-2 py-1 bg-violet-100 rounded-md">Intelligence Node</span>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-8 scroll-smooth">
              <MissionIdentity mission={mission} />
              
              <IntelligenceInsights mission={mission} />
              
              <MissionRuntimePanel mission={mission} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ForecastEngine mission={mission} />
                <LinkedSystems />
              </div>

              <SessionTimeline mission={mission} />
              
              <OperationalNotes missionId={mission.id} />
              
              {/* Spacer */}
              <div className="h-8" />
            </div>

            {/* Sticky Actions Footer */}
            <div className="p-4 md:p-6 border-t border-slate-200/50 bg-white/80 backdrop-blur-md shrink-0 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button className="p-3 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors" title="Edit Mission">
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => { archiveMission(mission.id); onClose(); }}
                  className="p-3 rounded-full bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors" 
                  title="Archive Mission"
                >
                  <Archive size={16} />
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900 text-white text-[13px] font-black tracking-wide hover:bg-slate-800 transition-colors shadow-md hover:shadow-lg">
                  <Play size={16} /> Focus Now
                </button>
                <button 
                  onClick={() => { completeMission(mission.id); onClose(); }}
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-500 text-white text-[13px] font-black tracking-wide hover:bg-emerald-600 transition-colors shadow-md hover:shadow-lg hover:shadow-emerald-500/30"
                >
                  <CheckCircle size={16} /> Mark Complete
                </button>
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
