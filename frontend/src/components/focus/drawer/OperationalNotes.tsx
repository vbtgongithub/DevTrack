import React, { useState, useEffect } from 'react';
import { useMissionStore } from '../../../store/missionStore';
import { FileText, Save } from 'lucide-react';

export const OperationalNotes: React.FC<{ missionId: string }> = ({ missionId }) => {
  const mission = useMissionStore(state => state.missions.find(m => m.id === missionId));
  const updateMissionNotes = useMissionStore(state => state.updateMissionNotes);

  const [notes, setNotes] = useState(mission?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if mission changes (e.g. initial load)
  useEffect(() => {
    setNotes(mission?.notes || '');
  }, [missionId]); // only run when ID changes to avoid wiping input on auto-save

  // Auto-save logic
  useEffect(() => {
    if (!mission) return;
    if (notes === mission.notes) return;

    setIsSaving(true);
    const timeout = setTimeout(() => {
      updateMissionNotes(missionId, notes);
      setIsSaving(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [notes, missionId, updateMissionNotes]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <FileText size={14} /> Operational Notes
        </h3>
        {isSaving && (
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 animate-pulse">
            <Save size={10} /> Saving...
          </span>
        )}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Log blockers, architecture ideas, or execution reflections here (Markdown supported)..."
        className="w-full h-[200px] bg-white/40 border border-white/60 rounded-2xl p-4 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all resize-y shadow-inner"
      />
    </div>
  );
};
