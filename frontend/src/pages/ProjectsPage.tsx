import React from 'react';
import { PageShell } from '../components/layout/PageShell';
import { Icon } from '../components/shared/Icon';
import { EmptyState } from '../components/shared/EmptyState';
import { useProjectsData } from '../hooks/useProjectsData';
import githubLogo from '../assets/logos/github.png';
import type { ProjectCardVM } from '../types/vm.types';
import type { ApiProjectCreatePayload } from '../types/api.types';

/* ─── Types ─── */
type ProjectFilter = 'All' | 'Active' | 'Completed';

/* ─── Helpers ─── */
const FILTERS: ProjectFilter[] = ['All', 'Active', 'Completed'];

function badgeClasses(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
    case 'in_progress':
      return 'bg-dt-primary/5 text-dt-primary border-dt-primary/10 shadow-[0_0_10px_rgba(124,92,252,0.1)]';
    case 'planning':
      return 'bg-indigo-500/5 text-indigo-600 border-indigo-500/10';
    case 'on_hold':
      return 'bg-amber-500/5 text-amber-600 border-amber-500/10';
    default:
      return 'bg-dt-textMuted/5 text-dt-textMuted border-dt-textMuted/10';
  }
}

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
            <label className="block text-[10px] font-black tracking-widest uppercase text-dt-textSecondary/50 mb-2 transition-colors group-focus-within/field:text-dt-primary">Project Identity</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-5 py-4 bg-dt-bg/40 border border-dt-primary/10 rounded-[16px] text-[15px] font-bold text-dt-text outline-none placeholder:text-dt-textSecondary/30 focus:border-dt-primary/30 focus:bg-white shadow-sm focus:shadow-dt-card transition-all duration-500"
              placeholder="System name..."
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase text-dt-textSecondary/50 mb-2">Description Matrix</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-5 py-4 bg-dt-bg/40 border border-dt-primary/10 rounded-[16px] text-[15px] font-bold text-dt-text outline-none placeholder:text-dt-textSecondary/30 focus:border-dt-primary/30 focus:bg-white shadow-sm focus:shadow-dt-card transition-all duration-500 resize-none"
              rows={3}
              placeholder="Define project scope and architecture..."
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase text-dt-textSecondary/50 mb-2">Lifecycle</label>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
                  className="w-full px-5 py-4 bg-dt-bg/40 border border-dt-primary/10 rounded-[16px] text-[14px] font-bold text-dt-text outline-none focus:border-dt-primary/30 focus:bg-white shadow-sm transition-all duration-500 appearance-none cursor-pointer"
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
            <label className="block text-[10px] font-black tracking-widest uppercase text-dt-textSecondary/50 mb-2">Tech Spectrum</label>
            <input
              type="text"
              value={form.techStack}
              onChange={(e) => setForm({ ...form, techStack: e.target.value })}
              className="w-full px-5 py-4 bg-dt-bg/40 border border-dt-primary/10 rounded-[16px] text-[15px] font-bold text-dt-text outline-none placeholder:text-dt-textSecondary/30 focus:border-dt-primary/30 focus:bg-white shadow-sm focus:shadow-dt-card transition-all duration-500"
              placeholder="React, TypeScript, GraphQL..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase text-dt-textSecondary/50 mb-2">Repository Vector</label>
            <input
              type="url"
              value={form.repoUrl}
              onChange={(e) => setForm({ ...form, repoUrl: e.target.value })}
              className="w-full px-5 py-4 bg-dt-bg/40 border border-dt-primary/10 rounded-[16px] text-[15px] font-bold text-dt-text outline-none placeholder:text-dt-textSecondary/30 focus:border-dt-primary/30 focus:bg-white shadow-sm focus:shadow-dt-card transition-all duration-500"
              placeholder="https://github.com/..."
            />
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 text-[12px] font-black tracking-[0.15em] uppercase rounded-[16px] border border-dt-primary/5 text-dt-textSecondary/60 hover:bg-white hover:text-dt-text hover:shadow-sm cursor-pointer transition-all duration-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className={[
                'px-8 py-3.5 text-[12px] font-black tracking-[0.15em] uppercase rounded-[16px] text-white cursor-pointer transition-all duration-700 cubic-bezier(0.22,1,0.36,1)',
                saving ? 'bg-dt-primary/40' : 'bg-dt-text hover:bg-dt-primary hover:shadow-dt-floating hover:-translate-y-1 active:scale-[0.98]',
              ].join(' ')}
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

  /* ─── Filter Toggle Group ─── */
  const filterGroup = (
    <div className="flex items-center gap-1.5 bg-white/40 backdrop-blur-2xl border border-dt-primary/5 rounded-[18px] p-1.5 shadow-sm group/filters">
      {FILTERS.map((key) => {
        const isSelected = filter === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={[
              'px-5 py-2.5 text-[10px] font-black tracking-[0.2em] uppercase rounded-[14px] cursor-pointer border border-transparent',
              'transition-all duration-700 cubic-bezier(0.22, 1, 0.36, 1)',
              isSelected
                ? 'bg-dt-text text-white shadow-dt-card border-dt-primary/10'
                : 'text-dt-textSecondary/40 hover:bg-white/60 hover:text-dt-text hover:border-dt-primary/10',
            ].join(' ')}
          >
            {key}
          </button>
        );
      })}
    </div>
  );

  /* ─── Header Actions ─── */
  const headerActions = (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      {filterGroup}
      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className={[
          'group/new-btn inline-flex items-center gap-3 rounded-[18px] px-7 py-3.5 text-[11px] font-black tracking-[0.25em] uppercase cursor-pointer',
          'bg-dt-text text-white shadow-dt-floating border border-dt-text/10',
          'hover:bg-dt-primary hover:border-dt-primary/20 hover:shadow-dt-card-hover hover:-translate-y-1',
          'active:scale-[0.96]',
          'transition-all duration-700 cubic-bezier(0.22, 1, 0.36, 1)',
        ].join(' ')}
      >
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dt-secondary opacity-75"></span>
          <Icon name="plus" size={14} className="relative text-white group-hover/new-btn:rotate-90 transition-transform duration-500" />
        </div>
        Initialize Node
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
        title="My Projects"
        subtitle="Manage and track your development work"
        status={status === 'loading' ? 'success' : status}
        error={error}
        actions={headerActions}
        onRetry={refresh}
      >
        {/* Elite Atmospheric System — Ultra-Subtle Mesh Gradients */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Subtle Lavender Diffusion */}
          <div className="absolute top-[-5%] left-[10%] w-[900px] h-[900px] bg-dt-lavender/5 rounded-full blur-[160px] opacity-40 animate-pulse" style={{ animationDuration: '18s' }} />
          <div className="absolute bottom-[-5%] right-[5%] w-[800px] h-[800px] bg-dt-primary/3 rounded-full blur-[140px] opacity-30 animate-pulse" style={{ animationDuration: '22s' }} />

          {/* Depth-Based Lighting */}
          <div className="absolute top-[30%] right-[15%] w-[500px] h-[500px] bg-indigo-500/2 rounded-full blur-[110px] opacity-15" />
          <div className="absolute bottom-[15%] left-[20%] w-[400px] h-[400px] bg-dt-secondary/2 rounded-full blur-[100px] opacity-10" />

          {/* Cinema Softness Layer */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(246,244,241,0.4)_100%)]" />
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
              {filteredProjects.map((p, index) => {
                const progress = statusProgress(p);
                const isActive = isActiveStatus(p.status);

                return (
                  <div
                    key={p.id}
                    className={[
                      'group/project-card',
                      'bg-white/40 backdrop-blur-[40px] border border-white/60 rounded-[28px] p-0 shadow-dt-card relative overflow-hidden',
                      'hover:shadow-dt-floating hover:-translate-y-1 hover:bg-white/60',
                      'transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)',
                      deletingId === p.id ? 'opacity-40 grayscale pointer-events-none' : '',
                    ].join(' ')}
                    style={{
                      animation: mounted ? `dtFadeIn 1000ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 80}ms both` : 'none',
                    }}
                  >
                    {/* Atmospheric Interior Depth — Extremely Subtle */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-dt-primary/[0.02] pointer-events-none" />
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_100%_0%,rgba(124,92,252,0.03),transparent_70%)] pointer-events-none" />

                    <div className="flex flex-col h-full">
                      {/* ── Top Bar: Control & Identity ── */}
                      <div className="flex items-center justify-between p-6 pb-5 border-b border-dt-primary/[0.03] relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-[14px] bg-white border border-dt-primary/10 shadow-sm flex items-center justify-center shrink-0 group-hover/project-card:scale-105 transition-all duration-500 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-dt-primary/5 to-transparent opacity-0 group-hover/project-card:opacity-100 transition-opacity" />
                            <img src={githubLogo} alt="" className="w-6 h-6 object-contain opacity-70 group-hover/project-card:opacity-100 transition-opacity relative z-10" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-[19px] font-black text-dt-text tracking-tight truncate group-hover/project-card:text-dt-primary transition-colors duration-500">
                                {p.name}
                              </h3>
                              <span className="text-[10px] font-black text-dt-textSecondary/30 uppercase tracking-[0.2em] select-none bg-dt-primary/5 px-2 py-0.5 rounded-full">v2.4.0</span>
                            </div>
                            <p className="text-[9px] font-black text-dt-textSecondary/50 uppercase tracking-[0.35em]">Infrastructure Vector</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              'px-4 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all duration-500',
                              badgeClasses(p.status),
                            ].join(' ')}
                          >
                            {p.statusLabel}
                          </span>
                          <div className="flex items-center gap-1.5 ml-2 opacity-0 group-hover/project-card:opacity-100 transition-all duration-500">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                              className="w-9 h-9 rounded-[12px] bg-white/80 hover:bg-red-50 hover:text-red-500 border border-dt-primary/5 hover:border-red-200 shadow-sm flex items-center justify-center transition-all duration-300"
                            >
                              <Icon name="trash" size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* ── Middle: Main Orchestration ── */}
                      <div className="flex flex-1 relative z-10 min-h-[180px]">
                        {/* Content Sector */}
                        <div className="flex-1 p-8 flex flex-col justify-between">
                          <p className="text-[15px] text-dt-textSecondary/80 font-medium leading-[1.7] mb-8 line-clamp-2">
                            {p.description || 'System node initialized with default architecture matrices. No descriptive override provided.'}
                          </p>

                          <div className="flex items-center gap-8 mt-auto">
                            <div className="flex flex-col gap-2">
                              <span className="text-[8px] font-black text-dt-textSecondary/40 uppercase tracking-[0.2em]">Primary Stack</span>
                              <div className="flex flex-wrap gap-2">
                                {p.techStack.length > 0 ? (
                                  p.techStack.slice(0, 3).map((tag) => (
                                    <span
                                      key={`${p.id}-${tag}`}
                                      className="bg-dt-bg/50 border border-dt-primary/5 text-dt-textSecondary/70 text-[9px] font-black tracking-[0.1em] uppercase px-3 py-1.5 rounded-[8px] group-hover/project-card:bg-white group-hover/project-card:border-dt-primary/10 transition-all duration-500"
                                    >
                                      {tag}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[9px] text-dt-textSecondary/20 font-bold tracking-widest italic">Void Stack</span>
                                )}
                              </div>
                            </div>

                            <div className="h-10 w-px bg-dt-primary/[0.06]" />

                            <div className="flex flex-col gap-2">
                              <span className="text-[8px] font-black text-dt-textSecondary/40 uppercase tracking-[0.2em]">Build Latency</span>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[12px] font-black text-dt-text tracking-tighter tabular-nums">142ms</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Telemetry Sidebar: High Density Instrument */}
                        <div className="w-[200px] border-l border-dt-primary/[0.05] bg-dt-primary/[0.005] p-8 flex flex-col gap-6">
                          {/* Progress Meter */}
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-dt-textSecondary/40 uppercase tracking-[0.25em]">Sync Level</span>
                              <span className="text-[16px] font-black text-dt-text tabular-nums">{progress}%</span>
                            </div>
                            <div className="h-[5px] w-full bg-dt-primary/5 rounded-full overflow-hidden relative">
                              <div
                                className={[
                                  'h-full rounded-full transition-all duration-1000 cubic-bezier(0.22, 1, 0.36, 1)',
                                  progressBarColor(p.status),
                                ].join(' ')}
                                style={{ width: mounted ? `${progress}%` : '0%' }}
                              />
                            </div>
                          </div>

                          {/* Data Matrix */}
                          <div className="grid grid-cols-2 gap-4 border-t border-dt-primary/[0.04] pt-5">
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-black text-dt-textSecondary/40 uppercase tracking-[0.2em] mb-1">Health</span>
                              <div className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                                <span className="text-[11px] font-black text-dt-text tracking-tight uppercase">Stable</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 text-right">
                              <span className="text-[8px] font-black text-dt-textSecondary/40 uppercase tracking-[0.2em] mb-1">Flow</span>
                              <div className="flex items-center gap-1.5 justify-end">
                                <Icon name="bolt" size={12} className="text-amber-500/80" />
                                <span className="text-[11px] font-black text-dt-text tracking-tight uppercase">High</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Anchor */}
                          <div className="mt-auto">
                            <button
                              className={[
                                'w-full py-3.5 rounded-[14px] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3',
                                'bg-dt-text text-white shadow-dt-floating relative overflow-hidden group/btn',
                                'hover:bg-dt-primary hover:shadow-dt-card-hover hover:-translate-y-0.5',
                                'transition-all duration-500 active:scale-[0.96] cubic-bezier(0.16, 1, 0.3, 1)'
                              ].join(' ')}
                              onClick={(e) => { e.stopPropagation(); }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                              <span className="relative z-10">Open Node</span>
                              <Icon name="arrow-right" size={12} className="relative z-10 opacity-60 group-hover/project-card:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* ── Footer: Granular System Meta ── */}
                      <div className="p-5 px-8 border-t border-dt-primary/[0.04] bg-white/20 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-amber-500/5 flex items-center justify-center">
                              <Icon name="star" size={12} className="text-amber-500/70" />
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[12px] font-black text-dt-text tabular-nums">{p.stars}</span>
                              <span className="text-[8px] font-black text-dt-textSecondary/40 uppercase tracking-[0.1em]">Stars</span>
                            </div>
                          </div>
                          <div className="w-px h-4 bg-dt-primary/10" />
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-dt-primary/5 flex items-center justify-center">
                              <Icon name="clock" size={12} className="text-dt-primary/70" />
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[12px] font-bold text-dt-textSecondary/90 tabular-nums">{p.updatedAgo}</span>
                              <span className="text-[8px] font-black text-dt-textSecondary/40 uppercase tracking-[0.1em]">Last Sync</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {p.repoUrl && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); window.open(p.repoUrl!, '_blank', 'noopener,noreferrer'); }}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-dt-text/5 hover:bg-dt-text hover:text-white border border-transparent hover:border-dt-text text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 group/gh"
                            >
                              <Icon name="github" size={14} className="opacity-70 group-hover/gh:opacity-100" />
                              GitHub
                            </button>
                          )}
                          {p.liveUrl && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); window.open(p.liveUrl!, '_blank', 'noopener,noreferrer'); }}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-dt-primary/5 hover:bg-dt-primary hover:text-white border border-transparent hover:border-dt-primary text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 group/lh"
                            >
                              <Icon name="external-link" size={14} className="opacity-70 group-hover/lh:opacity-100" />
                              Live Hub
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Active Ingestion Glow — Only for Active status */}
                    {isActive && (
                      <div className="absolute top-0 left-0 w-[2.5px] h-full bg-gradient-to-b from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 animate-pulse" />
                    )}
                  </div>
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
