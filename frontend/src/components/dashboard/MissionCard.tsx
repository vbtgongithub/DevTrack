import React from 'react';
import { Icon } from '../shared/Icon';

type Mission = {
  id: string;
  label: string;
  completed: boolean;
};

const INITIAL_MISSIONS: Mission[] = [
  { id: 'm1', label: 'Solve 2 Medium Problems', completed: true },
  { id: 'm2', label: 'Review 1 Past Mistake', completed: true },
  { id: 'm3', label: 'Push 1 GitHub Commit', completed: false },
];

export const MissionCard: React.FC = () => {
  const [missions, setMissions] = React.useState<Mission[]>(INITIAL_MISSIONS);

  const completedCount = missions.filter((m) => m.completed).length;
  const total = missions.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const toggleMission = (id: string) => {
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m)),
    );
  };

  return (
    <div className="h-full bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-in-out flex flex-col">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <Icon name="target" size={15} className="text-violet-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Today's Mission</h3>
        </div>
        <div className="text-lg font-bold text-gray-900 tabular-nums">{pct}%</div>
      </div>

      <div className="text-xs text-gray-500 mb-3 ml-10">{completedCount}/{total} completed</div>

      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-violet-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: mounted ? `${pct}%` : '0%' }}
        />
      </div>

      <div className="flex flex-col gap-1.5 flex-1">
        {missions.map((m, index) => (
          <label
            key={m.id}
            className={[
              'flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer',
              'transition-all duration-200',
              'hover:bg-gray-50',
              m.completed ? 'opacity-60' : '',
            ].join(' ')}
            style={{ animation: `dtFadeIn 520ms ease-out ${index * 60}ms both` }}
          >
            <div
              className={[
                'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0',
                'transition-all duration-200',
                m.completed
                  ? 'bg-violet-500 border-violet-500'
                  : 'border-gray-300 hover:border-gray-400',
              ].join(' ')}
              onClick={(e) => {
                e.preventDefault();
                toggleMission(m.id);
              }}
            >
              {m.completed && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span
              className={[
                'text-sm transition-all duration-200',
                m.completed ? 'line-through text-gray-400' : 'text-gray-700 font-medium',
              ].join(' ')}
            >
              {m.label}
            </span>
            {m.completed && (
              <Icon name="check-circle" size={14} className="text-emerald-500 ml-auto shrink-0" />
            )}
          </label>
        ))}
      </div>

      <div className="text-[11px] text-gray-400 mt-3 pt-3 border-t border-gray-50">
        {pct === 100
          ? '🎉 All missions completed! Great work today.'
          : `You're ${total - completedCount} task${total - completedCount > 1 ? 's' : ''} away from completing today's goals.`}
      </div>
    </div>
  );
};
