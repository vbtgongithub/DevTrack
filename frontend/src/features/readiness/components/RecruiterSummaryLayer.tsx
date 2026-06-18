import React from 'react';
import { Card } from '../../../components/ui/Card';
import type { ReadinessSnapshot } from '../../../services/readinessService';

interface Props {
  data: ReadinessSnapshot;
}

export const RecruiterSummaryLayer: React.FC<Props> = ({ data }) => {
  const { projects, dsa, core } = data.rawMetrics;

  const projectScore = projects?.projectCredibilityScore || 0;
  const hardDsa = dsa?.hardProblemProgression || 0;

  let summary = "The candidate is building foundational skills.";
  if (projectScore > 70 && hardDsa > 50) {
    summary = "Strong verified project execution coupled with excellent medium/hard DSA progression.";
  } else if (projectScore > 70) {
    summary = "Demonstrates strong system design exposure and verifiable project deployment maturity.";
  } else if (hardDsa > 70) {
    summary = "Exceptional problem-solving depth and consistency in algorithmic mastery.";
  }

  return (
    <Card className="p-6 bg-slate-50 border border-slate-200 rounded-[24px]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800">Recruiter Profile Summary</h3>
      </div>
      
      <div className="p-4 bg-white border border-slate-200 rounded-xl">
        <p className="text-slate-700 text-sm leading-relaxed font-medium">
          "{summary}"
        </p>
      </div>
      
      <div className="mt-4 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-500 font-medium">Evidence-Backed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${core?.isDegraded ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <span className="text-xs text-slate-500 font-medium">
            {core?.isDegraded ? 'Reduced Confidence' : 'High Confidence'}
          </span>
        </div>
      </div>
    </Card>
  );
};
