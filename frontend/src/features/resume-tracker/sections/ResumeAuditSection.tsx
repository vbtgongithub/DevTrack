import React from 'react';
import { useSessionState } from '../state/useSessionState';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Shield, ShieldAlert, Cpu, Layers, Network } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <motion.div variants={fadeUp} className={`bg-white rounded-2xl border border-[rgba(124,92,252,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-6 ${className}`}>
    {children}
  </motion.div>
);

export const ResumeAuditSection: React.FC = () => {
  const { currentSession } = useSessionState();
  const report = currentSession?.reportData;

  if (!report) return null;

  const ats = report.atsAnalysis;
  const credibility = report.credibilityAnalysis;
  const recruiter = report.recruiterProjection;
  const confidence = report.confidenceReport;
  const infra = report.infrastructureMaturity;
  const parsedContent = currentSession?.parsedContent;
  const sections = parsedContent?.sections || {};
  const sectionNames = Object.keys(sections);
  const diagnostics = parsedContent?.parsingDiagnostics;

  // Formatting warnings
  const formattingWarnings = ats?.parserWarnings || [];
  const formattingIssues = ats?.formattingWarnings || currentSession?.atsState?.formattingWarnings || [];

  // Structure checklist
  const expectedSections = ['Experience', 'Education', 'Skills', 'Projects', 'Summary', 'Certifications'];
  const structureItems = expectedSections.map((name) => {
    const found = sectionNames.some((s) => s.toLowerCase().includes(name.toLowerCase()));
    return { label: name, found };
  });
  const completeness = Math.round((structureItems.filter(s => s.found).length / structureItems.length) * 100);

  // Recruiter readiness
  const recruiterScore = credibility?.overallScore ?? 0;

  // Credibility
  const verifiedClaims = credibility?.verifiedClaims || [];
  const unsupportedClaims = credibility?.unsupportedClaims || [];
  const credWarnings = credibility?.warnings || [];

  // Engineering signals
  const roleAlignment = report.roleAlignment;
  const tech = infra?.detectedTechnologies || [];
  const infraMaturity = infra?.deploymentMaturity || 'unknown';
  const observability = infra?.observabilityScore ?? 0;

  // Project rankings
  const projectRankings = credibility?.projectRankings || [];

  // Confidence
  const parsingConfidence = diagnostics?.confidence ? Math.round(diagnostics.confidence * 100) : (confidence?.parsingConfidence ?? 0);
  const parsingWarnings = diagnostics?.warnings || [];
  const parsingErrors = diagnostics?.errors || [];

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-5">

      {/* Formatting Review */}
      <Card>
        <p className="text-section-label mb-4">Formatting Review</p>
        {formattingWarnings.length > 0 || formattingIssues.length > 0 ? (
          <div className="flex flex-col gap-3">
            {formattingWarnings.map((w: any, idx: number) => (
              <div key={`pw-${idx}`} className="flex items-start gap-3 p-3 rounded-xl bg-[rgba(124,92,252,0.02)] border border-[rgba(124,92,252,0.05)]">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 mt-0.5 ${
                  w.severity === 'critical' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                  w.severity === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  'bg-slate-50 text-slate-500 border-slate-100'
                }`}>{w.severity || 'info'}</span>
                <div>
                  <p className="text-[13px] font-medium text-dt-text">{w.message || w}</p>
                  {w.suggestion && <p className="text-[12px] text-dt-textMuted mt-1">{w.suggestion}</p>}
                </div>
              </div>
            ))}
            {formattingIssues.map((issue: string, idx: number) => (
              <div key={`fi-${idx}`} className="flex items-start gap-2 text-[13px] text-dt-textSecondary font-medium p-3 rounded-xl bg-amber-50/40 border border-amber-100/60">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{issue}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[13px] text-emerald-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            No formatting issues detected. ATS parser-safe layout.
          </div>
        )}
      </Card>

      {/* Structure Review + Section Completeness */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <p className="text-section-label">Structure Review</p>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
            completeness >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
            completeness >= 50 ? 'text-amber-600 bg-amber-50 border-amber-100' :
            'text-rose-600 bg-rose-50 border-rose-100'
          }`}>{completeness}% Complete</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {structureItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-dt-textSecondary">{item.label}</span>
              {item.found
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                : <XCircle className="w-4 h-4 text-rose-400" />
              }
            </div>
          ))}
        </div>
      </Card>

      {/* Trust Score + Recruiter Reality Check */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <p className="text-section-label mb-3">Trust Score</p>
          <div className="flex items-end gap-3">
            <span className={`text-3xl font-bold leading-none ${recruiterScore >= 80 ? 'text-emerald-600' : recruiterScore >= 60 ? 'text-amber-600' : 'text-rose-500'}`}>
              {recruiterScore}
            </span>
            <span className="text-[12px] text-dt-textMuted font-medium mb-1">/ 100</span>
          </div>
          <p className="text-[12px] text-dt-textMuted font-medium mt-2 capitalize">
            {report.executiveSummary?.recruiterTrustLevel || 'Moderate'} recruiter trust level
          </p>
        </Card>

        {recruiter && (
          <Card>
            <p className="text-section-label mb-3">Recruiter Reality Check</p>
            <div className="flex flex-col gap-2.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-dt-textMuted font-medium">Likely ATS Pass</span>
                <span className={`font-semibold ${ats?.atsScore >= 60 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {ats?.atsScore >= 60 ? 'Yes' : 'Uncertain'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dt-textMuted font-medium">Recruiter Response</span>
                <span className="font-semibold text-dt-text capitalize">{report.executiveSummary?.recruiterTrustLevel || 'Moderate'}</span>
              </div>
              {recruiter.rejectionTriggers?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[rgba(124,92,252,0.06)]">
                  <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider mb-1.5">Rejection Triggers</p>
                  {recruiter.rejectionTriggers.slice(0, 3).map((t: string, idx: number) => (
                    <p key={idx} className="text-[12px] text-dt-textSecondary font-medium leading-relaxed italic">• {t}</p>
                  ))}
                </div>
              )}
              {recruiter.interviewTriggers?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[rgba(124,92,252,0.06)]">
                  <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5">Interview Triggers</p>
                  {recruiter.interviewTriggers.slice(0, 3).map((t: string, idx: number) => (
                    <p key={idx} className="text-[12px] text-dt-textSecondary font-medium leading-relaxed italic">• {t}</p>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Credibility Analysis */}
      <Card>
        <p className="text-section-label mb-4">Credibility Analysis</p>
        {verifiedClaims.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Verified Claims
            </p>
            <div className="flex flex-col gap-2">
              {verifiedClaims.map((claim: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-[13px] text-dt-textSecondary font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{claim}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {(unsupportedClaims.length > 0 || credWarnings.length > 0) && (
          <div className={verifiedClaims.length > 0 ? 'pt-4 border-t border-[rgba(124,92,252,0.06)]' : ''}>
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Evidence Validation Issues
            </p>
            <div className="flex flex-col gap-2">
              {unsupportedClaims.map((claim: string, idx: number) => (
                <div key={`u-${idx}`} className="flex items-start gap-2 text-[13px] text-dt-textSecondary font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{claim}</span>
                </div>
              ))}
              {credWarnings.map((w: string, idx: number) => (
                <div key={`w-${idx}`} className="flex items-start gap-2 text-[13px] text-dt-textMuted font-medium">
                  <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {verifiedClaims.length === 0 && unsupportedClaims.length === 0 && credWarnings.length === 0 && (
          <div className="flex items-center gap-2 text-[13px] text-emerald-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            No significant credibility mismatches detected.
          </div>
        )}
      </Card>

      {/* Engineering Signals + Infrastructure Maturity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Network className="w-4 h-4 text-dt-primary" />
            <p className="text-section-label">Engineering Signals</p>
          </div>
          {roleAlignment ? (
            <div className="flex flex-col gap-3">
              {[
                { label: 'Backend', val: roleAlignment.backend },
                { label: 'Platform', val: roleAlignment.platform },
                { label: 'DevOps', val: roleAlignment.devops },
                { label: 'Full Stack', val: roleAlignment.fullstack },
                { label: 'ML', val: roleAlignment.ml },
              ].filter(r => r.val != null).sort((a, b) => b.val - a.val).slice(0, 4).map((role) => (
                <div key={role.label} className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-dt-textSecondary">{role.label}</span>
                  <span className={`text-[13px] font-bold ${role.val >= 70 ? 'text-emerald-600' : role.val >= 40 ? 'text-amber-600' : 'text-dt-textMuted'}`}>
                    {role.val}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-dt-textMuted font-medium">No engineering signals extracted.</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-dt-primary" />
            <p className="text-section-label">Infrastructure Maturity</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-dt-textSecondary">Deployment Stack</span>
              <span className="text-[13px] font-semibold text-dt-text capitalize">{infraMaturity}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-dt-textSecondary">Observability</span>
              <span className={`text-[13px] font-bold ${observability >= 60 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {observability}/100
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-dt-textSecondary">CI/CD</span>
              <span className="text-[13px] font-semibold text-dt-text">{infra?.ciCdEvidence ? 'Detected' : 'Not detected'}</span>
            </div>
            {tech.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[rgba(124,92,252,0.06)]">
                <p className="text-[11px] font-bold text-dt-textMuted uppercase tracking-wider mb-2">Detected Technologies</p>
                <div className="flex flex-wrap gap-1.5">
                  {tech.map((t: string, i: number) => (
                    <span key={i} className="text-[11px] font-medium text-dt-primary bg-[rgba(124,92,252,0.06)] border border-[rgba(124,92,252,0.1)] px-2 py-0.5 rounded-md">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Project Authenticity */}
      {projectRankings.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-dt-primary" />
            <p className="text-section-label">Project Authenticity</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[rgba(124,92,252,0.06)]">
                  <th className="pb-3 font-semibold text-dt-textMuted text-[11px] uppercase tracking-wider">Project</th>
                  <th className="pb-3 font-semibold text-dt-textMuted text-[11px] uppercase tracking-wider text-center">Originality</th>
                  <th className="pb-3 font-semibold text-dt-textMuted text-[11px] uppercase tracking-wider text-center">Infra Depth</th>
                  <th className="pb-3 font-semibold text-dt-textMuted text-[11px] uppercase tracking-wider text-right">Signal</th>
                </tr>
              </thead>
              <tbody>
                {projectRankings.map((p: any, idx: number) => (
                  <tr key={idx} className="border-b border-[rgba(124,92,252,0.03)]">
                    <td className="py-3 font-medium text-dt-text">{p.name}</td>
                    <td className="py-3 text-center">
                      <span className={`text-[12px] font-bold ${p.originalityScore > 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {p.originalityScore}%
                      </span>
                    </td>
                    <td className="py-3 text-center text-dt-textSecondary">{p.infrastructureDepth}%</td>
                    <td className="py-3 text-right text-[12px] text-dt-textMuted font-medium">{p.engineeringSignal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Parser Warnings + Analysis Confidence */}
      <Card>
        <p className="text-section-label mb-4">Analysis Confidence</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[12px] font-semibold text-dt-textMuted mb-1">Parsing Confidence</p>
            <p className={`text-2xl font-bold ${parsingConfidence >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {parsingConfidence}%
            </p>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-dt-textMuted mb-2">Sections Parsed</p>
            <div className="flex flex-wrap gap-1.5">
              {sectionNames.map((name) => (
                <span key={name} className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">{name}</span>
              ))}
              {sectionNames.length === 0 && <span className="text-[12px] text-dt-textMuted">No sections detected</span>}
            </div>
          </div>
        </div>
        {(parsingWarnings.length > 0 || parsingErrors.length > 0) && (
          <div className="mt-4 pt-4 border-t border-[rgba(124,92,252,0.06)]">
            {parsingErrors.length > 0 && (
              <div className="mb-3">
                <p className="text-[12px] font-semibold text-rose-600 mb-1.5">Errors</p>
                {parsingErrors.map((e: string, idx: number) => (
                  <p key={idx} className="text-[12px] text-dt-textMuted font-medium flex items-center gap-1.5 mb-1">
                    <XCircle className="w-3 h-3 text-rose-500" /> {e}
                  </p>
                ))}
              </div>
            )}
            {parsingWarnings.length > 0 && (
              <div>
                <p className="text-[12px] font-semibold text-amber-600 mb-1.5">Warnings</p>
                {parsingWarnings.map((w: string, idx: number) => (
                  <p key={idx} className="text-[12px] text-dt-textMuted font-medium flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3 h-3 text-amber-500" /> {w}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
};
