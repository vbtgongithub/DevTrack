import React from 'react';
import { useSessionState } from '../state/useSessionState';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export const JobMatchSection: React.FC = () => {
  const { currentSession } = useSessionState();
  const report = currentSession?.reportData;

  if (!report) return null;

  const ats = report.atsAnalysis;
  const roleAlignment = report.roleAlignment;
  const exec = report.executiveSummary;
  const recommendations = report.recommendations || [];
  const credibility = report.credibilityAnalysis;

  // ATS score breakdown — derive sub-scores from available data
  const breakdownItems = [
    { label: 'Keywords', value: ats?.keywordScore ?? Math.round((ats?.atsScore ?? 0) * 0.85) ?? 0 },
    { label: 'Formatting', value: ats?.formattingScore ?? ((ats?.parserWarnings?.length ?? 0) > 0 ? Math.max(50, (ats?.atsScore ?? 0) - 10) : Math.min(95, (ats?.atsScore ?? 0) + 10)) ?? 0 },
    { label: 'Structure', value: ats?.structureScore ?? Math.min(95, (ats?.atsScore ?? 0) + 15) ?? 0 },
    { label: 'Impact', value: ats?.impactScore ?? Math.max(40, (ats?.atsScore ?? 0) - 15) ?? 0 },
    { label: 'Credibility', value: credibility?.overallScore ?? 0 },
  ];

  // Keyword gap from parser warnings
  const keywordGaps = (ats?.parserWarnings || []).map((w: any, idx: number) => ({
    id: idx,
    keyword: w.message || w,
    severity: w.severity || 'warning',
    suggestion: w.suggestion || 'Review and address',
  }));

  // Missing skills from recommendations
  const missingSkills = {
    critical: recommendations.filter((r: any) => (r.impact?.scoreImprovement ?? 0) >= 8 || r.category === 'ats').map((r: any) => r.suggestion || r.title),
    recommended: recommendations.filter((r: any) => (r.impact?.scoreImprovement ?? 0) >= 4 && (r.impact?.scoreImprovement ?? 0) < 8).map((r: any) => r.suggestion || r.title),
    optional: recommendations.filter((r: any) => (r.impact?.scoreImprovement ?? 0) < 4 && (r.impact?.scoreImprovement ?? 0) > 0).map((r: any) => r.suggestion || r.title),
  };

  // Role alignment
  const roles = roleAlignment ? [
    { label: 'Backend Engineer', val: roleAlignment.backend, color: 'from-emerald-500 to-teal-500' },
    { label: 'Platform Engineer', val: roleAlignment.platform, color: 'from-violet-500 to-indigo-500' },
    { label: 'DevOps Engineer', val: roleAlignment.devops, color: 'from-blue-500 to-indigo-500' },
    { label: 'ML Engineer', val: roleAlignment.ml, color: 'from-pink-500 to-rose-500' },
    { label: 'Full Stack Engineer', val: roleAlignment.fullstack, color: 'from-teal-500 to-cyan-500' },
  ].filter((r) => r.val != null).sort((a, b) => b.val - a.val) : [];

  const topRole = roles[0];

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  const getSeverityBadge = (severity: string) => {
    if (severity === 'critical') return 'bg-rose-50 text-rose-600 border-rose-100';
    if (severity === 'warning') return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-slate-50 text-slate-500 border-slate-100';
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-6">

      {/* ATS Score Breakdown */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-[rgba(124,92,252,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-6">
        <p className="text-section-label mb-5">ATS Score Breakdown</p>
        <div className="flex flex-col gap-4">
          {breakdownItems.map((item) => (
            <div key={item.label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-dt-textSecondary">{item.label}</span>
                <span className="text-[13px] font-bold text-dt-text">{item.value}/100</span>
              </div>
              <div className="w-full h-2 bg-[rgba(124,92,252,0.06)] rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    item.value >= 80 ? 'bg-emerald-500' :
                    item.value >= 60 ? 'bg-amber-500' :
                    'bg-rose-400'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Keyword Gap Analysis */}
      {keywordGaps.length > 0 && (
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-[rgba(124,92,252,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-6">
          <p className="text-section-label mb-4">Keyword Gap Analysis</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[rgba(124,92,252,0.06)]">
                  <th className="pb-3 font-semibold text-dt-textMuted text-[11px] uppercase tracking-wider">Issue</th>
                  <th className="pb-3 font-semibold text-dt-textMuted text-[11px] uppercase tracking-wider">Priority</th>
                  <th className="pb-3 font-semibold text-dt-textMuted text-[11px] uppercase tracking-wider">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {keywordGaps.map((gap: any) => (
                  <tr key={gap.id} className="border-b border-[rgba(124,92,252,0.03)]">
                    <td className="py-3 font-medium text-dt-text pr-4">{gap.keyword}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getSeverityBadge(gap.severity)}`}>
                        {gap.severity}
                      </span>
                    </td>
                    <td className="py-3 text-dt-textSecondary">{gap.suggestion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Missing Skills */}
      {(missingSkills.critical.length > 0 || missingSkills.recommended.length > 0 || missingSkills.optional.length > 0) && (
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-[rgba(124,92,252,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-6">
          <p className="text-section-label mb-4">Missing Skills</p>
          <div className="flex flex-col gap-4">
            {missingSkills.critical.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> Critical
                </p>
                <div className="flex flex-wrap gap-2">
                  {missingSkills.critical.map((s: string, i: number) => (
                    <span key={i} className="text-[12px] font-medium text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {missingSkills.recommended.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Recommended
                </p>
                <div className="flex flex-wrap gap-2">
                  {missingSkills.recommended.map((s: string, i: number) => (
                    <span key={i} className="text-[12px] font-medium text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {missingSkills.optional.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Optional
                </p>
                <div className="flex flex-wrap gap-2">
                  {missingSkills.optional.map((s: string, i: number) => (
                    <span key={i} className="text-[12px] font-medium text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Role Alignment */}
      {roles.length > 0 && (
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-[rgba(124,92,252,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-6">
          <p className="text-section-label mb-4">Role Alignment</p>
          <div className="flex flex-col gap-3">
            {roles.map((role) => (
              <div key={role.label} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-dt-textSecondary">{role.label}</span>
                  <span className="text-[13px] font-bold text-dt-text">{role.val}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${role.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${role.val}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>
          {roleAlignment?.alignmentExplanation && (
            <p className="text-[12px] text-dt-textMuted font-medium leading-relaxed mt-4 italic">
              {roleAlignment.alignmentExplanation}
            </p>
          )}
        </motion.div>
      )}

      {/* Job Match Summary */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-[rgba(124,92,252,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-6">
        <p className="text-section-label mb-3">Job Match Summary</p>
        <div className="p-4 rounded-xl bg-[rgba(124,92,252,0.02)] border border-[rgba(124,92,252,0.05)]">
          <p className="text-[14px] font-semibold text-dt-text mb-1">
            {topRole && topRole.val >= 80 ? 'Strong Match' : topRole && topRole.val >= 60 ? 'Moderate Match' : 'Needs Improvement'}
          </p>
          <p className="text-[13px] text-dt-textSecondary leading-relaxed">
            {exec?.narrative || report.finalVerdict || 'Analysis complete. Review recommendations for improvement areas.'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
