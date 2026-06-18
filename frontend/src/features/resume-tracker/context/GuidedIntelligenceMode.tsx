import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface GuidedIntelligenceContextType {
  isActive: boolean;
  toggleGuidedMode: () => void;
}

const GuidedIntelligenceContext = createContext<GuidedIntelligenceContextType | undefined>(undefined);

export const GuidedIntelligenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);

  const toggleGuidedMode = () => setIsActive(prev => !prev);

  return (
    <GuidedIntelligenceContext.Provider value={{ isActive, toggleGuidedMode }}>
      {children}
    </GuidedIntelligenceContext.Provider>
  );
};

export const useGuidedIntelligence = () => {
  const context = useContext(GuidedIntelligenceContext);
  if (context === undefined) {
    throw new Error('useGuidedIntelligence must be used within a GuidedIntelligenceProvider');
  }
  return context;
};

export const GuidedTooltip: React.FC<{ content: string; children: ReactNode }> = ({ content, children }) => {
  const { isActive } = useGuidedIntelligence();

  if (!isActive) return <>{children}</>;

  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-slate-800 text-white text-[11px] font-medium rounded-lg shadow-lg pointer-events-none">
        <div className="flex items-start gap-2">
          <span className="text-emerald-400 font-bold shrink-0">?</span>
          <span>{content}</span>
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};
