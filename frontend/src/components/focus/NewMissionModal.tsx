import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Target, Zap, Clock, Tag, AlignLeft } from 'lucide-react';
import { useMissionStore } from '../../store/missionStore';
import type { MissionCategory, MissionPriority } from '../../store/missionStore';

interface NewMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewMissionModal: React.FC<NewMissionModalProps> = ({ isOpen, onClose }) => {
  const createMission = useMissionStore(state => state.createMission);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MissionCategory>('backend');
  const [priority, setPriority] = useState<MissionPriority>('medium');
  const [estimatedHours, setEstimatedHours] = useState(10);
  const [tags, setTags] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createMission({
      title,
      description,
      category,
      priority,
      estimatedHours,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });

    // Reset and close
    setTitle('');
    setDescription('');
    setCategory('backend');
    setPriority('medium');
    setEstimatedHours(10);
    setTags('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-2xl bg-white/80 backdrop-blur-xl rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-white/60 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-200/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-100/50 flex items-center justify-center border border-violet-200/50">
                  <Target className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">New Operation</h2>
                  <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Initialize Mission Parameter</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-6">
              
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Tag size={12} /> Mission Title
                </label>
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Runtime Synchronization Fix"
                  className="w-full bg-white/50 border border-slate-200 rounded-2xl px-5 py-4 text-[15px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-slate-300"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <AlignLeft size={12} /> Strategic Objective
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the mission objective..."
                  className="w-full bg-white/50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all min-h-[100px] resize-none placeholder:text-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Target size={12} /> Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MissionCategory)}
                    className="w-full bg-white/50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all cursor-pointer"
                  >
                    <option value="frontend">Frontend Application</option>
                    <option value="backend">Backend Services</option>
                    <option value="architecture">System Architecture</option>
                    <option value="dsa">DSA & Algorithms</option>
                    <option value="learning">R&D / Learning</option>
                    <option value="bugfix">Critical Bugfix</option>
                    <option value="other">Other Operations</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={12} /> Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as MissionPriority)}
                    className="w-full bg-white/50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all cursor-pointer"
                  >
                    <option value="low">Low Priority (Routine)</option>
                    <option value="medium">Medium Priority (Standard)</option>
                    <option value="high">High Priority (Accelerated)</option>
                    <option value="critical">Critical (Immediate)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={12} /> Estimated Effort (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    className="w-full bg-white/50 border border-slate-200 rounded-2xl px-5 py-4 text-[15px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Tag size={12} /> Technology Tags
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="React, Node, Redis (comma separated)"
                    className="w-full bg-white/50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-slate-300 placeholder:font-medium"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 rounded-[20px] text-[14px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="flex-[2] py-4 rounded-[20px] text-[15px] font-black text-white bg-violet-600 hover:bg-violet-700 shadow-[0_8px_25px_rgba(139,92,246,0.3)] hover:shadow-[0_12px_35px_rgba(139,92,246,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Initialize Operation
                </button>
              </div>

            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
