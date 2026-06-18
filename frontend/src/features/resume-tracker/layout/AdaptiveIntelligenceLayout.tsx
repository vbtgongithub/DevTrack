import React, { type ReactNode } from 'react';

interface AdaptiveIntelligenceLayoutProps {
  leftCol: ReactNode;
  centerCol: ReactNode;
  rightCol: ReactNode;
}

export const AdaptiveIntelligenceLayout: React.FC<AdaptiveIntelligenceLayoutProps> = ({
  leftCol,
  centerCol,
  rightCol
}) => {
  return (
    <div className="w-full flex flex-col xl:flex-row gap-6 max-w-[1600px] mx-auto pb-10">
      
      {/* LEFT COLUMN: Upload, ATS Overview, Credibility (350px fixed on wide, flex on small) */}
      <div className="w-full xl:w-[350px] shrink-0 flex flex-col gap-6">
        {leftCol}
      </div>

      {/* CENTER COLUMN: Intelligence Extraction, Recommendations, Optimization (Flexes to fill) */}
      <div className="w-full xl:flex-1 flex flex-col gap-6 min-w-0">
        {centerCol}
      </div>

      {/* RIGHT COLUMN: Replay Timeline, Observability, Evolution (300px fixed on wide, flex on small) */}
      <div className="w-full xl:w-[300px] shrink-0 flex flex-col gap-6">
        {rightCol}
      </div>

    </div>
  );
};
