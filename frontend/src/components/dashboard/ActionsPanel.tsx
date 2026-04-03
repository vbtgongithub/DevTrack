import React from 'react';

export const ActionsPanel: React.FC = () => {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        className="w-full bg-black text-white rounded-xl py-3 font-medium hover:bg-[#222] transition-all duration-200 active:scale-95"
      >
        Create Project
      </button>
      <button
        type="button"
        className="w-full border border-[#d6d0c7] rounded-xl py-3 hover:bg-[#f0ebe5] transition-all duration-200 active:scale-95 text-sm font-medium text-[#1f1f1f]"
      >
        Log Activity
      </button>
      <button
        type="button"
        className="w-full border border-[#d6d0c7] rounded-xl py-3 hover:bg-[#f0ebe5] transition-all duration-200 active:scale-95 text-sm font-medium text-[#1f1f1f]"
      >
        Review Mistakes
      </button>
    </div>
  );
};
