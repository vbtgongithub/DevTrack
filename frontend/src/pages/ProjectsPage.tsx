import React from 'react';
import { PageShell } from '../components/layout/PageShell';
import { Icon, type IconName } from '../components/shared/Icon';
import { EmptyState } from '../components/shared/EmptyState';
import { useProjectsData } from '../hooks/useProjectsData';
import githubLogo from '../assets/logos/github.png';
import { motion, useScroll, useTransform } from 'framer-motion';
import type { ProjectCardVM } from '../types/vm.types';
import type { ApiProjectCreatePayload } from '../types/api.types';

/* ─── Types ─── */
type ProjectFilter = 'All' | 'Active' | 'Completed';

/* ─── Helpers ─── */
const FILTERS: ProjectFilter[] = ['All', 'Active', 'Completed'];

function progressBarColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'from-emerald-500 via-emerald-400 to-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]';
    case 'in_progress':
      return 'from-dt-primary via-dt-secondary to-dt-primary shadow-[0_0_12px_rgba(124,92,252,0.4)]';
    case 'planning':
      return 'from-indigo-500 via-indigo-400 to-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.3)]';
    default:
      return 'from-dt-textMuted/30 to-dt-textMuted/10';
  }
}

function isActiveStatus(status: string): boolean {
  return status === 'in_progress' || status === 'planning';
}

function statusProgress(card: ProjectCardVM): number {
  if (card.status === 'completed') return 100;
  if (card.milestonesProgress) return card.milestonesProgress.percent;
  if (card.status === 'planning') return 10;
  if (card.status === 'in_progress') return 50;
  return 0;
}

/* ─── Create Project Modal ─── */
const CreateProjectModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onCreate: (payload: ApiProjectCreatePayload) => Promise<void>;
}> = ({ open, onClose, onCreate }) => {
  const [form, setForm] = React.useState({
    name: '',
    description: '',
    repoUrl: '',
    liveUrl: '',
    techStack: '',
    status: 'planning' as const,
    visibility: 'private' as const,
  });
  const [saving, setSaving] = React.useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onCreate({
        name: form.name.trim(),
        description: form.description.trim(),
        repoUrl: form.repoUrl.trim() || undefined,
        liveUrl: form.liveUrl.trim() || undefined,
        techStack: form.techStack
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        status: form.status,
        visibility: form.visibility,
      });
      onClose();
      setForm({ name: '', description: '', repoUrl: '', liveUrl: '', techStack: '', status: 'planning', visibility: 'private' });
    } catch {
      // Error is handled by the hook
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dt-bg/80 backdrop-blur-md" onClick={onClose}>
      <div
        className="bg-white/95 backdrop-blur-3xl border border-dt-primary/10 rounded-[32px] shadow-dt-floating w-full max-w-lg p-10 mx-4 animate-[dtFadeIn_400ms_cubic-bezier(0.22,1,0.36,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-[22px] font-black text-dt-text tracking-tighter leading-none">New Project</h2>
            <p className="text-[10px] font-black text-dt-textSecondary/40 tracking-[0.15em] uppercase mt-2">Initialize workspace vector</p>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-[14px] bg-dt-primary/5 hover:bg-dt-primary/10 border border-dt-primary/10 hover:border-dt-primary/20 cursor-pointer transition-all duration-300 group flex items-center justify-center">
            <Icon name="x-mark" size={20} className="text-dt-primary/60 group-hover:text-dt-primary transition-colors" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="group/field">
            <label className="text-label mb-2 block">Project Identity</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="dt-input w-full"
              placeholder="System name..."
              required
            />
          </div>

          <div>
            <label className="text-label mb-2 block">Description Matrix</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="dt-input w-full resize-none"
              rows={3}
              placeholder="Define project scope and architecture..."
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-label mb-2 block">Lifecycle</label>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
                  className="dt-input w-full appearance-none cursor-pointer pr-10"
                >
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <Icon name="chevron-down" size={14} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase text-dt-textSecondary/50 mb-2">Access Control</label>
              <div className="relative">
                <select
                  value={form.visibility}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value as typeof form.visibility })}
                  className="w-full px-5 py-4 bg-dt-bg/40 border border-dt-primary/10 rounded-[16px] text-[14px] font-bold text-dt-text outline-none focus:border-dt-primary/30 focus:bg-white shadow-sm transition-all duration-500 appearance-none cursor-pointer"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <Icon name="chevron-down" size={14} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-label mb-2 block">Tech Spectrum</label>
            <input
              type="text"
              value={form.techStack}
              onChange={(e) => setForm({ ...form, techStack: e.target.value })}
              className="dt-input w-full"
              placeholder="React, TypeScript, GraphQL..."
            />
          </div>

          <div>
            <label className="text-label mb-2 block">Repository Vector</label>
            <input
              type="url"
              value={form.repoUrl}
              onChange={(e) => setForm({ ...form, repoUrl: e.target.value })}
              className="dt-input w-full"
              placeholder="https://github.com/..."
            />
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="dt-btn dt-btn-ghost dt-btn-md px-6"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="dt-btn dt-btn-primary dt-btn-md px-10 shadow-dt-floating"
            >
              {saving ? 'Processing…' : 'Initialize Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Component ─── */
const ProjectsPage: React.FC = () => {
  const {
    data,
    status,
    error,
    refresh,
    createProject,
    deleteProject,
  } = useProjectsData();

  const [filter, setFilter] = React.useState<ProjectFilter>('All');
  const [mounted, setMounted] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const projects = React.useMemo(() => data?.projects ?? [], [data]);

  const filteredProjects = React.useMemo(() => {
    if (filter === 'All') return projects;
    if (filter === 'Completed') return projects.filter((p) => p.status === 'completed');
    return projects.filter((p) => isActiveStatus(p.status));
  }, [filter, projects]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project architecture from the node?')) return;
    setDeletingId(id);
    try {
      await deleteProject(id);
    } catch {
      // Handled by hook
    } finally {
      setDeletingId(null);
    }
  };

  /* ─── Scroll-Linked Atmosphere ─── */
  const { scrollYProgress } = useScroll();
  const orb1Y = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const orb3Y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  /* ─── Filter Toggle Group ─── */
  const filterGroup = (
    <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-3xl border border-dt-primary/10 rounded-[20px] p-1.5 shadow-[0_8px_30px_rgba(124,92,252,0.06)] relative group/filters">
      {FILTERS.map((key) => {
        const isSelected = filter === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={[
              'relative px-6 py-3 text-[11px] font-black tracking-[0.2em] uppercase rounded-[16px] cursor-pointer transition-colors duration-300 z-10',
              isSelected ? 'text-white' : 'text-dt-textSecondary/50 hover:text-dt-text',
            ].join(' ')}
          >
            {isSelected && (
              <motion.div
                layoutId="activeFilterPill"
                className="absolute inset-0 bg-dt-text rounded-[16px] shadow-dt-floating border border-white/10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{key}</span>
          </button>
        );
      })}
    </div>
  );

  /* ─── Header Actions ─── */
  const headerActions = (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {filterGroup}
      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="dt-btn dt-btn-primary dt-btn-lg px-8 shadow-dt-floating"
      >
        <div className="relative flex h-2 w-2 z-10">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <Icon name="plus" size={14} className="relative text-white" />
        </div>
        <span className="relative z-10">Initialize Node</span>
      </button>
    </div>
  );

  /* ─── Loading Skeleton ─── */
  if (status === 'loading' && !data) {
    return (
      <PageShell title="My Projects" subtitle="Managing development architecture vectors" status="loading" error={null}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="dt-card p-10 animate-pulse rounded-[32px]">
              <div className="h-4 bg-dt-primary/10 rounded w-16 mb-8" />
              <div className="h-8 bg-dt-primary/10 rounded w-3/4 mb-4" />
              <div className="h-4 bg-dt-primary/5 rounded w-full mb-8" />
              <div className="h-2 bg-dt-primary/5 rounded-full w-full mb-6" />
              <div className="h-4 bg-dt-primary/5 rounded w-1/3" />
            </div>
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <div className={['transition-all duration-1000 cubic-bezier(0.22, 1, 0.36, 1)', mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'].join(' ')}>
      <PageShell
        title="Engineering Project Control Center"
        subtitle="AI-assisted workspace architecture"
        status={status === 'loading' ? 'success' : status}
        error={error}
        actions={headerActions}
        onRetry={refresh}
      >
        {/* Elite Atmospheric System — Ultra-Subtle Mesh Gradients */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Subtle Lavender Diffusion */}
          <motion.div style={{ y: orb1Y }} className="absolute top-[-5%] left-[10%] w-[900px] h-[900px] bg-dt-lavender/5 rounded-full blur-[160px] opacity-40 animate-pulse" />
          <motion.div style={{ y: orb2Y }} className="absolute bottom-[-5%] right-[5%] w-[800px] h-[800px] bg-dt-primary/3 rounded-full blur-[140px] opacity-30 animate-pulse" />

          {/* Depth-Based Lighting */}
          <motion.div style={{ y: orb3Y }} className="absolute top-[30%] right-[15%] w-[500px] h-[500px] bg-indigo-500/2 rounded-full blur-[110px] opacity-15" />
          <div className="absolute bottom-[15%] left-[20%] w-[400px] h-[400px] bg-dt-secondary/2 rounded-full blur-[100px] opacity-10" />

          {/* Cinema Softness Layer */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(124,92,252,0.01)_100%)]" />
        </div>

        {/* ─── Content ─── */}
        <div className="relative z-10 mx-auto w-full max-w-[1300px]">

          {/* Empty State */}
          {filteredProjects.length === 0 ? (
            <EmptyState
              title={projects.length === 0 ? 'Project Log Empty' : 'No Vectors Found'}
              description={projects.length === 0 ? 'Initialize your first project architecture to start tracking development intelligence.' : 'Refine search filters to locate specific project nodes.'}
              icon="folder"
              action={
                projects.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="inline-flex items-center gap-3 rounded-[18px] px-8 py-4 text-[11px] font-black tracking-[0.25em] uppercase bg-dt-text text-white shadow-dt-floating hover:bg-dt-primary hover:shadow-dt-card-hover hover:-translate-y-1 transition-all duration-700 cubic-bezier(0.22, 1, 0.36, 1)"
                  >
                    <Icon name="plus" size={16} className="text-white" />
                    Initialize Node
                  </button>
                )
              }
            />
          ) : (
            /* ─── Project Intelligence Grid: Orchestrated Hierarchy ─── */
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-24">
              {filteredProjects.map((p, index) => {
                const progress = statusProgress(p);
                const isActive = isActiveStatus(p.status);

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className={[
                      'group/project-card',
                      'bg-white/40 backdrop-blur-3xl border border-white/40 rounded-[32px] p-0 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden',
                      'hover:shadow-[0_40px_100px_rgba(124,92,252,0.12)] hover:-translate-y-2 hover:bg-white/60',
                      'transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)',
                      deletingId === p.id ? 'opacity-40 grayscale pointer-events-none' : '',
                    ].join(' ')}
                  >
                    {/* ── Background Intelligence Layer ── */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" 
                         style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #7C5CFC 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-dt-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none z-0" />
                    
                    <div className="flex flex-col h-full relative z-10">
                      {/* ── Top Bar: Identity & Real-time Status ── */}
                      <div className="flex items-start justify-between p-8 pb-6">
                        <div className="flex items-center gap-6">
                          {/* Glowing Icon Container */}
                          <div className="relative group/icon">
                            <div className="absolute -inset-2 bg-gradient-to-tr from-dt-primary to-dt-secondary rounded-[22px] blur-xl opacity-0 group-hover/project-card:opacity-20 transition-opacity duration-700" />
                            <div className="w-16 h-16 rounded-[20px] bg-white border border-dt-primary/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex items-center justify-center shrink-0 group-hover/project-card:scale-105 group-hover/project-card:border-dt-primary/30 transition-all duration-700 overflow-hidden relative">
                              <div className="absolute inset-0 bg-gradient-to-tr from-dt-primary/10 to-transparent opacity-0 group-hover/project-card:opacity-100 transition-opacity" />
                              <img src={githubLogo} alt="" className="w-8 h-8 object-contain opacity-80 group-hover/project-card:opacity-100 transition-opacity relative z-10" />
                            </div>
                            {isActive && (
                              <div className="absolute -bottom-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                              </div>
                            )}
                          </div>
                          
                          <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-1.5">
                              <h3 className="text-[24px] font-black text-dt-text tracking-tighter leading-none group-hover/project-card:text-dt-primary transition-colors duration-500">
                                {p.name}
                              </h3>
                              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-dt-text text-white text-[9px] font-black uppercase tracking-widest border border-white/10 shadow-sm">
                                <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                                v2.4.0
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-dt-primary/5 border border-dt-primary/10">
                                <span className="text-[9px] font-black text-dt-primary uppercase tracking-widest">Active Node</span>
                              </div>
                              <span className="text-dt-textSecondary/30 font-bold">•</span>
                              <p className="text-[11px] font-bold text-dt-textSecondary/50 uppercase tracking-[0.2em]">Infrastructure Vector</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                           <div className="flex flex-col items-end gap-1.5 mr-2">
                             <span className="text-[9px] font-black text-dt-textSecondary/40 uppercase tracking-widest">System Load</span>
                             <div className="flex gap-0.5">
                               {[1, 2, 3, 4, 5].map(i => (
                                 <div key={i} className={`w-3 h-1 rounded-full ${i <= 3 ? 'bg-emerald-400' : 'bg-dt-textSecondary/10'}`} />
                               ))}
                             </div>
                           </div>
                           <button
                             type="button"
                             onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                             className="w-11 h-11 rounded-[16px] bg-white/50 hover:bg-red-50 hover:text-red-600 border border-dt-primary/10 hover:border-red-200 shadow-sm flex items-center justify-center transition-all duration-300 opacity-0 group-hover/project-card:opacity-100 -translate-y-2 group-hover/project-card:translate-y-0"
                           >
                             <Icon name="trash" size={18} />
                           </button>
                        </div>
                      </div>

                      {/* ── Middle Area: Rich Summary & Engineering Blocks ── */}
                      <div className="flex flex-col lg:flex-row flex-1">
                        <div className="flex-1 p-8 pt-2 flex flex-col gap-8 border-r border-dt-primary/5">
                          <p className="text-[16px] text-dt-textSecondary/70 font-medium leading-relaxed line-clamp-3">
                            {p.description || 'Neural link established. System node operational with default architecture matrices. Analyzing cluster performance and deployment vector...'}
                          </p>

                          {/* Engineering Telemetry Blocks */}
                          <div className="grid grid-cols-3 gap-4">
                            {[
                              { label: 'Health', value: '100%', color: 'text-emerald-500', icon: 'zap' },
                              { label: 'Latency', value: '42ms', color: 'text-dt-primary', icon: 'activity' },
                              { label: 'Uptime', value: '99.9%', color: 'text-dt-secondary', icon: 'clock' },
                            ].map((block) => (
                              <div key={block.label} className="bg-dt-bg/40 border border-dt-primary/5 rounded-[20px] p-4 flex flex-col gap-2 group/block hover:border-dt-primary/20 transition-colors">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-black text-dt-textSecondary/40 uppercase tracking-widest">{block.label}</span>
                                  <Icon name={block.icon as IconName} size={12} className={block.color} />
                                </div>
                                <span className={`text-[16px] font-black text-dt-text tracking-tighter ${block.color}`}>{block.value}</span>
                              </div>
                            ))}
                          </div>

                          {/* Tech Spectrum: Interactive Capsules */}
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-black text-dt-textSecondary/40 uppercase tracking-[0.3em]">Neural Stack</span>
                              <div className="h-px flex-1 mx-4 bg-gradient-to-r from-dt-primary/10 to-transparent" />
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                              {p.techStack.length > 0 ? (
                                p.techStack.slice(0, 5).map((tag) => (
                                  <motion.div
                                    key={tag}
                                    whileHover={{ y: -3, scale: 1.05 }}
                                    className="px-4 py-2 rounded-[14px] bg-white border border-dt-primary/10 flex items-center gap-2 group/tag cursor-pointer hover:border-dt-primary/40 hover:shadow-lg transition-all duration-500 shadow-sm"
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-dt-primary group-hover/tag:animate-pulse" />
                                    <span className="text-[11px] font-black text-dt-textSecondary tracking-wide uppercase">{tag}</span>
                                  </motion.div>
                                ))
                              ) : (
                                <div className="px-4 py-2 rounded-[14px] border border-dashed border-dt-textSecondary/20 text-[11px] font-bold text-dt-textSecondary/30 uppercase tracking-widest">Stack Undefined</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ── Live Node Telemetry System ── */}
                        <div className="lg:w-[280px] bg-gradient-to-b from-dt-primary/[0.02] to-transparent p-8 flex flex-col gap-8 relative overflow-hidden group/telemetry">
                           {/* Tiny Activity Graph Overlay */}
                           <div className="absolute top-0 right-0 w-full h-32 opacity-10 pointer-events-none">
                             <svg viewBox="0 0 200 60" className="w-full h-full">
                               <path d="M0 40 Q 25 35, 50 45 T 100 35 T 150 45 T 200 30" fill="none" stroke="#7C5CFC" strokeWidth="1" />
                             </svg>
                           </div>

                           <div className="flex flex-col gap-4 relative z-10">
                             <div className="flex items-center justify-between">
                               <div className="flex flex-col gap-1">
                                 <span className="text-[10px] font-black text-dt-primary uppercase tracking-widest">Node Sync</span>
                                 <div className="flex items-center gap-1.5">
                                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                   <span className="text-[12px] font-black text-dt-text uppercase tracking-widest">Online</span>
                                 </div>
                               </div>
                               <div className="text-right">
                                 <span className="text-[24px] font-black text-dt-text tabular-nums tracking-tighter leading-none">{progress}%</span>
                               </div>
                             </div>

                             {/* Advanced Sync Bar */}
                             <div className="h-[10px] w-full bg-white border border-dt-primary/10 rounded-full overflow-hidden relative shadow-inner">
                               <motion.div
                                 initial={{ width: 0 }}
                                 animate={{ width: `${progress}%` }}
                                 transition={{ duration: 1.5, ease: "circOut" }}
                                 className={[
                                   'h-full rounded-full relative',
                                   progressBarColor(p.status),
                                 ].join(' ')}
                               >
                                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                               </motion.div>
                             </div>
                           </div>

                           {/* Secondary Metrics Grid */}
                           <div className="flex flex-col gap-4 relative z-10">
                              <div className="p-4 rounded-[20px] bg-white/50 border border-dt-primary/5 flex items-center justify-between hover:border-dt-primary/20 transition-all">
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-dt-textSecondary/40 uppercase tracking-widest">Throughput</span>
                                  <span className="text-[13px] font-black text-dt-text tracking-tight uppercase">1.2 GB/s</span>
                                </div>
                                <div className="w-10 h-1 rounded-full bg-emerald-400/20 relative overflow-hidden">
                                  <div className="absolute inset-0 bg-emerald-400 animate-[shimmer_1.5s_infinite]" />
                                </div>
                              </div>

                              {/* Mini Analytics: System Pulse */}
                              <div className="p-4 rounded-[20px] bg-dt-text text-white flex items-center justify-between shadow-lg">
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Active Pulse</span>
                                  <span className="text-[13px] font-black text-white tracking-tight uppercase">High Frequency</span>
                                </div>
                                <Icon name="bolt" size={16} className="text-amber-400" />
                              </div>
                           </div>

                           <motion.button
                             whileHover={{ scale: 1.02, y: -2 }}
                             whileTap={{ scale: 0.98 }}
                             className="mt-auto w-full py-4 rounded-[18px] bg-dt-primary text-white text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(124,92,252,0.2)] hover:shadow-[0_20px_50px_rgba(124,92,252,0.3)] transition-all duration-500"
                           >
                             Access Core
                             <Icon name="arrow-right" size={14} className="group-hover/telemetry:translate-x-1 transition-transform" />
                           </motion.button>
                        </div>
                      </div>

                      {/* ── Redesigned Footer: Premium Identity ── */}
                      <div className="px-8 py-6 border-t border-dt-primary/5 bg-dt-bg/20 flex items-center justify-between">
                        <div className="flex items-center gap-10">
                          <div className="flex items-center gap-3 group/stat cursor-pointer">
                            <div className="w-9 h-9 rounded-[12px] bg-amber-500/5 flex items-center justify-center border border-amber-500/10 group-hover/stat:bg-amber-500 group-hover/stat:text-white transition-all duration-300">
                              <Icon name="star" size={14} className="text-amber-500 group-hover/stat:text-white transition-colors" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[15px] font-black text-dt-text leading-none">{p.stars}</span>
                              <span className="text-[9px] font-black text-dt-textSecondary/40 uppercase tracking-widest mt-1">Stars</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 group/stat cursor-pointer">
                            <div className="w-9 h-9 rounded-[12px] bg-dt-primary/5 flex items-center justify-center border border-dt-primary/10 group-hover/stat:bg-dt-primary group-hover/stat:text-white transition-all duration-300">
                              <Icon name="clock" size={14} className="text-dt-primary group-hover/stat:text-white transition-colors" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[14px] font-bold text-dt-textSecondary/80 leading-none">{p.updatedAgo}</span>
                              <span className="text-[9px] font-black text-dt-textSecondary/40 uppercase tracking-widest mt-1">Telemetry</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {p.repoUrl && (
                            <button
                              onClick={() => window.open(p.repoUrl!, '_blank')}
                              className="px-5 py-2.5 rounded-[14px] bg-white border border-dt-primary/10 flex items-center gap-3 hover:border-dt-text hover:shadow-lg transition-all duration-300 group/gh"
                            >
                              <Icon name="github" size={18} className="text-dt-textSecondary/50 group-hover/gh:text-dt-text transition-colors" />
                              <span className="text-[11px] font-black text-dt-textSecondary group-hover/gh:text-dt-text tracking-widest uppercase">Source</span>
                            </button>
                          )}
                          {p.liveUrl && (
                            <button
                              onClick={() => window.open(p.liveUrl!, '_blank')}
                              className="px-5 py-2.5 rounded-[14px] bg-dt-text border border-white/5 flex items-center gap-3 hover:bg-dt-primary hover:shadow-[0_10px_30px_rgba(124,92,252,0.3)] transition-all duration-300 group/live"
                            >
                              <Icon name="external-link" size={16} className="text-white/60 group-hover/live:text-white transition-colors" />
                              <span className="text-[11px] font-black text-white tracking-widest uppercase">Terminal</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </PageShell>

      {/* ─── Create Modal ─── */}
      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={createProject}
      />
    </div>
  );
};

export default ProjectsPage;
