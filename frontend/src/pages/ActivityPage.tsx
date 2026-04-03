// Placeholder — Activity Page
import React from 'react';
import { PageShell } from '../components/layout/PageShell';

const ActivityPage: React.FC = () => {
  return (
    <PageShell title="Activity" subtitle="Track your coding contributions" status="success" error={null}>
      <p style={{ color: 'var(--text-muted)' }}>Activity page coming soon...</p>
    </PageShell>
  );
};

export default ActivityPage;
