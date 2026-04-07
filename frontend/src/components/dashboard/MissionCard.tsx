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

  const toggleMission = (id: string) => {
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m)),
    );
  };

  return (
    <div className="h-full bg-white border border-gray-200 rounded-xl p-5 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ease-in-out flex flex-col">
      <div className="flex justify-between items-center">
        <div className="text-sm font-semibold text-gray-900">Today's Mission</div>
        <div className="text-sm font-bold text-gray-900 tabular-nums">{pct}%</div>
      </div>

      <div className="text-xs text-gray-500 mt-1">{completedCount}/{total} completed</div>

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-3">
        <div
          className="h-full bg-gray-900 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex flex-col gap-2 mt-4 flex-1">
        {missions.map((m) => (
          <label
            key={m.id}
            className={[
              'flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer',
              'transition-all duration-200',
              'hover:bg-gray-50',
              m.completed ? 'opacity-60' : '',
            ].join(' ')}
          >
            <input
              type="checkbox"
              checked={m.completed}
              onChange={() => toggleMission(m.id)}
              className="w-4 h-4 accent-black rounded cursor-pointer shrink-0"
            />
            <span
              className={[
                'text-sm transition-all duration-200',
                m.completed ? 'line-through text-gray-400' : 'text-gray-700',
              ].join(' ')}
            >
              {m.label}
            </span>
            {m.completed && (
              <Icon name="check-circle" size={14} className="text-green-500 ml-auto shrink-0" />
            )}
          </label>
        ))}
      </div>

      <div className="text-[11px] text-gray-400 mt-3 pt-3 border-t border-gray-100">
        {pct === 100
          ? '🎉 All missions completed! Great work today.'
          : `You're ${total - completedCount} task${total - completedCount > 1 ? 's' : ''} away from completing today's goals.`}
      </div>
    </div>
  );
};
