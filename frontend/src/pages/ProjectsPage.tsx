import React from 'react';
import { PageShell } from '../components/layout/PageShell';
import { Icon } from '../components/shared/Icon';
import githubLogo from '../assets/logos/github.png';

/* ─── Types ─── */
type ProjectStatus = 'Completed' | 'In Progress' | 'Merged';
type ProjectFilter = 'All' | 'Active' | 'Completed';

type ProjectCardVM = {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  techStack: string[];
  repoUrl: string;
  progress: number;
  lastUpdated: string;
  commits: number;
};

/* ─── Mock Data ─── */
const PROJECTS: ProjectCardVM[] = [
  {
    id: 'p1',
    title: 'DevTrack',
    description: 'A personal developer dashboard to track coding activity, DSA progress, and projects in one clean workspace.',
    status: 'In Progress',
    techStack: ['React', 'TypeScript', 'Node.js', 'Tailwind'],
    repoUrl: 'https://github.com/',
    progress: 68,
    lastUpdated: '2 hours ago',
    commits: 142,
  },
  {
    id: 'p2',
    title: 'Portfolio Site',
    description: 'A fast, responsive portfolio with case studies, project highlights, and a lightweight blog section.',
    status: 'Completed',
    techStack: ['React', 'Vite', 'MDX'],
    repoUrl: 'https://github.com/',
    progress: 100,
    lastUpdated: '5 days ago',
    commits: 87,
  },
  {
    id: 'p3',
    title: 'API Playground',
    description: 'A small sandbox for prototyping REST endpoints with auth, caching, and monitoring-ready logging.',
    status: 'Merged',
    techStack: ['Node.js', 'Express', 'MongoDB'],
    repoUrl: 'https://github.com/',
    progress: 100,
    lastUpdated: '1 week ago',
    commits: 54,
  },
  {
    id: 'p4',
    title: 'DSA Notes',
    description: 'Curated solutions and explanations for common interview patterns with structured topic tagging.',
    status: 'In Progress',
    techStack: ['Python', 'Markdown'],
    repoUrl: 'https://github.com/',
    progress: 45,
    lastUpdated: '1 day ago',
    commits: 38,
  },
  {
    id: 'p5',
    title: 'CLI Utils',
    description: 'A collection of dev productivity scripts for repo cleanup, changelog generation, and release notes.',
    status: 'Completed',
    techStack: ['Node.js', 'TypeScript'],
    repoUrl: 'https://github.com/',
    progress: 100,
    lastUpdated: '3 weeks ago',
    commits: 29,
  },
  {
    id: 'p6',
    title: 'Realtime Board',
    description: 'A minimal realtime collaborative board with basic presence and synced edits for small teams.',
    status: 'Merged',
    techStack: ['React', 'WebSocket', 'Node.js'],
    repoUrl: 'https://github.com/',
    progress: 95,
    lastUpdated: '4 days ago',
    commits: 63,
  },
];

/* ─── Helpers ─── */
const FILTERS: ProjectFilter[] = ['All', 'Active', 'Completed'];

function badgeClasses(status: ProjectStatus): string {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-700';
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'Merged':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function progressBarColor(status: ProjectStatus): string {
  switch (status) {
    case 'Completed':
      return 'bg-green-500';
    case 'In Progress':
      return 'bg-black';
    case 'Merged':
      return 'bg-blue-500';
    default:
      return 'bg-black';
  }
}

function leftBorderColor(status: ProjectStatus): string {
  switch (status) {
    case 'Completed':
      return 'border-l-green-500';
    case 'In Progress':
      return 'border-l-yellow-400';
    case 'Merged':
      return 'border-l-blue-500';
    default:
      return 'border-l-gray-300';
  }
}

function isActiveProject(status: ProjectStatus): boolean {
  return status === 'In Progress' || status === 'Merged';
}

/* ─── Component ─── */
const ProjectsPage: React.FC = () => {
  const [filter, setFilter] = React.useState<ProjectFilter>('All');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const filteredProjects = React.useMemo(() => {
    if (filter === 'All') return PROJECTS;
    if (filter === 'Completed') return PROJECTS.filter((p) => p.status === 'Completed');
    return PROJECTS.filter((p) => isActiveProject(p.status));
  }, [filter]);

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

  return (
    <div className={['transition-opacity duration-300', mounted ? 'opacity-100' : 'opacity-0'].join(' ')}>
      <PageShell
        title="My Projects"
        subtitle="Manage and track your development work"
        status="success"
        error={null}
        actions={headerActions}
      >
        {/* ─── Content ─── */}
        <div className="flex flex-col">

          {/* Empty State */}
          {filteredProjects.length === 0 ? (
            <div className="dt-card shadow-md rounded-xl p-10 text-center max-w-md mx-auto border border-gray-200">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <Icon name="folder" size={24} className="text-gray-400" />
              </div>
              <div className="text-base font-semibold text-gray-900">No projects yet</div>
              <p className="mt-1 text-sm text-gray-500">Create your first project to get started</p>
              <button
                type="button"
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
            </div>
          ) : (
            /* ─── Project Grid ─── */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((p, index) => (
                <div
                  key={p.id}
                  className={[
                    'group',
                    'bg-white relative overflow-hidden rounded-xl p-5',
                    'shadow-md border border-gray-200',
                    'border-l-4',
                    leftBorderColor(p.status),
                    'cursor-pointer',
                    'hover:shadow-xl hover:-translate-y-1',
                    'transition-all duration-200',
                  ].join(' ')}
                  style={{
                    animation: mounted ? `dtFadeIn 520ms ease-out ${index * 60}ms both` : 'none',
                  }}
                >
                  {/* ── Top Row: Badge + GitHub ── */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={[
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide shadow-sm',
                        badgeClasses(p.status),
                      ].join(' ')}
                    >
                      {p.status}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(p.repoUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className={[
                        'inline-flex items-center justify-center rounded-lg border border-gray-300',
                        'h-9 w-9 cursor-pointer',
                        'hover:bg-gray-100 hover:scale-110',
                        'transition-all duration-200',
                      ].join(' ')}
                      aria-label="Open GitHub repository"
                    >
                      <Icon name="github" size={16} className="text-gray-600" />
                    </button>
                  </div>

                  {/* ── Title with Logo ── */}
                  <div className="flex items-center gap-2">
                    <img src={githubLogo} alt="" className="w-5 h-5 object-contain shrink-0" />
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-black transition-colors duration-150 truncate">
                      {p.title}
                    </h3>
                  </div>

                  {/* ── Description ── */}
                  <p
                    className="mt-1.5 text-sm text-gray-500 overflow-hidden"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    } as React.CSSProperties}
                  >
                    {p.description}
                  </p>

                  {/* ── Divider ── */}
                  <div className="border-t border-gray-100 my-3" />

                  {/* ── Tech Stack ── */}
                  <div className="flex flex-wrap gap-1.5">
                    {p.techStack.map((tag) => (
                      <span
                        key={`${p.id}-${tag}`}
                        className="bg-gray-100 text-gray-700 text-xs px-2.5 py-0.5 rounded-full hover:bg-gray-200 transition-colors duration-150"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* ── Divider ── */}
                  <div className="border-t border-gray-100 my-3" />

                  {/* ── Progress Bar ── */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500 font-medium">Progress</span>
                      <span className="text-xs font-semibold text-gray-700 tabular-nums">{p.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={[
                          'h-full rounded-full transition-all duration-500 ease-out',
                          'group-hover:opacity-90',
                          progressBarColor(p.status),
                        ].join(' ')}
                        style={{ width: mounted ? `${p.progress}%` : '0%' }}
                      />
                    </div>
                  </div>

                  {/* ── Divider ── */}
                  <div className="border-t border-gray-100 my-3" />

                  {/* ── Meta Info Row ── */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-2">
                      <Icon name="clock" size={13} className="text-gray-400" />
                      {p.lastUpdated}
                    </span>
                    <span className="flex items-center gap-2">
                      <Icon name="git-commit" size={13} className="text-gray-400" />
                      {p.commits} commits
                    </span>
                  </div>

                  {/* ── Divider ── */}
                  <div className="border-t border-gray-100 my-3" />

                  {/* ── Footer ── */}
                  <div className="flex items-center justify-between">
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
                    <a
                      href={p.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center rounded-lg h-8 w-8 hover:bg-gray-100 hover:scale-110 transition-all duration-200"
                      aria-label="Open external link"
                    >
                      <Icon name="external-link" size={14} className="text-gray-400" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageShell>
    </div>
  );
};

export default ProjectsPage;
