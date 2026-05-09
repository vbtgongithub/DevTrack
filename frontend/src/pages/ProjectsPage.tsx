import React from 'react';
import { PageShell } from '../components/layout/PageShell';
import { Icon } from '../components/shared/Icon';
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
      return 'bg-green-100 text-green-700';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'planning':
      return 'bg-blue-100 text-blue-700';
    case 'on_hold':
      return 'bg-orange-100 text-orange-700';
    case 'archived':
      return 'bg-gray-100 text-gray-500';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function progressBarColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'in_progress':
      return 'bg-black';
    case 'planning':
      return 'bg-blue-500';
    default:
      return 'bg-gray-400';
  }
}

function leftBorderColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'border-l-green-500';
    case 'in_progress':
      return 'border-l-yellow-400';
    case 'planning':
      return 'border-l-blue-500';
    case 'on_hold':
      return 'border-l-orange-400';
    case 'archived':
      return 'border-l-gray-300';
    default:
      return 'border-l-gray-300';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 mx-4 animate-[dtFadeIn_200ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">New Project</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
            <Icon name="x-mark" size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
              placeholder="e.g. DevTrack"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 resize-none"
              rows={2}
              placeholder="Brief project description"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
              >
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
              <select
                value={form.visibility}
                onChange={(e) => setForm({ ...form, visibility: e.target.value as typeof form.visibility })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tech Stack</label>
            <input
              type="text"
              value={form.techStack}
              onChange={(e) => setForm({ ...form, techStack: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
              placeholder="React, TypeScript, Node.js"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Repository URL</label>
            <input
              type="url"
              value={form.repoUrl}
              onChange={(e) => setForm({ ...form, repoUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
              placeholder="https://github.com/..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className={[
                'px-4 py-2 text-sm rounded-lg font-semibold text-white cursor-pointer transition-all duration-200',
                saving ? 'bg-gray-400' : 'bg-gray-900 hover:shadow-lg hover:scale-[1.03] active:scale-[0.97]',
              ].join(' ')}
            >
              {saving ? 'Creating…' : 'Create Project'}
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
    if (!confirm('Delete this project? This action cannot be undone.')) return;
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
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
      {FILTERS.map((key) => {
        const isSelected = filter === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={[
              'px-3 py-1.5 text-sm rounded-md cursor-pointer',
              'transition-all duration-200',
              isSelected
                ? 'bg-gray-900 text-white shadow-sm font-medium'
                : 'text-gray-600 hover:bg-gray-100',
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
    <div className="flex items-center gap-3">
      {filterGroup}
      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className={[
          'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer',
          'bg-gray-900 text-white shadow-md',
          'hover:shadow-lg hover:scale-[1.03]',
          'active:scale-[0.97]',
          'transition-all duration-200',
        ].join(' ')}
      >
        <Icon name="plus" size={16} className="text-white" />
        New Project
      </button>
    </div>
  );

  /* ─── Loading Skeleton ─── */
  if (status === 'loading' && !data) {
    return (
      <div className="transition-opacity duration-300 opacity-100">
        <PageShell title="My Projects" subtitle="Manage and track your development work" status="loading" error={null}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-20 mb-4" />
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-full mb-4" />
                <div className="h-2.5 bg-gray-100 rounded-full w-full mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        </PageShell>
      </div>
    );
  }

  return (
    <div className={['transition-opacity duration-300', mounted ? 'opacity-100' : 'opacity-0'].join(' ')}>
      <PageShell
        title="My Projects"
        subtitle="Manage and track your development work"
        status={status === 'loading' ? 'success' : status}
        error={error}
        actions={headerActions}
        onRetry={refresh}
      >
        {/* ─── Content ─── */}
        <div className="flex flex-col">

          {/* Empty State */}
          {filteredProjects.length === 0 ? (
            <div className="dt-card shadow-sm rounded-2xl p-10 text-center max-w-md mx-auto border border-gray-200">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <Icon name="folder" size={24} className="text-gray-400" />
              </div>
              <div className="text-base font-semibold text-gray-900">
                {projects.length === 0 ? 'No projects yet' : 'No matching projects'}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {projects.length === 0 ? 'Create your first project to get started' : 'Try adjusting your filters'}
              </p>
              {projects.length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className={[
                    'mt-5 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold cursor-pointer',
                    'bg-gray-900 text-white shadow-md',
                    'hover:shadow-lg hover:scale-[1.03]',
                    'active:scale-[0.97]',
                    'transition-all duration-200',
                  ].join(' ')}
                >
                  <Icon name="plus" size={16} className="text-white" />
                  Create Project
                </button>
              )}
            </div>
          ) : (
            /* ─── Project Grid ─── */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((p, index) => {
                const progress = statusProgress(p);
                return (
                  <div
                    key={p.id}
                    className={[
                      'group',
                      'bg-white relative overflow-hidden rounded-2xl p-6',
                      'shadow-sm border border-gray-200',
                      'border-l-4',
                      leftBorderColor(p.status),
                      'cursor-pointer',
                      'hover:shadow-lg hover:-translate-y-0.5',
                      'transition-all duration-200 ease-out',
                      deletingId === p.id ? 'opacity-50 pointer-events-none' : '',
                    ].join(' ')}
                    style={{
                      animation: mounted ? `dtFadeIn 520ms ease-out ${index * 60}ms both` : 'none',
                    }}
                  >
                    {/* ── Top Row: Badge + Actions ── */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={[
                          'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide shadow-sm',
                          badgeClasses(p.status),
                        ].join(' ')}
                      >
                        {p.statusLabel}
                      </span>

                      <div className="flex items-center gap-1">
                        {p.repoUrl && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(p.repoUrl!, '_blank', 'noopener,noreferrer');
                            }}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 h-9 w-9 cursor-pointer hover:bg-gray-100 hover:scale-110 transition-all duration-200"
                            aria-label="Open GitHub repository"
                          >
                            <Icon name="github" size={16} className="text-gray-600" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(p.id);
                          }}
                          className="inline-flex items-center justify-center rounded-lg border border-gray-200 h-9 w-9 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:scale-110 transition-all duration-200 opacity-0 group-hover:opacity-100"
                          aria-label="Delete project"
                        >
                          <Icon name="trash" size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* ── Title with Logo ── */}
                    <div className="flex items-center gap-2.5">
                      <img src={githubLogo} alt="" className="w-5 h-5 object-contain shrink-0" />
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-black transition-colors duration-150 truncate">
                        {p.name}
                      </h3>
                    </div>

                    {/* ── Description ── */}
                    <p
                      className="mt-1.5 text-sm text-gray-500 overflow-hidden leading-relaxed"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      } as React.CSSProperties}
                    >
                      {p.description || 'No description'}
                    </p>

                    {/* ── Divider ── */}
                    <div className="border-t border-gray-100 my-3" />

                    {/* ── Tech Stack ── */}
                    <div className="flex flex-wrap gap-1.5">
                      {p.techStack.length > 0 ? (
                        p.techStack.map((tag) => (
                          <span
                            key={`${p.id}-${tag}`}
                            className="bg-gray-100 text-gray-700 text-xs px-2.5 py-0.5 rounded-full hover:bg-gray-200 transition-colors duration-150"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-300 italic">No tech stack</span>
                      )}
                    </div>

                    {/* ── Divider ── */}
                    <div className="border-t border-gray-100 my-3" />

                    {/* ── Progress Bar ── */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500 font-medium">Progress</span>
                        <span className="text-xs font-semibold text-gray-700 tabular-nums">{progress}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={[
                            'h-full rounded-full transition-all duration-700 ease-out',
                            progressBarColor(p.status),
                          ].join(' ')}
                          style={{ width: mounted ? `${progress}%` : '0%' }}
                        />
                      </div>
                    </div>

                    {/* ── Divider ── */}
                    <div className="border-t border-gray-100 my-3" />

                    {/* ── Meta Info Row ── */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-2">
                        {isActiveStatus(p.status) ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-emerald-600 font-medium">Active {p.updatedAgo}</span>
                          </>
                        ) : (
                          <>
                            <Icon name="clock" size={13} className="text-gray-400" />
                            {p.updatedAgo}
                          </>
                        )}
                      </span>
                      <span className="flex items-center gap-2">
                        <Icon name="star" size={13} className="text-gray-400" />
                        {p.stars}
                      </span>
                    </div>

                    {/* ── Divider ── */}
                    <div className="border-t border-gray-100 my-3" />

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-between">
                      {p.repoUrl ? (
                        <a
                          href={p.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-medium text-gray-700 hover:text-black hover:underline transition-all duration-150 flex items-center gap-1"
                        >
                          View Repo
                          <span className="inline-block group-hover:translate-x-1 transition-transform duration-200">→</span>
                        </a>
                      ) : (
                        <span className="text-sm text-gray-300">No repo linked</span>
                      )}
                      {p.liveUrl && (
                        <a
                          href={p.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center rounded-lg h-8 w-8 hover:bg-gray-100 hover:scale-110 transition-all duration-200"
                          aria-label="Open live site"
                        >
                          <Icon name="external-link" size={14} className="text-gray-400" />
                        </a>
                      )}
                    </div>
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
