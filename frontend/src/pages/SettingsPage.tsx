// ============================================================================
// SettingsPage.tsx — Professional Settings Dashboard
// ============================================================================
import React, { useEffect, useState } from 'react';
import { Icon } from '../components/shared/Icon';
import { useSettingsStore } from '../store/settingsStore';
import type { UpdateSettingsPayload } from '../services/settingsApi';
import { syncGithub } from '../services/settingsApi';


/* ─── Settings Tab Types ─── */
type TabId = 'account' | 'integrations' | 'preferences' | 'security' | 'data';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'account', label: 'Account', icon: 'user-circle' },
  { id: 'integrations', label: 'Integrations', icon: 'globe' },
  { id: 'preferences', label: 'Preferences', icon: 'cog' },
  { id: 'security', label: 'Security', icon: 'shield' },
  { id: 'data', label: 'Data', icon: 'database' },
];

/* ─── Reusable Section Card ─── */
const SectionCard: React.FC<{
  title: string;
  description?: string;
  icon: string;
  iconBg?: string;
  iconColor?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, description, icon, iconBg = 'bg-gray-100', iconColor = 'text-gray-600', children, action }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out">
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className={['w-9 h-9 rounded-xl flex items-center justify-center', iconBg].join(' ')}>
          <Icon name={icon} size={16} className={iconColor} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {action}
    </div>
    {children}
  </div>
);

/* ─── Input Field ─── */
const InputField: React.FC<{
  label: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}> = ({ label, value, onChange, placeholder, type = 'text', disabled = false }) => (
  <div>
    <label className="text-xs font-semibold text-gray-700 mb-1.5 block">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={[
        'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900',
        'outline-none placeholder:text-gray-400',
        'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20',
        'transition-all duration-200',
        disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : '',
      ].join(' ')}
    />
  </div>
);

/* ─── Integrations Tab ─── */
const IntegrationsTab: React.FC = () => {
  const { settings, isSaving, error, saveSuccess, updateSettings, resetSuccess, fetchSettings } = useSettingsStore();

  const [formState, setFormState] = useState({
    github: { username: '' },
    codeforces: { handle: '' },
    leetcode: { username: '' },
    codechef: { username: '' },
  });

  const [isSyncingGithub, setIsSyncingGithub] = useState(false);

  // Sync form state when settings are loaded from the backend
  useEffect(() => {
    if (settings?.platforms) {
      setFormState({
        github: { username: settings.platforms.github?.username || '' },
        codeforces: { handle: settings.platforms.codeforces?.handle || '' },
        leetcode: { username: settings.platforms.leetcode?.username || '' },
        codechef: { username: settings.platforms.codechef?.username || '' },
      });
    }
  }, [settings]);

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => resetSuccess(), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess, resetSuccess]);

  const handleChange = (platform: string, field: 'username' | 'handle', value: string) => {
    setFormState(prev => ({
      ...prev,
      [platform]: { ...prev[platform as keyof typeof formState], [field]: value }
    }));
  };

  const handleSyncGithub = async () => {
    setIsSyncingGithub(true);
    try {
      if (formState.github.username !== settings?.platforms?.github?.username) {
        await updateSettings({ platforms: { github: { username: formState.github.username } } });
      }
      await syncGithub();
      await fetchSettings(); // Refresh settings to get updated lastSyncedAt

      // Invalidate activity store cache + signal mounted activity hook to refetch
      const { useActivityStore } = await import('../store/activityStore');
      useActivityStore.getState().invalidate();
      window.dispatchEvent(new CustomEvent('devtrack:activity-invalidate'));
    } catch (err: unknown) {
      console.error('Failed to sync GitHub:', err);
      const message = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Failed to sync GitHub';
      alert(message);
    } finally {
      setIsSyncingGithub(false);
    }
  };

  const handleSave = async () => {
    // Send ONLY updated fields
    const updatedPlatforms: NonNullable<UpdateSettingsPayload['platforms']> = {};
    
    const checkAndUpdate = (platform: keyof typeof formState, field: 'username' | 'handle') => {
      const currentValue = formState[platform][field as never] as string;
      const originalValue = settings?.platforms?.[platform]?.[field as never] || '';
      
      if (currentValue !== originalValue) {
        if (!updatedPlatforms[platform]) {
          updatedPlatforms[platform] = {};
        }
        const target = updatedPlatforms[platform] as Record<string, string>;
        target[field] = currentValue;
      }
    };

    checkAndUpdate('github', 'username');
    checkAndUpdate('codeforces', 'handle');
    checkAndUpdate('leetcode', 'username');
    checkAndUpdate('codechef', 'username');

    if (Object.keys(updatedPlatforms).length > 0) {
      await updateSettings({ platforms: updatedPlatforms });
      

    }
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Platform Connections" description="Connect your coding platforms to sync data" icon="globe" iconBg="bg-blue-50" iconColor="text-blue-600">
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl">{error}</div>}
        {saveSuccess && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-xl">Settings saved successfully!</div>}
        
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <InputField
                  label="GitHub Username"
                  value={formState.github.username}
                  onChange={(e) => handleChange('github', 'username', e.target.value)}
                  placeholder="Enter GitHub username"
                  disabled={isSaving || isSyncingGithub}
                />
              </div>
              <button
                onClick={handleSyncGithub}
                disabled={!formState.github.username || isSyncingGithub}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sync GitHub data"
              >
                {isSyncingGithub ? 'Syncing...' : 'Sync GitHub'}
              </button>
            </div>
            <div className="text-xs text-gray-500">
              Last synced:{' '}
              {settings?.platforms?.github?.lastSyncedAt
                ? new Date(settings.platforms.github.lastSyncedAt).toLocaleString()
                : 'Never'}
            </div>
          </div>

          <InputField
            label="Codeforces Handle"
            value={formState.codeforces.handle}
            onChange={(e) => handleChange('codeforces', 'handle', e.target.value)}
            placeholder="Enter Codeforces handle"
            disabled={isSaving}
          />
          <InputField
            label="LeetCode Username"
            value={formState.leetcode.username}
            onChange={(e) => handleChange('leetcode', 'username', e.target.value)}
            placeholder="Enter LeetCode username"
            disabled={isSaving}
          />
          <InputField
            label="CodeChef Username"
            value={formState.codechef.username}
            onChange={(e) => handleChange('codechef', 'username', e.target.value)}
            placeholder="Enter CodeChef username"
            disabled={isSaving}
          />

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-black transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

/* ─── Main Settings Page ─── */
const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<TabId>('integrations');
  const { fetchSettings, isLoading, settings } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const renderTab = () => {
    if (isLoading && !settings) {
      return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>;
    }

    switch (activeTab) {
      case 'integrations':
        return <IntegrationsTab />;
      // Other tabs are hidden/disabled as we removed mock data and they require API integration
      default:
        return (
          <div className="p-12 text-center text-gray-500 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <Icon name="wrench-screwdriver" size={32} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Coming Soon</h3>
            <p className="mt-1">This section is currently being connected to the new API.</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto transition-opacity duration-300 opacity-100">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account, integrations, and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <nav className="shrink-0 lg:w-52">
          <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-sm lg:sticky lg:top-6">
            <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
              {TABS.map((tab) => (
                <li key={tab.id}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left',
                      'transition-all duration-200 cursor-pointer whitespace-nowrap',
                      activeTab === tab.id
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    ].join(' ')}
                  >
                    <Icon
                      name={tab.icon}
                      size={16}
                      className={activeTab === tab.id ? 'text-white' : 'text-gray-400'}
                    />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="transition-all duration-300 ease-out">
            {renderTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
