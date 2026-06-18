import React from 'react';
import { useSessionState } from '../state/useSessionState';
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalysisHeaderProps {
  onOpenDiagnostics: () => void;
}

export const AnalysisHeader: React.FC<AnalysisHeaderProps> = ({ onOpenDiagnostics }) => {
  const { currentSession } = useSessionState();
  const report = currentSession?.reportData;
  const exec = report?.executiveSummary;
  const ats = report?.atsAnalysis;
  const recommendations = report?.recommendations || [];

  if (!report || !exec || !ats) {
    // Minimal header when report data isn't available yet
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full bg-white rounded-2xl border border-[rgba(124,92,252,0.08)] shadow-[0_4px_24px_rgba(124,92,252,0.06)] p-6 lg:p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-dt-text leading-tight">
              Resume Analysis
            </h1>
            <p className="text-[13px] text-dt-textSecondary font-medium mt-1">
              {currentSession?.fileInfo.fileName || 'Processing...'}
            </p>
          </div>
          <button
            onClick={onOpenDiagnostics}
            className="text-[11px] font-semibold text-dt-textMuted hover:text-dt-primary transition-colors uppercase tracking-wider"
          >
            View Diagnostics
          </button>
        </div>
      </motion.div>
    );
  }

  const atsScore = ats.atsScore ?? 0;

  // Compute potential score from recommendations
  const potentialGain = recommendations.reduce((sum: number, rec: any) => {
    const gain = rec.impact?.scoreImprovement ?? rec.atsImpact ?? 0;
    return sum + gain;
  }, 0);
  const potentialScore = Math.min(100, atsScore + potentialGain);

  // Top opportunity
  const topRec = recommendations[0];
  const topGain = topRec?.impact?.scoreImprovement ?? topRec?.atsImpact ?? 0;

  // Resume health indicators
  const hasFormattingIssues = (ats.parserWarnings?.length ?? 0) > 0;
  const hasKeywordGaps = recommendations.some((r: any) => r.category === 'ats' || r.category === 'role_alignment');
  const credScore = report.credibilityAnalysis?.overallScore ?? 0;
  const recruiterReady = credScore >= 70;
  const structureOk = (report.confidenceReport?.parsedSections?.length ?? Object.keys(currentSession?.parsedContent?.sections || {}).length ?? 0) >= 3;

  const healthItems = [
    { label: 'ATS Ready', ok: atsScore >= 60, warn: atsScore >= 40 && atsScore < 60 },
    { label: 'Recruiter Ready', ok: recruiterReady, warn: credScore >= 50 && credScore < 70 },
    { label: 'Formatting', ok: !hasFormattingIssues, warn: false },
    { label: 'Keyword Coverage', ok: !hasKeywordGaps, warn: hasKeywordGaps },
    { label: 'Structure', ok: structureOk, warn: false },
  ];

  const getHealthIcon = (item: { ok: boolean; warn: boolean }) => {
    if (item.ok) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    if (item.warn) return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
    return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-rose-500';
  };

  // SVG circular progress
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - atsScore / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full bg-white rounded-2xl border border-[rgba(124,92,252,0.08)] shadow-[0_4px_24px_rgba(124,92,252,0.06)] p-6 lg:p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-dt-text leading-tight">
            Resume Analysis Complete
          </h1>
          <p className="text-[13px] text-dt-textSecondary font-medium mt-1">
            {currentSession?.fileInfo.fileName}
          </p>
        </div>
        <button
          onClick={onOpenDiagnostics}
          className="text-[11px] font-semibold text-dt-textMuted hover:text-dt-primary transition-colors uppercase tracking-wider"
        >
          View Diagnostics
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* ATS Score */}
        <div className="flex items-center gap-4">
          <div className="relative w-[88px] h-[88px] shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r={radius} stroke="rgba(124,92,252,0.08)" strokeWidth="6" fill="transparent" />
              <motion.circle
                cx="44" cy="44" r={radius}
                stroke="url(#atsGrad)"
                strokeWidth="6"
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              />
              <defs>
                <linearGradient id="atsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7C5CFC" />
                  <stop offset="100%" stopColor="#A78BFA" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold leading-none ${getScoreColor(atsScore)}`}>{atsScore}</span>
              <span className="text-[9px] font-semibold text-dt-textMuted uppercase tracking-wider mt-0.5">/100</span>
            </div>
          </div>
          <div>
            <p className="text-section-label">Current ATS Score</p>
            <p className="text-[13px] font-semibold text-dt-text mt-1 capitalize">{exec.atsSurvivability} Compatibility</p>
          </div>
        </div>

        {/* Potential Score */}
        <div className="flex flex-col justify-center gap-1.5 p-4 rounded-xl bg-[rgba(124,92,252,0.03)] border border-[rgba(124,92,252,0.06)]">
          <p className="text-section-label">Potential ATS Score</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-dt-primary leading-none">{potentialScore}</span>
            <span className="text-[11px] font-semibold text-dt-textMuted mb-0.5">/100</span>
          </div>
          {potentialGain > 0 && (
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{potentialGain} Available
            </span>
          )}
        </div>

        {/* Resume Health */}
        <div className="flex flex-col gap-2">
          <p className="text-section-label">Resume Health</p>
          <div className="flex flex-col gap-1.5">
            {healthItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                {getHealthIcon(item)}
                <span className="text-[12px] font-medium text-dt-textSecondary">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Opportunity */}
        {topRec && (
          <div className="flex flex-col justify-center gap-2 p-4 rounded-xl bg-emerald-50/60 border border-emerald-100/80">
            <p className="text-section-label text-emerald-700/70">Top Opportunity</p>
            <p className="text-[13px] font-semibold text-dt-text leading-snug">
              {topRec.suggestion || topRec.title || 'Improve resume structure'}
            </p>
            {topGain > 0 && (
              <span className="text-[12px] font-bold text-emerald-600 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                +{topGain} ATS Points
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
