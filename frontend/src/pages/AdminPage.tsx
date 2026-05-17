import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Activity, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Sliders, 
  AlertCircle, 
  Mail, 
  Plus, 
  Percent,
  RefreshCw,
  XOctagon,
  Radio,
  Zap,
  Server
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../utils/axiosClient';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../components/ui';
import { getTelemetryBuffer } from '../lib/telemetry';
import { useSse } from '../hooks/useSse';
import { useUIStore } from '../store/uiStore';

type Tab = 'retention' | 'beta' | 'feature-gates' | 'kill-switches' | 'system';

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('retention');
  const queryClient = useQueryClient();
  const telemetry = getTelemetryBuffer().slice(-8).reverse();
  const { connectionStatus } = useSse();
  const sseStatus = useUIStore((s) => s.sseStatus);

  // ─── Queries ───
  const { data: retentionData, isLoading: loadingRetention, refetch: refetchRetention } = useQuery({
    queryKey: ['ops-retention'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/ops/retention/dashboard');
      return data;
    },
    refetchInterval: 15000, // auto-refresh every 15s for live view
  });

  const { data: betaData, isLoading: loadingBeta, refetch: refetchBeta } = useQuery({
    queryKey: ['ops-beta'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/ops/beta/status');
      return data;
    },
  });

  const { data: featureGatesData, isLoading: loadingGates, refetch: refetchGates } = useQuery({
    queryKey: ['ops-feature-gates'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/ops/feature-gates');
      return data;
    },
  });

  const { data: killSwitchesData, isLoading: loadingSwitches, refetch: refetchSwitches } = useQuery({
    queryKey: ['ops-kill-switches'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/ops/kill-switches');
      return data;
    },
  });

  const { data: systemMetrics, isLoading: loadingMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['ops-metrics'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/ops/metrics');
      return data;
    },
    refetchInterval: 10000,
  });

  // ─── Mutations ───
  const toggleGateMutation = useMutation({
    mutationFn: async ({ featureName, enabled }: { featureName: string; enabled: boolean }) => {
      const { data } = await axiosClient.post('/ops/feature-gates/toggle', { featureName, enabled });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-feature-gates'] });
    },
  });

  const configureGateMutation = useMutation({
    mutationFn: async (payload: { featureName: string; rolloutPercentage: number; rules?: any }) => {
      const { data } = await axiosClient.post('/ops/feature-gates/configure', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-feature-gates'] });
    },
  });

  const toggleKillSwitchMutation = useMutation({
    mutationFn: async ({ switchId, enabled, reason }: { switchId: string; enabled: boolean; reason: string }) => {
      const { data } = await axiosClient.post('/ops/kill-switches/toggle', { switchId, enabled, reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-kill-switches'] });
      queryClient.invalidateQueries({ queryKey: ['ops-retention'] });
    },
  });

  const generateInviteMutation = useMutation({
    mutationFn: async (payload: { email: string; cohortId: string }) => {
      const { data } = await axiosClient.post('/ops/beta/invites', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-beta'] });
    },
  });

  const createCohortMutation = useMutation({
    mutationFn: async (payload: { name: string; description: string; type: string; targetSize: number }) => {
      const { data } = await axiosClient.post('/ops/beta/cohorts', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-beta'] });
    },
  });

  // ─── Forms State ───
  const [inviteForm, setInviteForm] = useState({ email: '', cohortId: '' });
  const [cohortForm, setCohortForm] = useState({ name: '', description: '', type: 'alpha', targetSize: 50 });
  const [switchReason, setSwitchReason] = useState<Record<string, string>>({});

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 px-4 font-sans text-zinc-100">
      {/* ─── Header ─── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 mb-1.5">
            <Shield size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Ops Console</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">System Operations</h1>
          <p className="text-xs text-zinc-500 mt-1">Pilot seat for closed beta controls, pacing safety limits, feature rollouts, and real user behavior telemetry.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={connectionStatus === 'connected' ? 'success' : 'warning'} className="px-3 py-1 text-xs">
            SSE Link: {connectionStatus}
          </Badge>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => {
              refetchRetention();
              refetchBeta();
              refetchGates();
              refetchSwitches();
              refetchMetrics();
            }}
            className="border-zinc-800/80 hover:bg-zinc-950/60 hover:text-white"
          >
            <RefreshCw size={14} className="mr-2 animate-spin-hover" />
            Sync Now
          </Button>
        </div>
      </header>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex flex-wrap gap-1 bg-zinc-950/60 border border-zinc-900 rounded-xl p-1">
        {(['retention', 'beta', 'feature-gates', 'kill-switches', 'system'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-all duration-200
              ${activeTab === tab 
                ? 'bg-zinc-900 border border-zinc-800/50 text-white shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
              }
            `}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* ─── Content Render ─── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === 'retention' && (
            <RetentionDashboard 
              data={retentionData} 
              loading={loadingRetention} 
            />
          )}

          {activeTab === 'beta' && (
            <BetaManagementTab 
              data={betaData} 
              loading={loadingBeta}
              inviteForm={inviteForm}
              setInviteForm={setInviteForm}
              cohortForm={cohortForm}
              setCohortForm={setCohortForm}
              generateInvite={generateInviteMutation}
              createCohort={createCohortMutation}
            />
          )}

          {activeTab === 'feature-gates' && (
            <FeatureGatesTab 
              data={featureGatesData} 
              loading={loadingGates}
              toggleGate={toggleGateMutation}
              configureGate={configureGateMutation}
            />
          )}

          {activeTab === 'kill-switches' && (
            <KillSwitchesTab 
              data={killSwitchesData} 
              loading={loadingSwitches}
              toggleSwitch={toggleKillSwitchMutation}
              switchReason={switchReason}
              setSwitchReason={setSwitchReason}
            />
          )}

          {activeTab === 'system' && (
            <SystemTab 
              metrics={systemMetrics} 
              loading={loadingMetrics}
              telemetry={telemetry}
              sseStatus={sseStatus}
              connectionStatus={connectionStatus}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ─── TAB 1: RETENTION DASHBOARD ─── */
interface RetentionDashboardProps {
  data: any;
  loading: boolean;
}

const RetentionDashboard: React.FC<RetentionDashboardProps> = ({ data, loading }) => {
  if (loading) return <TabLoader />;
  if (!data?.success) return <TabError error="Could not load retention console metrics." />;

  const { metrics, cohorts, summary, alerts } = data;

  return (
    <div className="space-y-6">
      {/* ─── Operations Health Matrix ─── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <HealthMetricCard label="System Integrity" value={`${summary.overall}%`} status={summary.overall > 80 ? 'healthy' : 'warning'} />
        <HealthMetricCard label="Behavioral Momentum" value={`${summary.momentum}%`} status={summary.momentum > 70 ? 'healthy' : 'warning'} />
        <HealthMetricCard label="Fatigue Shield" value={`${summary.fatigue}%`} status={summary.fatigue > 60 ? 'healthy' : 'warning'} />
        <HealthMetricCard label="Experience Quality" value={`${summary.quality}%`} status={summary.quality > 85 ? 'healthy' : 'warning'} />
        <HealthMetricCard label="Pacing Security" value={`${summary.safety}%`} status={summary.safety > 90 ? 'healthy' : 'warning'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Operational Alerts ─── */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-zinc-950/40 border-zinc-800/80">
            <CardHeader className="pb-3 border-b border-zinc-900">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <AlertTriangle size={15} className="text-yellow-500" />
                  Active Telemetry Anomalies
                </CardTitle>
                <Badge variant={alerts.length === 0 ? 'success' : 'error'} className="text-[10px] uppercase font-bold tracking-wider px-2">
                  {alerts.length === 0 ? 'Clear' : `${alerts.length} Warnings`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle size={24} className="text-emerald-500 mb-2 opacity-80" />
                  <p className="text-xs text-zinc-400 font-medium">All behavioral systems operating within standard deviations.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {alerts.map((alert: any, i: number) => (
                    <li key={i} className="flex items-start justify-between bg-zinc-900/30 border border-zinc-850 p-3 rounded-xl gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className={`p-1 rounded-lg shrink-0 mt-0.5 ${alert.severity === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                          <AlertCircle size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-200 capitalize">{alert.system} Engine Out of Bound</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">{alert.message}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-semibold font-mono text-zinc-600 shrink-0">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* ─── Cohort Segmentation Analysis ─── */}
          <Card className="bg-zinc-950/40 border-zinc-800/80">
            <CardHeader className="pb-3 border-b border-zinc-900">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users size={15} className="text-emerald-400" />
                Active Cohort Retentiveness (D7 Rolling)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {cohorts.map((cohort: any, i: number) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-zinc-300 font-mono">{cohort.cohortDate}</span>
                        <span className="text-[10px] text-zinc-500">({cohort.totalUsers} users)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-medium">Score:</span>
                        <span className={`font-bold font-mono ${cohort.healthScore > 75 ? 'text-emerald-400' : cohort.healthScore > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {cohort.healthScore}/100
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${cohort.healthScore > 75 ? 'from-emerald-500 to-teal-500' : cohort.healthScore > 50 ? 'from-yellow-500 to-orange-500' : 'from-red-500 to-rose-500'}`}
                        style={{ width: `${Math.min(100, cohort.healthScore)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Retention Diagnostic Stats ─── */}
        <div className="space-y-6">
          <Card className="bg-zinc-950/40 border-zinc-800/80">
            <CardHeader className="pb-3 border-b border-zinc-900">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity size={15} className="text-purple-400" />
                Retention Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="D1 Retention" value={`${metrics.retentionD1}%`} color="emerald" />
                <MiniStat label="D7 Retention" value={`${metrics.retentionD7}%`} color="teal" />
                <MiniStat label="D30 Retention" value={`${metrics.retentionD30}%`} color="blue" />
              </div>

              <div className="border-t border-zinc-900 pt-4 space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-500 font-semibold">User Fatigue Risk (High)</span>
                    <span className="font-bold font-mono text-zinc-300">{metrics.fatigueIndicators.high}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${metrics.fatigueIndicators.high}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-500 font-semibold">Goal Completion Velocity</span>
                    <span className="font-bold font-mono text-zinc-300">Active</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">Adaptive task pacer scale: dynamic.</p>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-500 font-semibold">Economy Stability (Power XP Users)</span>
                    <span className="font-bold font-mono text-zinc-300">{metrics.xpDistribution.power}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${metrics.xpDistribution.power}%` }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

/* ─── TAB 2: BETA & COHORTS MANAGEMENT ─── */
interface BetaManagementTabProps {
  data: any;
  loading: boolean;
  inviteForm: any;
  setInviteForm: any;
  cohortForm: any;
  setCohortForm: any;
  generateInvite: any;
  createCohort: any;
}

const BetaManagementTab: React.FC<BetaManagementTabProps> = ({
  data,
  loading,
  inviteForm,
  setInviteForm,
  cohortForm,
  setCohortForm,
  generateInvite,
  createCohort,
}) => {
  if (loading) return <TabLoader />;
  if (!data?.success) return <TabError error="Could not load closed beta structures." />;

  const { stats } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ─── Invite Controls & Cohort Creators ─── */}
      <div className="space-y-6">
        {/* Generate Invite */}
        <Card className="bg-zinc-950/40 border-zinc-800/80">
          <CardHeader className="pb-3 border-b border-zinc-900">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Mail size={15} className="text-emerald-400" />
              Generate Beta Invite Code
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!inviteForm.email || !inviteForm.cohortId) return;
                generateInvite.mutate(inviteForm, {
                  onSuccess: () => setInviteForm({ email: '', cohortId: '' })
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Candidate Email</label>
                <input 
                  type="email" 
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="e.g. pilot@devtrack.io" 
                  required
                  className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Assigned Cohort</label>
                <select 
                  value={inviteForm.cohortId}
                  onChange={(e) => setInviteForm({ ...inviteForm, cohortId: e.target.value })}
                  required
                  className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700 font-semibold"
                >
                  <option value="">Select a Cohort</option>
                  {stats.activeCohorts?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>

              <Button 
                type="submit" 
                disabled={generateInvite.isPending}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl"
              >
                {generateInvite.isPending ? 'Generating Code...' : 'Create Invite Link'}
              </Button>

              {generateInvite.isSuccess && (
                <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl mt-3 space-y-1">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Generated Invite Code:</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono font-bold text-emerald-400 select-all">{generateInvite.data.invite.code}</code>
                    <Badge variant="success" className="text-[9px] px-1 py-0.5">Ready</Badge>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Create Cohort */}
        <Card className="bg-zinc-950/40 border-zinc-800/80">
          <CardHeader className="pb-3 border-b border-zinc-900">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Plus size={15} className="text-purple-400" />
              Spin Up Beta Cohort
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                createCohort.mutate(cohortForm, {
                  onSuccess: () => setCohortForm({ name: '', description: '', type: 'alpha', targetSize: 50 })
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Cohort Identifier</label>
                <input 
                  type="text" 
                  value={cohortForm.name}
                  onChange={(e) => setCohortForm({ ...cohortForm, name: e.target.value })}
                  placeholder="e.g. Cohort Echo" 
                  required
                  className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                <input 
                  type="text" 
                  value={cohortForm.description}
                  onChange={(e) => setCohortForm({ ...cohortForm, description: e.target.value })}
                  placeholder="e.g. Early tester group for pacer systems" 
                  className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Type</label>
                  <select 
                    value={cohortForm.type}
                    onChange={(e) => setCohortForm({ ...cohortForm, type: e.target.value })}
                    className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700 font-semibold"
                  >
                    <option value="alpha">Alpha</option>
                    <option value="beta">Beta</option>
                    <option value="pilot">Pilot</option>
                    <option value="graduated">Graduated</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Target Size</label>
                  <input 
                    type="number" 
                    value={cohortForm.targetSize}
                    onChange={(e) => setCohortForm({ ...cohortForm, targetSize: parseInt(e.target.value) || 50 })}
                    required
                    className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700 font-mono font-bold"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={createCohort.isPending}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl"
              >
                {createCohort.isPending ? 'Provisioning Cohort...' : 'Initialize Cohort'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ─── Cohorts Registry & Status ─── */}
      <div className="lg:col-span-2 space-y-6">
        {/* Cohort Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
            <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Total Beta Users</p>
            <p className="text-xl font-bold text-zinc-200 mt-1">{stats.totalBetaUsers || 0}</p>
          </motion.div>
          <motion.div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
            <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Active Invites</p>
            <p className="text-xl font-bold text-zinc-200 mt-1">{stats.totalPendingInvites || 0}</p>
          </motion.div>
          <motion.div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
            <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Total Feedback Loops</p>
            <p className="text-xl font-bold text-zinc-200 mt-1">{stats.totalFeedbackIssues || 0}</p>
          </motion.div>
        </div>

        {/* Cohorts Registry */}
        <Card className="bg-zinc-950/40 border-zinc-800/80">
          <CardHeader className="pb-3 border-b border-zinc-900">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users size={15} className="text-zinc-400" />
              Closed Beta Cohorts Registry
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 font-bold">
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5">Type</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="py-2.5 text-right">Size / Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40">
                  {stats.activeCohorts?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-500">No cohorts found. Register a new one.</td>
                    </tr>
                  ) : (
                    stats.activeCohorts?.map((cohort: any) => (
                      <tr key={cohort.id} className="hover:bg-zinc-900/10">
                        <td className="py-3.5">
                          <p className="font-bold text-zinc-200">{cohort.name}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{cohort.description}</p>
                        </td>
                        <td className="py-3.5">
                          <Badge variant="default" className="capitalize text-[10px] px-1.5 py-0">
                            {cohort.type}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${cohort.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                          <span className="text-[10px] font-bold text-zinc-400 ml-1.5 capitalize">{cohort.status}</span>
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold text-zinc-300">
                          {cohort.currentSize || 0} <span className="text-zinc-650">/</span> {cohort.targetSize || 50}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/* ─── TAB 3: FEATURE GATES & ROLLOUTS ─── */
interface FeatureGatesTabProps {
  data: any;
  loading: boolean;
  toggleGate: any;
  configureGate: any;
}

const FeatureGatesTab: React.FC<FeatureGatesTabProps> = ({
  data,
  loading,
  toggleGate,
  configureGate,
}) => {
  const [editingGate, setEditingGate] = useState<string | null>(null);
  const [editingPercent, setEditingPercent] = useState<number>(0);

  if (loading) return <TabLoader />;
  if (!data?.success) return <TabError error="Could not load active feature gates." />;

  return (
    <Card className="bg-zinc-950/40 border-zinc-800/80">
      <CardHeader className="pb-3 border-b border-zinc-900">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Sliders size={15} className="text-emerald-400" />
          Feature Release Gates & Rollouts
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {data.gates?.length === 0 ? (
            <div className="py-8 text-center text-zinc-500">No feature gates found.</div>
          ) : (
            data.gates?.map((gate: any) => (
              <div 
                key={gate.featureName} 
                className="bg-zinc-900/25 border border-zinc-900 hover:border-zinc-850 p-4 rounded-xl space-y-3 transition-all duration-200"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      {gate.featureName}
                      <span className={`w-1.5 h-1.5 rounded-full ${gate.isEnabled ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5 capitalize">Type: {gate.rules?.type || 'standard rollout'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => {
                        setEditingGate(gate.featureName);
                        setEditingPercent(gate.rolloutPercentage || 0);
                      }}
                      className="text-[10px] font-bold border-zinc-850 px-2.5 h-7"
                    >
                      Tune Gate
                    </Button>
                    <Button 
                      size="sm" 
                      variant={gate.isEnabled ? 'danger' : 'success'}
                      disabled={toggleGate.isPending}
                      onClick={() => toggleGate.mutate({ featureName: gate.featureName, enabled: !gate.isEnabled })}
                      className="text-[10px] font-bold px-3 h-7"
                    >
                      {gate.isEnabled ? 'Global Kill' : 'Global Enable'}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-bold bg-zinc-950/20 px-3 py-1.5 rounded-lg border border-zinc-900/60">
                  <div className="flex items-center gap-2">
                    <Percent size={12} className="text-zinc-600" />
                    <span>Graduated Rollout Threshold:</span>
                  </div>
                  <span className="font-mono text-zinc-300">{gate.rolloutPercentage || 0}% of users</span>
                </div>

                {/* Rollout slider overlay */}
                {editingGate === gate.featureName && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="border-t border-zinc-900/80 pt-3 mt-2 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[11px] font-bold text-zinc-500">Rollout Level</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">{editingPercent}%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={editingPercent}
                        onChange={(e) => setEditingPercent(parseInt(e.target.value) || 0)}
                        className="flex-1 accent-emerald-500"
                      />
                      <Button 
                        size="sm" 
                        disabled={configureGate.isPending}
                        onClick={() => {
                          configureGate.mutate({
                            featureName: gate.featureName,
                            rolloutPercentage: editingPercent,
                          }, {
                            onSuccess: () => setEditingGate(null)
                          });
                        }}
                        className="h-7 text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        Apply Rollout
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => setEditingGate(null)}
                        className="h-7 text-[10px] font-bold border-zinc-850"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/* ─── TAB 4: KILL SWITCHES & SAFETY CONTROLS ─── */
interface KillSwitchesTabProps {
  data: any;
  loading: boolean;
  toggleSwitch: any;
  switchReason: Record<string, string>;
  setSwitchReason: any;
}

const KillSwitchesTab: React.FC<KillSwitchesTabProps> = ({
  data,
  loading,
  toggleSwitch,
  switchReason,
  setSwitchReason,
}) => {
  if (loading) return <TabLoader />;
  if (!data?.success) return <TabError error="Could not load global pacing kill switches." />;

  const isEmergency = data.switches?.some((s: any) => s.state === 'disabled');

  return (
    <div className="space-y-6">
      {/* ─── Big Red Emergency Box ─── */}
      <Card className={`border-2 ${isEmergency ? 'border-red-500 bg-red-950/15' : 'border-zinc-800 bg-zinc-950/40'}`}>
        <CardContent className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h2 className="text-base font-bold text-zinc-100 flex items-center justify-center md:justify-start gap-2">
              <XOctagon className={isEmergency ? 'text-red-500 animate-pulse' : 'text-zinc-500'} size={18} />
              Global Safety Control Center
            </h2>
            <p className="text-xs text-zinc-500 max-w-xl">
              Operator safety console. Activating a kill switch instantly suppresses behavioral triggers, notification dispatching, or adaptive progress pacing pipelines globally.
            </p>
          </div>
          {isEmergency && (
            <Badge variant="error" className="animate-pulse uppercase tracking-wider text-xs px-3 py-1 font-bold">
              Systems Suppressed
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* ─── Individual Kill Switches ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.switches?.map((s: any) => (
          <Card key={s.id} className="bg-zinc-950/40 border-zinc-800/80">
            <CardContent className="pt-4 flex flex-col justify-between h-full gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 tracking-tight">{s.name}</h3>
                  <p className="text-[11px] text-zinc-500 mt-1">{s.description}</p>
                </div>
                <Badge variant={s.state === 'active' ? 'success' : 'error'} className="text-[9px] uppercase px-1.5">
                  {s.state}
                </Badge>
              </div>

              {s.state !== 'active' && s.reason && (
                <div className="bg-zinc-900/40 border border-zinc-850 p-2.5 rounded-lg">
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Reason for Shutdown:</p>
                  <p className="text-[10px] text-red-400 mt-0.5 font-semibold font-mono">"{s.reason}"</p>
                  <p className="text-[9px] text-zinc-650 mt-1 font-bold">BY: {s.activatedBy || 'System'}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input 
                  type="text"
                  placeholder="Shutdown reason Required..."
                  value={switchReason[s.id] || ''}
                  onChange={(e) => setSwitchReason({ ...switchReason, [s.id]: e.target.value })}
                  disabled={s.state !== 'active'}
                  className="flex-1 bg-zinc-900/60 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-zinc-700 disabled:opacity-40 font-semibold"
                />
                <Button
                  size="sm"
                  variant={s.state === 'active' ? 'danger' : 'success'}
                  disabled={toggleSwitch.isPending || (s.state === 'active' && !switchReason[s.id])}
                  onClick={() => {
                    toggleSwitch.mutate({
                      switchId: s.id,
                      enabled: s.state !== 'active',
                      reason: switchReason[s.id] || 'Operator Override',
                    }, {
                      onSuccess: () => setSwitchReason({ ...switchReason, [s.id]: '' })
                    });
                  }}
                  className="h-8 text-[10px] font-bold px-3 shrink-0"
                >
                  {s.state === 'active' ? 'Force Stop' : 'Restore System'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

/* ─── TAB 5: SYSTEM HEALTH & DIAGNOSTICS ─── */
interface SystemTabProps {
  metrics: any;
  loading: boolean;
  telemetry: any[];
  sseStatus: string;
  connectionStatus: string;
}

const SystemTab: React.FC<SystemTabProps> = ({
  metrics,
  loading,
  telemetry,
  sseStatus,
  connectionStatus,
}) => {
  if (loading) return <TabLoader />;

  const queueData = metrics?.queues || [];
  const workerData = metrics?.workers?.xp || {};
  const sseData = metrics?.sse || {};

  return (
    <div className="space-y-6">
      {/* Real-time Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SSE State */}
        <Card className="bg-zinc-950/40 border-zinc-800/80">
          <CardHeader className="pb-3 border-b border-zinc-900">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Radio size={15} className="text-teal-400" />
              Real-time SSE Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">SSE Hook:</span>
              <span className="font-bold text-zinc-300 capitalize">{sseStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">SSE Store:</span>
              <span className="font-bold text-zinc-300 capitalize">{connectionStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Active Connections:</span>
              <span className="font-bold text-zinc-300 font-mono">{sseData.activeConnections || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Total Dispatch Events:</span>
              <span className="font-bold text-zinc-300 font-mono">{sseData.eventsPublished || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Worker Diagnostics */}
        <Card className="bg-zinc-950/40 border-zinc-800/80">
          <CardHeader className="pb-3 border-b border-zinc-900">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Zap size={15} className="text-yellow-400" />
              XP Pacing Workers
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">XP Processor:</span>
              <Badge variant={workerData.running ? 'success' : 'warning'} className="px-1.5">
                {workerData.running ? 'Running' : 'Stopped'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Processed Jobs:</span>
              <span className="font-bold text-zinc-300 font-mono">{workerData.processed || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Awarded Events:</span>
              <span className="font-bold text-zinc-300 font-mono">{workerData.awarded || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Deduped Duplicates:</span>
              <span className="font-bold text-zinc-300 font-mono text-emerald-400">{workerData.duplicates || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Queue Statuses */}
        <Card className="bg-zinc-950/40 border-zinc-800/80">
          <CardHeader className="pb-3 border-b border-zinc-900">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Server size={15} className="text-purple-400" />
              Queue Monitors
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3.5">
            {queueData.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">No job queues registered.</p>
            ) : (
              queueData.map((q: any) => (
                <div key={q.name} className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="font-bold text-zinc-400 font-mono truncate mr-2">{q.name}</span>
                    <span className="text-zinc-650 shrink-0 font-mono">
                      [W: {q.waiting} | A: {q.active} | F: {q.failed}]
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, (q.completed / (q.completed + q.failed || 1)) * 100)}%` }} />
                    <div className="bg-red-500 h-full" style={{ width: `${Math.min(100, (q.failed / (q.completed + q.failed || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Telemetry Logger */}
      <Card className="bg-zinc-950/40 border-zinc-800/80">
        <CardHeader className="pb-3 border-b border-zinc-900">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Activity size={15} className="text-zinc-400" />
            Client Telemetry Buffer
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-2 text-xs font-mono text-zinc-500 max-h-64 overflow-y-auto">
            {telemetry.length === 0 ? (
              <li className="text-center py-4">No operational events buffered.</li>
            ) : (
              telemetry.map((e: any, i: number) => (
                <li key={i} className="flex gap-2 p-1.5 hover:bg-zinc-900/20 rounded">
                  <span className="text-zinc-650 shrink-0">{new Date(e.ts).toLocaleTimeString()}</span>
                  <span className="text-zinc-400 font-bold shrink-0">[{e.name}]</span>
                  <span className="text-zinc-500 truncate">{JSON.stringify(e.data || {})}</span>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

/* ─── UTILS & SMALL SUB-COMPONENTS ─── */
const TabLoader = () => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <RefreshCw size={24} className="text-zinc-650 animate-spin mb-3" />
    <p className="text-xs text-zinc-500 font-bold tracking-widest uppercase">Fetching Diagnostics...</p>
  </div>
);

const TabError = ({ error }: { error: string }) => (
  <div className="flex items-start gap-3 rounded-xl bg-red-950/15 border border-red-900 p-4 max-w-xl mx-auto">
    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
    <div>
      <p className="text-xs font-bold text-red-400">Connection Interruption</p>
      <p className="text-[11px] text-zinc-500 mt-0.5">{error}</p>
    </div>
  </div>
);

interface HealthMetricCardProps {
  label: string;
  value: string;
  status: 'healthy' | 'warning' | 'critical';
}

const HealthMetricCard: React.FC<HealthMetricCardProps> = ({ label, value, status }) => {
  return (
    <motion.div
      layout
      className="rounded-xl border border-zinc-800/80 bg-zinc-950/30 p-4 relative overflow-hidden"
    >
      <p className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">{label}</p>
      <p className="text-xl font-bold text-zinc-100 mt-1">{value}</p>
      <div 
        className={`absolute bottom-0 left-0 right-0 h-[2px] 
          ${status === 'healthy' ? 'bg-emerald-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}
        `} 
      />
    </motion.div>
  );
};

interface MiniStatProps {
  label: string;
  value: string;
  color: 'emerald' | 'teal' | 'blue' | 'indigo' | 'purple';
}

const MiniStat: React.FC<MiniStatProps> = ({ label, value, color }) => {
  const colorMap = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/15',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/15',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/15',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/15',
  };

  return (
    <div className={`p-2.5 rounded-xl border text-center ${colorMap[color]}`}>
      <p className="text-[9px] font-bold uppercase tracking-wider opacity-75">{label}</p>
      <p className="text-base font-bold font-mono mt-0.5">{value}</p>
    </div>
  );
};

export default AdminPage;
