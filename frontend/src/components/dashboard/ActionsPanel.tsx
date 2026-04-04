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
        className="w-full border border-gray-200 rounded-xl py-3 hover:bg-gray-100 transition-all duration-200 active:scale-95 text-sm font-medium text-gray-900"
      >
        Log Activity
      </button>
      <button
        type="button"
        className="w-full border border-gray-200 rounded-xl py-3 hover:bg-gray-100 transition-all duration-200 active:scale-95 text-sm font-medium text-gray-900"
      >
        Review Mistakes
      </button>
    </div>
  );
};
