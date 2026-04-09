// ============================================================================
// SettingsPage.tsx — Professional Settings Dashboard
// ============================================================================
import React from 'react';
import { Icon } from '../components/shared/Icon';
import {
  ACCOUNT_DATA,
  INTEGRATIONS,
  PREFERENCES,
  SECURITY_DATA,
  DATA_MANAGEMENT,
} from '../mocks/settingsMockData';

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
  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
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

/* ─── Toggle Component ─── */
const Toggle: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
    <div className="min-w-0">
      <div className="text-sm font-medium text-gray-900">{label}</div>
      {description && <div className="text-xs text-gray-500 mt-0.5">{description}</div>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        'relative shrink-0 inline-flex h-6 w-11 items-center rounded-full',
        'transition-colors duration-200 cursor-pointer',
        checked ? 'bg-gray-900' : 'bg-gray-200',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-4 w-4 rounded-full bg-white shadow-sm',
          'transition-transform duration-200',
          checked ? 'translate-x-6' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  </div>
);

/* ─── Input Field ─── */
const InputField: React.FC<{
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}> = ({ label, value, placeholder, type = 'text', disabled = false }) => (
  <div>
    <label className="text-xs font-semibold text-gray-700 mb-1.5 block">{label}</label>
    <input
      type={type}
      defaultValue={value}
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

/* ─── Account Tab ─── */
const AccountTab: React.FC = () => (
  <div className="space-y-6">
    <SectionCard title="Profile Information" icon="user" iconBg="bg-blue-50" iconColor="text-blue-600"
      action={
        <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-900 text-white hover:bg-black transition-colors duration-200 cursor-pointer">
          <Icon name="edit" size={12} className="text-white" />
          Edit
        </button>
      }
    >
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="shrink-0 flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center shadow-md">
            <span className="text-2xl font-bold text-white">{ACCOUNT_DATA.displayName.charAt(0)}</span>
          </div>
          <button type="button" className="text-[11px] font-medium text-gray-500 hover:text-gray-700 cursor-pointer transition-colors duration-200">
            Change Photo
          </button>
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Display Name" value={ACCOUNT_DATA.displayName} />
          <InputField label="Username" value={ACCOUNT_DATA.username} />
          <InputField label="Email" value={ACCOUNT_DATA.email} type="email" />
          <InputField label="Timezone" value={ACCOUNT_DATA.timezone} disabled />
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Bio</label>
            <textarea
              defaultValue={ACCOUNT_DATA.bio}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all duration-200"
            />
          </div>
        </div>
      </div>
    </SectionCard>
  </div>
);

/* ─── Integrations Tab ─── */
const IntegrationsTab: React.FC = () => (
  <div className="space-y-6">
    <SectionCard title="Platform Connections" description="Connect your coding platforms to sync data" icon="globe" iconBg="bg-blue-50" iconColor="text-blue-600">
      <div className="space-y-3">
        {INTEGRATIONS.map((integration, index) => (
          <div
            key={integration.id}
            className={[
              'flex items-center gap-4 p-4 rounded-xl border',
              'transition-all duration-200',
              integration.status === 'connected'
                ? 'bg-white border-gray-200 hover:shadow-md hover:-translate-y-0.5'
                : 'bg-gray-50 border-gray-100',
            ].join(' ')}
            style={{ animation: `dtFadeIn 520ms ease-out ${index * 60}ms both` }}
          >
            <div className="shrink-0 w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Icon name={integration.icon} size={18} className="text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{integration.name}</span>
                {integration.status === 'connected' && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                    Connected
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{integration.description}</div>
              {integration.username && (
                <div className="text-xs text-gray-400 mt-0.5">@{integration.username} · Last synced {integration.lastSynced}</div>
              )}
            </div>
            <button
              type="button"
              className={[
                'shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer',
                'transition-all duration-200',
                integration.status === 'connected'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-900 text-white hover:bg-black',
              ].join(' ')}
            >
              {integration.status === 'connected' ? (
                <>
                  <Icon name="arrow-path" size={12} />
                  Sync
                </>
              ) : (
                <>
                  <Icon name="plus" size={12} />
                  Connect
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </SectionCard>
  </div>
);

/* ─── Preferences Tab ─── */
const PreferencesTab: React.FC = () => {
  const [prefs, setPrefs] = React.useState(PREFERENCES);

  const updateNotification = (key: string, value: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const updatePrivacy = (key: string, value: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: value },
    }));
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Goals" description="Set your daily and weekly targets" icon="target" iconBg="bg-blue-50" iconColor="text-blue-600">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Daily Goal (problems)</label>
            <input
              type="number"
              defaultValue={prefs.dailyGoal}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all duration-200"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Weekly Goal (problems)</label>
            <input
              type="number"
              defaultValue={prefs.weeklyGoal}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all duration-200"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Notifications" description="Choose what alerts you receive" icon="bell-ring" iconBg="bg-orange-50" iconColor="text-orange-600">
        <div className="space-y-0">
          <Toggle label="Streak Reminders" description="Get reminded to maintain your streak" checked={prefs.notifications.streakReminder} onChange={(v) => updateNotification('streakReminder', v)} />
          <Toggle label="Daily Digest" description="Summary of your daily activity" checked={prefs.notifications.dailyDigest} onChange={(v) => updateNotification('dailyDigest', v)} />
          <Toggle label="Contest Alerts" description="Notifications about upcoming contests" checked={prefs.notifications.contestAlerts} onChange={(v) => updateNotification('contestAlerts', v)} />
          <Toggle label="Weekly Report" description="Detailed weekly progress report" checked={prefs.notifications.weeklyReport} onChange={(v) => updateNotification('weeklyReport', v)} />
          <Toggle label="Achievement Unlocked" description="Celebrate when you earn badges" checked={prefs.notifications.achievementUnlocked} onChange={(v) => updateNotification('achievementUnlocked', v)} />
        </div>
      </SectionCard>

      <SectionCard title="Privacy" description="Control who can see your information" icon="eye" iconBg="bg-violet-50" iconColor="text-violet-600">
        <div className="space-y-0">
          <Toggle label="Public Profile" description="Allow others to see your profile" checked={prefs.privacy.publicProfile} onChange={(v) => updatePrivacy('publicProfile', v)} />
          <Toggle label="Show Activity" description="Display your coding activity" checked={prefs.privacy.showActivity} onChange={(v) => updatePrivacy('showActivity', v)} />
          <Toggle label="Show Streak" description="Display your streak publicly" checked={prefs.privacy.showStreak} onChange={(v) => updatePrivacy('showStreak', v)} />
          <Toggle label="Show Rating" description="Display contest ratings" checked={prefs.privacy.showRating} onChange={(v) => updatePrivacy('showRating', v)} />
        </div>
      </SectionCard>
    </div>
  );
};

/* ─── Security Tab ─── */
const SecurityTab: React.FC = () => {
  const [tfa, setTfa] = React.useState(SECURITY_DATA.twoFactorEnabled);

  return (
    <div className="space-y-6">
      <SectionCard title="Password" description="Manage your account password" icon="key" iconBg="bg-red-50" iconColor="text-red-600"
        action={
          <button type="button" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-900 text-white hover:bg-black transition-colors duration-200 cursor-pointer">
            Change Password
          </button>
        }
      >
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Icon name="clock" size={13} className="text-gray-400" />
          Last changed {SECURITY_DATA.lastPasswordChange}
        </div>
      </SectionCard>

      <SectionCard title="Two-Factor Authentication" description="Add an extra layer of security" icon="shield" iconBg="bg-emerald-50" iconColor="text-emerald-600">
        <Toggle label="Enable 2FA" description="Use an authenticator app for login" checked={tfa} onChange={setTfa} />
      </SectionCard>

      <SectionCard title="Active Sessions" description={`${SECURITY_DATA.activeSessions} devices logged in`} icon="smartphone" iconBg="bg-blue-50" iconColor="text-blue-600">
        <div className="space-y-3">
          {SECURITY_DATA.loginHistory.map((session) => (
            <div
              key={session.id}
              className={[
                'flex items-center justify-between gap-4 p-3.5 rounded-xl border',
                session.current ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-white',
              ].join(' ')}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Icon name="computer-desktop" size={14} className="text-gray-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900">{session.device}</div>
                  <div className="text-xs text-gray-500">{session.location} · {session.time}</div>
                </div>
              </div>
              {session.current ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Current</span>
              ) : (
                <button type="button" className="text-xs font-medium text-red-600 hover:text-red-700 cursor-pointer transition-colors duration-200">
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

/* ─── Data Tab ─── */
const DataTab: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-6">
      <SectionCard title="Storage" description="Manage your data usage" icon="database" iconBg="bg-violet-50" iconColor="text-violet-600">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-gray-700 font-medium">{DATA_MANAGEMENT.storageUsed} of {DATA_MANAGEMENT.storageLimit}</span>
            <span className="text-sm font-bold text-gray-900 tabular-nums">{DATA_MANAGEMENT.storagePercent}%</span>
          </div>
          <div className="h-2.5 w-full bg-violet-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: mounted ? `${DATA_MANAGEMENT.storagePercent}%` : '0%' }}
            />
          </div>
        </div>
        <div className="text-xs text-gray-500">Last backup: {DATA_MANAGEMENT.lastBackup}</div>
      </SectionCard>

      <SectionCard title="Export & Backup" description="Download your data" icon="download" iconBg="bg-blue-50" iconColor="text-blue-600">
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-black transition-all duration-200 cursor-pointer">
            <Icon name="download" size={14} className="text-white" />
            Export Data (JSON)
          </button>
          <button type="button" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:shadow-sm transition-all duration-200 cursor-pointer">
            <Icon name="download" size={14} className="text-gray-500" />
            Export Data (CSV)
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Danger Zone" description="Irreversible actions" icon="exclamation-triangle" iconBg="bg-red-50" iconColor="text-red-600">
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all duration-200 cursor-pointer">
            <Icon name="trash" size={14} className="text-red-500" />
            Delete All Data
          </button>
          <button type="button" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-700 bg-red-100 border border-red-300 hover:bg-red-200 transition-all duration-200 cursor-pointer">
            <Icon name="exclamation-triangle" size={14} className="text-red-600" />
            Delete Account
          </button>
        </div>
      </SectionCard>
    </div>
  );
};

/* ─── Main Settings Page ─── */
const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<TabId>('account');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const renderTab = () => {
    switch (activeTab) {
      case 'account':
        return <AccountTab />;
      case 'integrations':
        return <IntegrationsTab />;
      case 'preferences':
        return <PreferencesTab />;
      case 'security':
        return <SecurityTab />;
      case 'data':
        return <DataTab />;
      default:
        return <AccountTab />;
    }
  };

  return (
    <div
      className={[
        'max-w-4xl mx-auto transition-opacity duration-300',
        mounted ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
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
