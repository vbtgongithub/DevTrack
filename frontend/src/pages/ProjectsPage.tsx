// Placeholder — Projects Page
import React from 'react';
import { PageShell } from '../components/layout/PageShell';

const ProjectsPage: React.FC = () => {
  return (
    <PageShell title="Projects" subtitle="Manage your development projects" status="success" error={null}>
      <p style={{ color: 'var(--text-muted)' }}>Projects page coming soon...</p>
    </PageShell>
  );
};

export default ProjectsPage;
