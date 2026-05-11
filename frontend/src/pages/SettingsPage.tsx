import React from 'react';
import { SettingsWorkspace } from '../features/settings';

const SettingsPage: React.FC = () => {
  return (
    <div className="w-full h-full animate-fade-in pb-10">
      <SettingsWorkspace />
    </div>
  );
};

export default SettingsPage;