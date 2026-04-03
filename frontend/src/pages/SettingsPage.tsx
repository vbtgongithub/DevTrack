// Placeholder — Settings Page
import React from 'react';
import { PageShell } from '../components/layout/PageShell';

const SettingsPage: React.FC = () => {
  return (
    <PageShell title="Settings" subtitle="Configure your DevTrack experience" status="success" error={null}>
      <p style={{ color: 'var(--text-muted)' }}>Settings page coming soon...</p>
    </PageShell>
  );
};

export default SettingsPage;
