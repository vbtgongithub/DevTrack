import React from 'react';
import { Eye, Code2, AlertTriangle, Lightbulb, PlayCircle, GitCommit, Terminal, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavigationItem[] = [
  { id: 'overview', label: 'Overview', icon: <Eye size={16} /> },
  { id: 'ats', label: 'ATS Analysis', icon: <PlayCircle size={16} /> },
  { id: 'dossier', label: 'Dossier', icon: <Shield size={16} /> },
  { id: 'signals', label: 'Signals', icon: <Code2 size={16} /> },
  { id: 'credibility', label: 'Risks', icon: <AlertTriangle size={16} /> },
  { id: 'recommendations', label: 'Guidance', icon: <Lightbulb size={16} /> },
  { id: 'replay', label: 'Simulation', icon: <PlayCircle size={16} /> },
  { id: 'evolution', label: 'Evolution', icon: <GitCommit size={16} /> },
  { id: 'inspection', label: 'Inspection', icon: <Terminal size={16} /> },
];

interface NavigationProps {
  activeSection: string;
  onSectionSelect: (id: string) => void;
}

export const ResumeIntelligenceNavigation: React.FC<NavigationProps> = ({ activeSection, onSectionSelect }) => {
  return (
    <nav className="w-full xl:w-[300px] shrink-0 xl:border-r border-slate-200/60 xl:pr-6 h-fit sticky top-4">
      
      {/* Fancy Header */}
      <div className="hidden xl:flex items-center gap-2 mb-4">
        <div className="h-4 w-1 rounded-full bg-gradient-to-b from-fuchsia-500 to-violet-600" />
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Intelligence Modules</h2>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {NAV_ITEMS.map((item, idx) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onSectionSelect(item.id)}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className={`relative flex flex-col items-center justify-center gap-1.5 p-2 h-20 rounded-xl text-center transition-all duration-300 group overflow-hidden border
              ${activeSection === item.id
                ? 'bg-violet-50 border-violet-200 shadow-[0_4px_14px_-2px_rgba(139,92,246,0.15)]'
                : 'bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_-4px_rgba(217,70,239,0.15)] hover:border-fuchsia-200'
              }`}
          >
            {/* Animated Background on active/hover */}
            <div className={`absolute inset-0 bg-gradient-to-br from-fuchsia-400 to-violet-500 transition-opacity duration-500
              ${activeSection === item.id ? 'opacity-10' : 'opacity-0 group-hover:opacity-5'}`} />

            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 relative z-10
              ${activeSection === item.id 
                ? 'bg-white text-violet-600 shadow-sm border border-violet-100' 
                : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-fuchsia-600 group-hover:shadow-sm group-hover:border group-hover:border-fuchsia-100'}`}>
              {item.icon}
            </div>
            
            <span className={`text-[9px] sm:text-[10px] font-bold leading-tight relative z-10 transition-colors px-0.5
              ${activeSection === item.id ? 'text-violet-900' : 'text-slate-500 group-hover:text-fuchsia-700'}`}>
              {item.label}
            </span>
          </motion.button>
        ))}
      </div>
    </nav>
  );
};
