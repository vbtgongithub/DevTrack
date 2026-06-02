import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMissionStore } from '../../store/missionStore';
import { MissionCard } from './MissionCard';
import { Network, Plus } from 'lucide-react';
import { NewMissionModal } from './NewMissionModal';
import { MissionDrawer } from './drawer/MissionDrawer';

export const MissionControlSection: React.FC = () => {
  // Triggering HMR refresh
  const { missions, activeMissionId, setActiveMission } = useMissionStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drawerMissionId, setDrawerMissionId] = useState<string | null>(null);

  const handleCardClick = (missionId: string) => {
    setActiveMission(missionId);
    setDrawerMissionId(missionId);
  };

  const railVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div id="mission-control-rail" className="w-full flex flex-col gap-6 relative scroll-mt-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[18px] bg-white/60 backdrop-blur-md flex items-center justify-center border border-white/60 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
            <Network className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-2">
              MISSION CONTROL
            </h2>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Strategic execution layer
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/60 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{missions.length} Operations Active</span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-violet-600 text-white px-4 py-2 rounded-full shadow-[0_4px_15px_rgba(139,92,246,0.3)] hover:bg-violet-700 hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)] hover:-translate-y-0.5 transition-all"
          >
            <Plus size={14} />
            <span className="text-[11px] font-black uppercase tracking-widest">New Operation</span>
          </button>
        </div>
      </div>

      {/* 2x2 Grid Layout */}
      <div className="relative">
        <motion.div
          variants={railVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6"
        >
          {missions.map((mission) => (
            <motion.div key={mission.id} variants={cardVariants} className="flex h-full">
              <MissionCard
                mission={mission}
                isActive={mission.id === activeMissionId}
                onClick={() => handleCardClick(mission.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
      <NewMissionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <MissionDrawer 
        missionId={drawerMissionId} 
        isOpen={!!drawerMissionId} 
        onClose={() => setDrawerMissionId(null)} 
      />
    </div>
  );
};
