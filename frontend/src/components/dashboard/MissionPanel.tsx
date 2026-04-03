import React from 'react';
import type { MissionPanelProps, MissionCardProps } from '../../types/ui.types';
import { Icon } from '../shared/Icon';

const MissionCard: React.FC<MissionCardProps> = ({ data, onClick }) => {
  return (
    <div
      className={
        data.isCompleted
          ? 'bg-[#faf7f2] border border-[#e5dfd6] rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer space-y-3'
          : 'bg-[#faf7f2] border border-[#e5dfd6] rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer space-y-3'
      }
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#f0ebe5] text-[#444]">
            <Icon name={data.categoryIcon} size={20} className="w-5 h-5 object-contain" />
          </div>
          <span className="text-xs font-medium bg-[#f0ebe5] text-[#444] px-2 py-1 rounded-md">
            {data.typeLabel}
          </span>
        </div>
        <span className="text-xs font-semibold text-[#1f1f1f]">{data.xpReward}</span>
      </div>

      <h4 className="text-sm font-medium text-[#444]">{data.title}</h4>
      <p className="text-sm text-[#6b6b6b]">{data.description}</p>

      <div className="w-full h-2 bg-[#e5dfd6] rounded-full overflow-hidden">
        <div
          className="h-full bg-black rounded-full transition-all duration-500"
          style={{ width: `${data.progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-[#8a8a8a]">
        <span>{data.progressLabel}</span>
        <span>{data.timeRemaining}</span>
      </div>
    </div>
  );
};

export const MissionPanel: React.FC<MissionPanelProps> = ({
  data,
  onMissionClick,
}) => {
  return (
    <div className="bg-[#faf7f2] border border-[#e5dfd6] rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1f1f1f]">{data.title}</h3>
          <div className="text-sm text-[#6b6b6b]">
            {data.completedToday}/{data.totalToday} completed
          </div>
        </div>
        <div className="text-lg font-semibold text-[#1f1f1f]">{data.completionPercent}%</div>
      </div>

      <div className="w-full h-2 bg-[#e5dfd6] rounded-full overflow-hidden">
        <div
          className="h-full bg-black rounded-full transition-all duration-500"
          style={{ width: `${data.completionPercent}%` }}
        />
      </div>

      <div className="space-y-3">
        {data.activeMissions.map((mission) => (
          <MissionCard
            key={mission.id}
            data={mission}
            onClick={() => onMissionClick?.(mission.id)}
          />
        ))}
      </div>

      {data.activeMissions.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-[#6b6b6b]">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#f0ebe5] text-[#444]">
            <Icon name="check-circle" size={20} className="w-5 h-5 object-contain" />
          </div>
          <p className="text-sm text-[#6b6b6b]">All missions completed!</p>
        </div>
      )}
    </div>
  );
};
