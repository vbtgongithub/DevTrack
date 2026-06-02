import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, ArrowRight, Zap, Clock, Star, Map, Target, RefreshCcw, BookOpen, PlayCircle } from 'lucide-react';
import { useReadinessDomain } from '../../features/readiness/hooks/useReadinessData';
import { WorkspaceHeader } from '../../features/readiness/components/WorkspaceHeader';
import { TrustConfidenceLayer } from '../../features/readiness/components/TrustConfidenceLayer';
import type { ReadinessRoadmapDomainResponse } from '../../services/readinessService';
import { readinessService } from '../../services/readinessService';
import { EmptyState } from '../../components/shared/EmptyState';
import { analyticsService } from '../../services/analyticsService';

// ─── Progress Ring ───
const ProgressRing: React.FC<{ percent: number; size?: number }> = ({ percent, size = 120 }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative text-emerald-500" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ delay: 0.15, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-slate-800 tracking-tighter">{percent}%</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Progress</span>
      </div>
    </div>
  );
};

const SkillBadge: React.FC<{
  kind: 'success' | 'warning' | 'priority' | 'neutral';
  children: React.ReactNode;
}> = ({ kind, children }) => {
  const styles =
    kind === 'success'
      ? 'bg-emerald-50/80 border border-emerald-200/60 text-emerald-700 shadow-sm'
      : kind === 'warning'
        ? 'bg-amber-50/80 border border-amber-200/60 text-amber-700 shadow-sm'
        : kind === 'priority'
          ? 'bg-indigo-50/80 border border-indigo-200/60 text-indigo-700 shadow-sm'
          : 'bg-white/80 border border-slate-200/60 text-slate-700 shadow-sm';

  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md ${styles}`}>
      {children}
    </span>
  );
};

const CareerDiscoveryForm: React.FC<{ onComplete: () => void; onCancel?: () => void }> = ({ onComplete, onCancel }) => {
  const [targetRole, setTargetRole] = React.useState('Backend Developer');
  const [goal, setGoal] = React.useState('First Job');
  const [experienceLevel, setExperienceLevel] = React.useState('Beginner');
  const [weeklyHours, setWeeklyHours] = React.useState('10');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await readinessService.setIntent({
        dreamRole: targetRole,
        goal,
        experienceLevel,
        weeklyHours: Number(weeklyHours),
      });
      if (res.success) {
        analyticsService.trackEvent('career_discovery_completed', {
          targetRole,
          weeklyHours: Number(weeklyHours)
        });
        onComplete();
      } else {
        setSubmitError('Failed to generate career roadmap. Please try again.');
      }
    } catch (err) {
      setSubmitError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm mt-8"
    >
      <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-2">Career Discovery</h3>
      <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
        Choose your target role and goals to customize your personalized learning roadmap.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Role</label>
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            <option value="Backend Developer">Backend Developer</option>
            <option value="Frontend Developer">Frontend Developer</option>
            <option value="Full Stack Developer">Full Stack Developer</option>
            <option value="DevOps Engineer">DevOps Engineer</option>
            <option value="AI Engineer">AI Engineer</option>
            <option value="Data Analyst">Data Analyst</option>
            <option value="Mobile Developer">Mobile Developer</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Goal</label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            <option value="Internship">Internship</option>
            <option value="First Job">First Job</option>
            <option value="Job Switch">Job Switch</option>
            <option value="Promotion">Promotion</option>
            <option value="Freelancing">Freelancing</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Experience Level</label>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hours Per Week</label>
          <select
            value={weeklyHours}
            onChange={(e) => setWeeklyHours(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            <option value="5">5 Hours</option>
            <option value="10">10 Hours</option>
            <option value="15">15 Hours</option>
            <option value="20">20+ Hours</option>
          </select>
        </div>

        {submitError && (
          <p className="text-xs font-semibold text-rose-500 flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {submitError}
          </p>
        )}

        <div className="flex gap-3 mt-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-6 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 font-bold rounded-xl active:translate-y-0.5 transition-all text-sm"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 active:translate-y-0.5 transition-all text-sm"
          >
            {isSubmitting ? 'Generating V1 Roadmap...' : 'Generate Personalized Roadmap'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

const FeedbackWidget: React.FC = () => {
  const [rating, setRating] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (submitted) {
    return (
      <div className="mt-8 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-emerald-800 font-medium">
        Thank you for your feedback! It helps us improve DevTrack.
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!rating) return;
    setIsSubmitting(true);
    try {
      await analyticsService.submitFeedback(rating, feedback, 'roadmap');
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
      <h4 className="text-lg font-bold text-slate-800 mb-4">Was this roadmap useful?</h4>
      <div className="flex gap-4 mb-6">
        {[
          { icon: '👍', label: 'Very Useful' },
          { icon: '🙂', label: 'Somewhat Useful' },
          { icon: '👎', label: 'Not Useful' }
        ].map(r => (
          <button
            key={r.label}
            onClick={() => setRating(r.icon)}
            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${rating === r.icon ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
          >
            <span className="text-2xl">{r.icon}</span>
            <span className="text-xs font-bold text-slate-600">{r.label}</span>
          </button>
        ))}
      </div>

      {rating && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <label className="block text-sm font-bold text-slate-600 mb-2">What would make DevTrack more useful for you?</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-4 min-h-[100px]"
            placeholder="Tell us what you liked or what's missing..."
          />
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </motion.div>
      )}
    </div>
  );
};

const RoadmapIntelligencePage: React.FC = () => {
  const { data, loading, error, refetch } = useReadinessDomain('roadmap');
  const [isEditing, setIsEditing] = useState(false);
  const [togglingSkills, setTogglingSkills] = useState<Record<string, boolean>>({});

  const [hasTrackedRoadmap, setHasTrackedRoadmap] = React.useState(false);

  React.useEffect(() => {
    if (data && !(data as any).noRoleSelected && !hasTrackedRoadmap && !loading && !error) {
      const rm = data as ReadinessRoadmapDomainResponse;
      if (rm && rm.currentStage !== 'Unknown') {
        analyticsService.trackEvent('roadmap_generated', {
          targetRole: rm.domain,
          roadmapProgress: rm.roadmapProgress,
          nextSkill: rm.nextSkill
        });
        setHasTrackedRoadmap(true);
      }
    }
  }, [data, hasTrackedRoadmap, loading, error]);

  const handleSkillToggle = async (skill: string, completed: boolean) => {
    if (togglingSkills[skill]) return;
    setTogglingSkills(prev => ({ ...prev, [skill]: true }));
    try {
      await readinessService.toggleSkillProgress(skill, completed);

      if (completed) {
        analyticsService.trackEvent('skill_marked_complete', {
          skill,
          newProgress: roadmap?.roadmapProgress
        });
      }

      await refetch();
    } finally {
      setTogglingSkills(prev => ({ ...prev, [skill]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 max-w-[1400px] mx-auto w-full pb-16 px-4 animate-pulse">
        <div className="h-20 w-80 bg-slate-200/50 rounded-2xl backdrop-blur-md" />
        <div className="h-40 bg-slate-200/50 rounded-3xl backdrop-blur-md" />
        <div className="h-64 bg-slate-200/50 rounded-3xl backdrop-blur-md" />
      </div>
    );
  }

  const roadmap = data as ReadinessRoadmapDomainResponse | undefined;

  const noRoleSelected = (data as any)?.noRoleSelected || !roadmap || roadmap.currentStage === 'Unknown';

  if (error || !roadmap) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <EmptyState
          size="lg"
          icon="alert"
          title="Unable to load roadmap intelligence."
          description="Please try again."
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }

  if (noRoleSelected || isEditing) {
    return (
      <div className="min-h-screen bg-slate-50/50 relative">
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-50/80 via-white to-transparent -z-10 pointer-events-none" />
        <div className="max-w-[1400px] mx-auto w-full pb-24 px-4 md:px-8">
          <div className="pt-6 pb-2">
            <WorkspaceHeader
              domain="Roadmap"
              title="Roadmap Intelligence"
              coreQuestion="What should I learn next, and why?"
              icon={<Map size={24} />}
              accentColor="#4f46e5"
            />
          </div>
          <CareerDiscoveryForm
            onComplete={() => {
              setIsEditing(false);
              refetch();
            }}
            onCancel={noRoleSelected ? undefined : () => setIsEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 relative">
      {/* Soft background glow */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-50/80 via-white to-transparent -z-10 pointer-events-none" />

      <div className="max-w-[1400px] mx-auto w-full pb-24 px-4 md:px-8">
        <div className="pt-6 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <WorkspaceHeader
            domain="Roadmap"
            title="Roadmap Intelligence"
            coreQuestion="What should I learn next, and why?"
            icon={<Map size={24} />}
            accentColor="#4f46e5"
          />
          <button
            onClick={() => setIsEditing(true)}
            className="mb-8 px-4 py-2.5 bg-white border border-slate-200/80 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:shadow active:translate-y-0.5 transition-all w-fit"
          >
            <RefreshCcw size={14} /> Reset & Learn Something Else
          </button>
        </div>

        <div className="flex flex-col gap-8 mt-6">
          {/* ─── Progress Overview (Hero) ─── */}
          <div className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl border border-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full blur-[80px] -mr-20 -mt-20 opacity-60" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="shrink-0">
                <ProgressRing percent={roadmap.roadmapProgress} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Total Progress</h3>
                <p className="text-slate-500 text-sm font-medium mb-6">Your personalized learning momentum and skill acquisition</p>

                <div className="flex flex-wrap justify-center md:justify-start gap-8">
                  <div className="flex flex-col items-center md:items-start group cursor-pointer">
                    <div className="text-3xl font-black text-slate-800 tracking-tighter group-hover:text-emerald-600 transition-colors">{(roadmap.verifiedSkills?.length || 0) + (roadmap.completedRoadmapSkills?.length || 0)}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Completed</div>
                  </div>
                  <div className="w-px h-12 bg-slate-200 hidden md:block" />
                  <div className="flex flex-col items-center md:items-start group cursor-pointer">
                    <div className="text-3xl font-black text-slate-800 tracking-tighter group-hover:text-amber-600 transition-colors">{roadmap.missingSkills.length}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Missing</div>
                  </div>
                  <div className="w-px h-12 bg-slate-200 hidden md:block" />
                  <div className="flex flex-col items-center md:items-start group cursor-pointer">
                    <div className="text-3xl font-black text-slate-800 tracking-tighter group-hover:text-indigo-600 transition-colors">{roadmap.prioritySkills.length}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Priority</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Stage / Next / Readiness Gain / Next Milestone ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-3xl bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-xl border border-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <Target size={16} />
                </div>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Current Stage</h3>
              </div>
              <div className="text-xl font-bold text-slate-800 tracking-tight mb-4">{roadmap.currentStage}</div>
              <div className="flex gap-1">
                {['Foundation', 'Intermediate', 'Advanced'].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 flex-1 rounded-full ${s === roadmap.currentStage ? 'bg-indigo-500' : 'bg-slate-200'
                      }`}
                    title={s}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-xl border border-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <ArrowRight size={16} />
                </div>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Next Skill</h3>
              </div>
              <div className="text-xl font-bold text-slate-800 tracking-tight mb-3 line-clamp-2">{roadmap.nextSkill}</div>
              <SkillBadge kind="priority">
                <Star size={12} className="mr-1.5" /> Recommended
              </SkillBadge>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-xl border border-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                  <Zap size={16} />
                </div>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Readiness Gain</h3>
              </div>
              <div className="text-3xl font-black text-slate-800 tracking-tighter">
                <span className="text-amber-500">+</span>{roadmap.readinessGain}<span className="text-lg font-bold text-slate-400 ml-1">%</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Estimated boost upon completion</p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-xl border border-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                  <Clock size={16} />
                </div>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Next Milestone</h3>
              </div>
              <div className="text-3xl font-black text-slate-800 tracking-tighter">
                {roadmap.estimatedWeeksToNextMilestone}<span className="text-lg font-bold text-slate-400 ml-1.5">wks</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Based on current progression rate</p>
            </div>
          </div>

          {/* ─── Skills Columns ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-3xl bg-white/60 backdrop-blur-md border border-white p-6 shadow-sm flex flex-col h-full">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2 pb-3 border-b border-slate-200/50">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle size={12} className="text-emerald-700" />
                </div>
                Completed Skills
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {(roadmap.verifiedSkills?.length || roadmap.completedRoadmapSkills?.length) ? (
                  <>
                    {roadmap.verifiedSkills?.map((s) => (
                      <SkillBadge key={s} kind="success">
                        <CheckCircle size={12} className="mr-1 inline" /> {s}
                      </SkillBadge>
                    ))}
                    {roadmap.completedRoadmapSkills?.map((s) => (
                      <label key={s} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${togglingSkills[s] ? 'opacity-50' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>
                        <input type="checkbox" checked={true} disabled={togglingSkills[s]} onChange={() => handleSkillToggle(s, false)} className="accent-emerald-600 cursor-pointer w-3.5 h-3.5" /> {s}
                      </label>
                    ))}
                  </>
                ) : (
                  <div className="text-sm text-slate-400 italic">No completed skills yet.</div>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white/60 backdrop-blur-md border border-white p-6 shadow-sm flex flex-col h-full">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2 pb-3 border-b border-slate-200/50">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle size={12} className="text-amber-700" />
                </div>
                Missing Skills
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {roadmap.missingSkills.length ? (
                  roadmap.missingSkills.map((s) => (
                    <label key={s} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${togglingSkills[s] ? 'opacity-50' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}>
                      <input type="checkbox" checked={false} disabled={togglingSkills[s]} onChange={() => handleSkillToggle(s, true)} className="accent-amber-600 cursor-pointer w-3.5 h-3.5" /> {s}
                    </label>
                  ))
                ) : (
                  <div className="text-sm text-slate-400 italic">Nothing missing. Great momentum!</div>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white/60 backdrop-blur-md border border-white p-6 shadow-sm flex flex-col h-full">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2 pb-3 border-b border-slate-200/50">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Target size={12} className="text-indigo-700" />
                </div>
                Priority Skills
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {roadmap.prioritySkills.length ? (
                  roadmap.prioritySkills.map((s) => (
                    <label key={s} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${togglingSkills[s] ? 'opacity-50' : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'}`}>
                      <input type="checkbox" checked={false} disabled={togglingSkills[s]} onChange={() => handleSkillToggle(s, true)} className="accent-indigo-600 cursor-pointer w-3.5 h-3.5" /> {s}
                    </label>
                  ))
                ) : (
                  <div className="text-sm text-slate-400 italic">No priority skills right now.</div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Bottom Section (Learning Path + Impact Skill) ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Learning Path */}
            <div className="lg:col-span-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Learning Path</h3>

              <div className="relative">
                {/* Connecting line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 hidden md:block" />

                <div className="flex flex-col md:flex-row gap-4 relative z-10">
                  {roadmap.nextThreeSkills.length ? (
                    roadmap.nextThreeSkills.slice(0, 3).map((s, idx) => (
                      <div key={`${s}_${idx}`} className="flex-1">
                        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group cursor-pointer relative">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            <span className="text-xs font-bold text-indigo-600 group-hover:text-white">{idx + 1}</span>
                          </div>
                          <div className="text-sm font-bold text-slate-800">{s}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-500 w-full py-4 text-center">No learning path generated yet.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Highest Impact Skill */}
            <div className="lg:col-span-4 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-8 shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-[80px] -mr-32 -mt-32 opacity-10" />
              <div className="relative z-10 h-full flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4 opacity-80">
                  <Star size={16} fill="currentColor" />
                  <h3 className="text-[11px] font-bold uppercase tracking-widest">Highest Impact Skill</h3>
                </div>
                <div className="text-3xl font-black tracking-tight leading-tight mb-4 group-hover:scale-105 transition-transform origin-left">
                  {roadmap.highestImpactSkill}
                </div>
                <p className="text-sm opacity-80 mt-auto">
                  Mastering this skill currently offers the largest readiness improvement for your profile.
                </p>
              </div>
            </div>

          </div>

          {/* ─── Learning Resource Section ─── */}
          {roadmap.nextSkillResource && (
            <div className={`mt-6 rounded-3xl backdrop-blur-xl border p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${roadmap.nextSkillResource.isFallback ? 'bg-slate-50/70 border-slate-200' : 'bg-white/70 border-white'}`}>
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="text-indigo-600" size={24} />
                <h3 className="text-xl font-black tracking-tight text-slate-800 flex items-center flex-wrap gap-3">
                  Learning Resource: {roadmap.nextSkillResource.skill}
                  {roadmap.nextSkillResource.isFallback && (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] uppercase tracking-wider font-bold rounded-full border border-amber-200 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> Community Resource Fallback
                    </span>
                  )}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Why & Project */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Why Learn This?</h4>
                    <p className="text-slate-700 leading-relaxed">{roadmap.nextSkillResource.whyLearn}</p>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="text-indigo-600" size={18} />
                      <h4 className="font-bold text-indigo-900">Practice Project</h4>
                    </div>
                    <p className="text-sm font-bold text-indigo-800 mb-1">{roadmap.nextSkillResource.practiceProject.title}</p>
                    <p className="text-sm text-indigo-700/80">{roadmap.nextSkillResource.practiceProject.description}</p>
                  </div>
                </div>

                {/* Right Column: Time & Resources */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Estimated Time</h4>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium border border-slate-200">
                      <Clock size={14} />
                      {roadmap.nextSkillResource.estimatedTime}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Curated Resources</h4>
                    <div className="space-y-3">
                      {roadmap.nextSkillResource.resources.map((res, i) => (
                        <a
                          key={i}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => {
                            analyticsService.trackEvent('resource_clicked', {
                              skill: roadmap.nextSkillResource?.skill,
                              resourceType: res.type,
                              provider: res.provider
                            });
                          }}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">
                              {res.type === 'video' || res.type === 'course' ? <PlayCircle size={18} /> : <BookOpen size={18} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-900 transition-colors">{res.title}</p>
                              <p className="text-xs text-slate-500">{res.provider}</p>
                            </div>
                          </div>
                          <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Trust ─── */}
          <div className="mt-4">
            <TrustConfidenceLayer
              confidence={(data as any)?.dynamicState?.confidence ?? (data as any)?.shared?.confidence ?? 0}
              verificationCoverage={roadmap.roadmapProgress}
            />
          </div>

          <FeedbackWidget />
        </div>
      </div>
    </div>
  );
};

export default RoadmapIntelligencePage;
// HMR trigger
