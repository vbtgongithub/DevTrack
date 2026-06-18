import React from 'react';
import { useSessionState } from '../state/useSessionState';
import { TrendingUp, Zap, CheckCircle2, AlertTriangle, Shield, Brain, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export const OverviewSection: React.FC = () => {
  const { currentSession } = useSessionState();
  const report = currentSession?.reportData;

  if (!report) return null;

  const atsScore = report.atsAnalysis?.atsScore ?? 0;
  const recommendations = report.recommendations || [];
  const exec = report.executiveSummary;
  const credibility = report.credibilityAnalysis;
  const confidence = report.confidenceReport;
  const diagnostics = currentSession?.parsedContent?.parsingDiagnostics;

  // Compute potential score
  const potentialGain = recommendations.reduce((sum: number, rec: any) => {
    return sum + (rec.impact?.scoreImprovement ?? rec.atsImpact ?? 0);
  }, 0);
  const potentialScore = Math.min(100, atsScore + potentialGain);

  // Health summary
  const hasFormattingIssues = (report.atsAnalysis?.parserWarnings?.length ?? 0) > 0;
  const credScore = credibility?.overallScore ?? 0;
  const sections = currentSession?.parsedContent?.sections || {};
  const sectionNames = Object.keys(sections);

  const healthItems = [
    { label: 'ATS Ready', status: atsScore >= 60 ? 'pass' : atsScore >= 40 ? 'warn' : 'fail' },
    { label: 'Recruiter Ready', status: credScore >= 70 ? 'pass' : credScore >= 50 ? 'warn' : 'fail' },
    { label: 'Formatting', status: hasFormattingIssues ? 'warn' : 'pass' },
    { label: 'Keyword Coverage', status: recommendations.some((r: any) => r.category === 'ats') ? 'warn' : 'pass' },
    { label: 'Structure', status: sectionNames.length >= 3 ? 'pass' : 'warn' },
  ];

  const statusIcon = (status: string) => {
    if (status === 'pass') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === 'warn') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    return <span className="w-4 h-4 text-rose-400 text-center font-bold text-xs">✗</span>;
  };

  // Top 3 opportunities
  const topOpportunities = recommendations.slice(0, 3);

  // Recruiter readiness
  const recruiterTrust = exec?.recruiterTrustLevel || 'Moderate';

  // Interview probability — derived from ATS + credibility + role alignment
  const interviewProbability = Math.min(100, Math.round(
    (atsScore * 0.4) + (credScore * 0.3) + ((exec?.operationalReadiness ?? 60) * 0.3)
  ));

  // Analysis confidence
  const parsingConfidence = diagnostics?.confidence
    ? Math.round(diagnostics.confidence * 100)
    : (confidence?.parsingConfidence ?? 85);

  // Quick AI summary
  const quickSummary = exec?.narrative
    || report.finalVerdict
    || `Your resume has an ATS score of ${atsScore}/100. ${potentialGain > 0 ? `There are ${potentialGain} points of improvement available.` : 'No major issues detected.'}`;

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  // Card wrapper helper
  const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <motion.div variants={fadeUp} className={`bg-white rounded-2xl border border-[rgba(124,92,252,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-6 ${className}`}>
      {children}
    </motion.div>
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-5">

      {/* Row 1: ATS Score + Potential Score */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="flex flex-col items-center gap-3">
          <p className="text-section-label w-full">Current ATS Score</p>
          <div className="relative w-[120px] h-[120px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" stroke="rgba(124,92,252,0.06)" strokeWidth="8" fill="transparent" />
              <motion.circle
                cx="60" cy="60" r="52"
                stroke="url(#atsOverviewGrad)"
                strokeWidth="8"
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52}
                initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - atsScore / 100) }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              />
              <defs>
                <linearGradient id="atsOverviewGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7C5CFC" />
                  <stop offset="100%" stopColor="#A78BFA" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-dt-text leading-none">{atsScore}</span>
              <span className="text-[10px] font-semibold text-dt-textMuted uppercase mt-1">/ 100</span>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col items-center gap-3">
          <p className="text-section-label w-full">Potential ATS Score</p>
          <div className="relative w-[120px] h-[120px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" stroke="rgba(34,197,94,0.06)" strokeWidth="8" fill="transparent" />
              <motion.circle
                cx="60" cy="60" r="52"
                stroke="rgba(34,197,94,0.7)"
                strokeWidth="8"
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52}
                initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - potentialScore / 100) }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-emerald-600 leading-none">{potentialScore}</span>
              <span className="text-[10px] font-semibold text-dt-textMuted uppercase mt-1">/ 100</span>
            </div>
          </div>
          {potentialGain > 0 && (
            <span className="text-[12px] font-semibold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +{potentialGain} Available
            </span>
          )}
        </Card>
      </div>

      {/* Row 2: Resume Health + Top Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <p className="text-section-label mb-4">Resume Health</p>
          <div className="flex flex-col gap-3">
            {healthItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-dt-textSecondary">{item.label}</span>
                {statusIcon(item.status)}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-section-label mb-4">Top Opportunities</p>
          <div className="flex flex-col gap-3">
            {topOpportunities.length > 0 ? topOpportunities.map((rec: any, idx: number) => {
              const gain = rec.impact?.scoreImprovement ?? rec.atsImpact ?? 0;
              return (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[rgba(124,92,252,0.02)] border border-[rgba(124,92,252,0.05)]">
                  <span className="text-[13px] font-medium text-dt-text leading-snug pr-3">
                    {rec.suggestion || rec.title || 'Improve resume'}
                  </span>
                  {gain > 0 && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 whitespace-nowrap shrink-0 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> +{gain}
                    </span>
                  )}
                </div>
              );
            }) : (
              <p className="text-[13px] text-dt-textMuted font-medium">No actionable gaps detected.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Row 3: Recruiter Readiness + Interview Probability + Analysis Confidence */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-section-label mb-3">Recruiter Readiness</p>
          <div className="flex items-end gap-2">
            <span className={`text-2xl font-bold leading-none ${credScore >= 80 ? 'text-emerald-600' : credScore >= 60 ? 'text-amber-600' : 'text-rose-500'}`}>
              {credScore}
            </span>
            <span className="text-[11px] font-semibold text-dt-textMuted mb-0.5">/ 100</span>
          </div>
          <p className="text-[12px] text-dt-textMuted font-medium mt-2 capitalize flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-dt-textMuted" /> {recruiterTrust} trust
          </p>
        </Card>

        <Card>
          <p className="text-section-label mb-3">Interview Probability</p>
          <div className="flex items-end gap-2">
            <span className={`text-2xl font-bold leading-none ${interviewProbability >= 70 ? 'text-emerald-600' : interviewProbability >= 50 ? 'text-amber-600' : 'text-rose-500'}`}>
              {interviewProbability}%
            </span>
          </div>
          <p className="text-[12px] text-dt-textMuted font-medium mt-2 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-dt-textMuted" />
            {interviewProbability >= 70 ? 'Likely to pass screening' : interviewProbability >= 50 ? 'May need improvements' : 'Unlikely without changes'}
          </p>
        </Card>

        <Card>
          <p className="text-section-label mb-3">Analysis Confidence</p>
          <div className="flex items-end gap-2">
            <span className={`text-2xl font-bold leading-none ${parsingConfidence >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {parsingConfidence}%
            </span>
          </div>
          <p className="text-[12px] text-dt-textMuted font-medium mt-2 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-dt-textMuted" />
            {parsingConfidence >= 90 ? 'High accuracy' : 'Moderate — some data gaps'}
          </p>
        </Card>
      </div>

      {/* Row 4: Quick Summary */}
      <Card>
        <p className="text-section-label mb-3">Quick Summary</p>
        <div className="p-4 rounded-xl bg-[rgba(124,92,252,0.02)] border border-[rgba(124,92,252,0.05)]">
          <p className="text-[14px] text-dt-text leading-relaxed font-medium">
            {quickSummary}
          </p>
        </div>
        {recommendations.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Key Weaknesses</p>
            <ul className="flex flex-col gap-1.5">
              {recommendations.slice(0, 3).map((rec: any, idx: number) => (
                <li key={idx} className="text-[13px] text-dt-textSecondary font-medium flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  {rec.suggestion || rec.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </motion.div>
  );
};
