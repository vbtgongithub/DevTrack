// ============================================================================
// ProjectsMomentumList.tsx — Projects Momentum Dashboard Feed
// ============================================================================
// Displays active projects, milestone completion, and jump-to-board shortcuts.
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectsData } from '../../hooks/useProjectsData';
import { Icon } from '../shared/Icon';
import { EmptyState } from '../shared/EmptyState';
import { motion } from 'framer-motion';

export const ProjectsMomentumList: React.FC = () => {
  const { data, status } = useProjectsData();
  const navigate = useNavigate();

  const activeProjects = React.useMemo(() => {
    if (!data?.projects) return [];
    return data.projects
      .filter((p) => p.status === 'in_progress' || p.status === 'planning' || p.status === 'review')
      .slice(0, 3);
  }, [data?.projects]);

  if (status === 'loading') {
    return (
      <div className="dt-card p-6 flex flex-col gap-4 bg-white border border-gray-200 rounded-[28px] shadow-sm animate-pulse">
        <div className="h-6 w-32 bg-gray-100 rounded-md" />
        <div className="space-y-3">
          <div className="h-16 w-full bg-gray-50 rounded-xl" />
          <div className="h-16 w-full bg-gray-50 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="dt-card p-6 bg-white border border-gray-300 rounded-[28px] shadow-dt-floating hover:shadow-dt-card-hover hover:border-dt-primary/20 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col relative overflow-hidden group">
      {/* Decorative gradient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,252,0.02),transparent_45%)]" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-dt-primary/10 flex items-center justify-center border border-dt-primary/5 shadow-sm">
            <Icon name="folder" size={18} className="text-dt-primary" />
          </div>
          <div>
            <div className="text-[10px] text-dt-textMuted font-black uppercase tracking-[0.2em]">Workspaces</div>
            <h3 className="text-lg font-black text-dt-text tracking-tighter leading-tight">Projects Momentum</h3>
          </div>
        </div>
        <button
          onClick={() => navigate('/projects')}
          className="text-[11px] font-black text-dt-primary hover:text-dt-primaryHover bg-dt-primary/5 hover:bg-dt-primary/10 border border-dt-primary/10 px-3 py-1.5 rounded-lg transition-all"
        >
          View Board
        </button>
      </div>

      {/* Project list */}
      <div className="flex flex-col gap-3.5 relative z-10">
        {activeProjects.map((p, index) => {
          const progress = p.milestonesProgress?.percent ?? (p.status === 'in_progress' ? 50 : 10);
          
          return (
            <motion.div
              key={p.id}
              onClick={() => navigate(`/projects?project=${p.id}`)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="flex flex-col p-3.5 rounded-xl bg-gray-50/30 hover:bg-white border border-gray-100 hover:border-dt-primary/15 hover:shadow-[0_4px_20px_rgba(124,92,252,0.06)] cursor-pointer transition-all duration-300 group/project"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="min-w-0">
                  <h4 className="text-[13px] font-black text-dt-text truncate group-hover/project:text-dt-primary transition-colors tracking-tight">
                    {p.name}
                  </h4>
                  {p.lastCommitMsg ? (
                    <p className="text-[10px] text-dt-textMuted truncate mt-0.5 max-w-[280px] font-medium tracking-wide">
                      {p.lastCommitMsg}
                    </p>
                  ) : (
                    <p className="text-[10px] text-dt-textMuted/60 truncate mt-0.5 font-medium tracking-wide">
                      No recent commits
                    </p>
                  )}
                </div>
                <span className="text-[9px] font-bold text-dt-textSecondary/60 tabular-nums bg-gray-100/60 px-2 py-0.5 rounded border border-gray-200/50 shrink-0">
                  {p.updatedAgo}
                </span>
              </div>

              {/* Mini-progress bar */}
              <div className="flex items-center gap-3 mt-1.5">
                <div className="h-1 flex-1 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-dt-primary to-[#A78BFA] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[9px] font-black tracking-widest text-dt-textSecondary tabular-nums shrink-0">
                  {progress}%
                </span>
              </div>

              {/* Tags footer */}
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100/80">
                <div className="flex items-center gap-1 flex-wrap">
                  {p.techStack.slice(0, 2).map((tech) => (
                    <span
                      key={tech}
                      className="px-1.5 py-0.5 rounded bg-white border border-gray-200/50 text-[8px] font-black text-dt-textSecondary uppercase tracking-widest"
                    >
                      {tech}
                    </span>
                  ))}
                  {p.techStack.length > 2 && (
                    <span className="text-[8px] font-bold text-dt-textMuted">
                      +{p.techStack.length - 2}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[9px] font-black tracking-widest uppercase text-dt-primary opacity-0 group-hover/project:opacity-100 transition-opacity">
                  <span>Workspace</span>
                  <Icon name="chevron-right" size={10} />
                </div>
              </div>
            </motion.div>
          );
        })}

        {activeProjects.length === 0 && (
          <div className="py-2">
            <EmptyState
              size="sm"
              icon="folder"
              title="No Active Workspaces"
              description="Create a project to track development velocity."
              action={
                <button
                  onClick={() => navigate('/projects')}
                  className="dt-btn dt-btn-primary dt-btn-sm"
                >
                  Create Project
                </button>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsMomentumList;
