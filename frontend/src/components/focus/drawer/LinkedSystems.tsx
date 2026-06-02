import React from 'react';
import { Network, Code2, Database } from 'lucide-react';

export const LinkedSystems: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
        <Network size={14} /> Linked Systems
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 bg-white/40 rounded-xl border border-white/60 flex items-center gap-3 hover:bg-white/60 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            <Code2 size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-slate-800">Projects</span>
            <span className="text-[10px] font-medium text-slate-500">2 linked tasks</span>
          </div>
        </div>

        <div className="p-3 bg-white/40 rounded-xl border border-white/60 flex items-center gap-3 hover:bg-white/60 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
            <Database size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-slate-800">DSA Tracks</span>
            <span className="text-[10px] font-medium text-slate-500">Graphs Review</span>
          </div>
        </div>
      </div>
    </div>
  );
};
