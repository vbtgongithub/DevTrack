import React from 'react';
import { motion } from 'framer-motion';
import type { Mission, MissionStatus } from '../../store/missionStore';
import { Activity, Clock, Target, Zap, Sparkles, AlertTriangle } from 'lucide-react';

interface MissionCardProps {
  mission: Mission;
  isActive: boolean;
  onClick: () => void;
}

const statusConfig: Record<MissionStatus, { color: string; bg: string; dot: string; glow: string }> = {
  'planned': { color: 'text-slate-600', bg: 'bg-slate-500/10', dot: 'bg-slate-500', glow: 'shadow-[0_0_15px_rgba(100,116,139,0.5)]' },
  'active': { color: 'text-violet-600', bg: 'bg-violet-500/10', dot: 'bg-violet-500', glow: 'shadow-[0_0_15px_rgba(139,92,246,0.5)]' },
  'accelerating': { color: 'text-blue-600', bg: 'bg-blue-500/10', dot: 'bg-blue-500', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]' },
  'stable': { color: 'text-emerald-600', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]' },
  'blocked': { color: 'text-amber-600', bg: 'bg-amber-500/10', dot: 'bg-amber-500', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]' },
  'completed': { color: 'text-indigo-600', bg: 'bg-indigo-500/10', dot: 'bg-indigo-500', glow: 'shadow-[0_0_15px_rgba(99,102,241,0.5)]' },
  'archived': { color: 'text-gray-500', bg: 'bg-gray-500/10', dot: 'bg-gray-500', glow: 'shadow-[0_0_15px_rgba(107,114,128,0.5)]' },
};

export const MissionCard: React.FC<MissionCardProps> = ({ mission, isActive, onClick }) => {
  const normalizedStatus = (mission.status?.toLowerCase() || 'planned') as MissionStatus;
  const config = statusConfig[normalizedStatus] || statusConfig['planned'];
  const radius = 38;
  const cx = 45;
  const cy = 45;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (mission.executionConfidence / 100) * circumference;

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4 }}
      className={`w-full h-full flex flex-col rounded-[24px] p-4 cursor-pointer transition-all duration-500 relative overflow-hidden group
        ${isActive 
          ? `bg-white/80 border-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] ring-2 ring-violet-500/20` 
          : `bg-white/40 border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:bg-white/60 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]`
        } border backdrop-blur-3xl`}
    >
      {/* Background ambient glow based on status if active */}
      {isActive && (
        <motion.div 
          animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.05, 1] }} 
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute inset-0 pointer-events-none rounded-[32px] blur-2xl ${config.bg}`}
        />
      )}

      {/* Top Bar */}
      <div className="flex justify-between items-center mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-1 rounded-full flex items-center gap-2 ${config.bg} border border-white/50`}>
            <div className={`w-1.5 h-1.5 rounded-full ${config.dot} ${isActive ? config.glow : ''} ${isActive ? 'animate-pulse' : ''}`} />
            <span className={`text-[9px] font-black uppercase tracking-widest ${config.color}`}>
              {mission.status}
            </span>
          </div>
          
          {mission.health === 'critical' && (
            <div className="px-2 py-1 rounded-full bg-red-50 border border-red-100 flex items-center gap-1">
              <AlertTriangle size={10} className="text-red-500" />
              <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Critical Health</span>
            </div>
          )}
          {mission.health === 'at-risk' && (
            <div className="px-2 py-1 rounded-full bg-amber-50 border border-amber-100 flex items-center gap-1">
              <AlertTriangle size={10} className="text-amber-500" />
              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">At Risk</span>
            </div>
          )}
        </div>
        
        {isActive && (
          <div className="flex items-center gap-1">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`}></span>
            </span>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="mb-3 relative z-10">
        <h3 className="text-[15px] font-black text-slate-800 tracking-tight leading-snug line-clamp-2">
          {mission.title}
        </h3>
      </div>

      {/* Execution Visual (Centerpiece) */}
      <div className="flex justify-center items-center mb-3 relative z-10">
        <div className="relative w-[90px] h-[90px] flex items-center justify-center">
           {isActive && (
             <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className={`absolute inset-0 rounded-full blur-xl ${config.bg}`} />
           )}
           <svg className="w-full h-full transform -rotate-90 filter drop-shadow-sm">
              {/* Track */}
              <circle cx={cx} cy={cy} r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
              {/* Progress */}
              <motion.circle
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: progressOffset }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                cx={cx} cy={cy} r={radius} fill="transparent" stroke={isActive ? 'url(#gradient)' : '#cbd5e1'} strokeWidth="6"
                strokeDasharray={circumference}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
           </svg>
           <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
             <span className="text-xl font-black text-slate-800 tracking-tighter tabular-nums leading-none">{mission.executionConfidence}%</span>
             <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest text-center leading-tight mt-0.5">Execution<br/>Confidence</span>
           </div>
        </div>
      </div>

      {/* Mission Telemetry */}
      <div className="grid grid-cols-2 gap-2 mb-3 relative z-10">
        <div className="flex flex-col gap-0.5 bg-white/50 backdrop-blur-md p-2 rounded-xl border border-white/60">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock size={10} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Focus / Est.</span>
          </div>
          <span className="text-[12px] font-black text-slate-800">{mission.actualHours ?? 0}h / {mission.estimatedHours ?? 0}h</span>
        </div>
        <div className="flex flex-col gap-0.5 bg-white/50 backdrop-blur-md p-2 rounded-xl border border-white/60">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Zap size={10} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Sessions</span>
          </div>
          <span className="text-[12px] font-black text-slate-800">{mission.focusSessions ?? 0}</span>
        </div>
        <div className="flex flex-col gap-0.5 bg-white/50 backdrop-blur-md p-2 rounded-xl border border-white/60">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Target size={10} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Tasks Done</span>
          </div>
          <span className="text-[12px] font-black text-slate-800">{mission.completedTasks ?? 0} / {mission.linkedTasks ?? 0}</span>
        </div>
        <div className="flex flex-col gap-0.5 bg-white/50 backdrop-blur-md p-2 rounded-xl border border-white/60">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Activity size={10} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Velocity</span>
          </div>
          <span className="text-[12px] font-black text-slate-800">{mission.velocity ?? 0} pts/w</span>
        </div>
      </div>

      {/* AI Signal */}
      <div className="mt-auto relative z-10">
        <div className="bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 border border-violet-500/10 rounded-xl p-3 relative overflow-hidden group-hover:from-violet-500/10 transition-colors duration-500">
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-[shimmer_3s_infinite]" />
          
          <h4 className="text-[9px] font-black text-violet-600 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Sparkles size={10} /> AI Signal
          </h4>
          <p className="text-[10px] font-medium text-slate-700 leading-snug">
            {mission.aiInsight}
          </p>
        </div>
      </div>

    </motion.div>
  );
};
