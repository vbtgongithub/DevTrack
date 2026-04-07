import React from 'react';
import { Icon } from '../components/shared/Icon';

type ProjectStatus = 'Completed' | 'In Progress' | 'Merged';
type ProjectFilter = 'All' | 'Active' | 'Completed';

type ProjectCardVM = {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  techStack: string[];
  repoUrl: string;
};

const PROJECTS: ProjectCardVM[] = [
  {
    id: 'p1',
    title: 'DevTrack',
    description: 'A personal developer dashboard to track coding activity, DSA progress, and projects in one clean workspace.',
    status: 'In Progress',
    techStack: ['React', 'TypeScript', 'Node.js', 'Tailwind'],
    repoUrl: 'https://github.com/',
  },
  {
    id: 'p2',
    title: 'Portfolio Site',
    description: 'A fast, responsive portfolio with case studies, project highlights, and a lightweight blog section.',
    status: 'Completed',
    techStack: ['React', 'Vite', 'MDX'],
    repoUrl: 'https://github.com/',
  },
  {
    id: 'p3',
    title: 'API Playground',
    description: 'A small sandbox for prototyping REST endpoints with auth, caching, and monitoring-ready logging.',
    status: 'Merged',
    techStack: ['Node.js', 'Express', 'MongoDB'],
    repoUrl: 'https://github.com/',
  },
  {
    id: 'p4',
    title: 'DSA Notes',
    description: 'Curated solutions and explanations for common interview patterns with structured topic tagging.',
    status: 'In Progress',
    techStack: ['Python', 'Markdown'],
    repoUrl: 'https://github.com/',
  },
  {
    id: 'p5',
    title: 'CLI Utils',
    description: 'A collection of dev productivity scripts for repo cleanup, changelog generation, and release notes.',
    status: 'Completed',
    techStack: ['Node.js', 'TypeScript'],
    repoUrl: 'https://github.com/',
  },
  {
    id: 'p6',
    title: 'Realtime Board',
    description: 'A minimal realtime collaborative board with basic presence and synced edits for small teams.',
    status: 'Merged',
    techStack: ['React', 'WebSocket', 'Node.js'],
    repoUrl: 'https://github.com/',
  },
];

function badgeClass(status: ProjectStatus): string {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-700';
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-700';
    case 'Merged':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function isActiveProject(status: ProjectStatus): boolean {
  return status === 'In Progress' || status === 'Merged';
}

const ProjectsPage: React.FC = () => {
  const [filter, setFilter] = React.useState<ProjectFilter>('All');

  const filteredProjects = React.useMemo(() => {
    if (filter === 'All') return PROJECTS;
    if (filter === 'Completed') return PROJECTS.filter((p) => p.status === 'Completed');
    return PROJECTS.filter((p) => isActiveProject(p.status));
  }, [filter]);

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">My Projects</h2>
          <p className="text-sm text-gray-500">Manage and track your development work</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {(['All', 'Active', 'Completed'] as const).map((key) => {
              const isSelected = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={[
                    'bg-white border border-gray-300 rounded-lg px-3 py-1 text-sm',
                    isSelected ? 'bg-black text-white border-black' : 'text-gray-700 hover:text-black',
                  ].join(' ')}
                >
                  {key}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={[
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold',
              'bg-black text-white',
              'hover:scale-[1.03] active:scale-[0.97]',
              'transition-transform duration-200',
            ].join(' ')}
          >
            <Icon name="folder-plus" size={16} className="text-white" />
            + New Project
          </button>
        </div>
      </div>

      <div className="h-px w-full bg-gray-200 mb-6" />

      {filteredProjects.length === 0 ? (
        <div className="bg-white border border-gray-300 shadow-md rounded-xl p-8 text-center">
          <div className="text-base font-semibold text-gray-900">No projects yet — create your first project</div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className={[
                'bg-white border border-gray-300 shadow-md rounded-xl p-5',
                'hover:shadow-lg hover:scale-[1.01] transition-all duration-200',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <span
                  className={[
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                    badgeClass(p.status),
                  ].join(' ')}
                >
                  {p.status}
                </span>

                <button
                  type="button"
                  onClick={() => window.open(p.repoUrl, '_blank', 'noopener,noreferrer')}
                  className={[
                    'inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white',
                    'h-9 w-9',
                    'hover:bg-gray-50 transition-colors duration-200',
                  ].join(' ')}
                  aria-label="Open GitHub repository"
                >
                  <Icon name="github" size={18} className="text-gray-700" />
                </button>
              </div>

              <div className="mt-4 text-base font-semibold text-gray-900">{p.title}</div>

              <p
                className="mt-2 text-sm text-gray-500 overflow-hidden"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}
              >
                {p.description}
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                {p.techStack.map((tag) => (
                  <span key={`${p.id}-${tag}`} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-5">
                <a
                  href={p.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-gray-600 hover:text-black cursor-pointer"
                >
                  View Repo →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
