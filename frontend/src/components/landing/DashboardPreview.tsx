import React from 'react';
import { motion } from 'framer-motion';

export const DashboardPreview: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-dt-primary/10 to-dt-secondary/10 blur-3xl rounded-3xl" />
      <div className="relative bg-dt-elevated rounded-2xl border border-dt-primary/10 overflow-hidden shadow-dt-card-hover backdrop-blur-md">
        {/* Window Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-dt-bg/80 border-b border-dt-primary/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dt-primary to-dt-secondary flex items-center justify-center shadow-lg shadow-dt-primary/20">
              <svg className="w-5 h-5 text-white drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <span className="text-[14px] font-bold text-dt-text tracking-tight">DevTrack</span>
          </div>
          <div className="flex items-center gap-6 text-[13px] font-bold text-dt-textSecondary">
            {['Dashboard', 'Analytics', 'Settings', 'Profile'].map((item) => (
              <motion.span
                key={item}
                whileHover={{ color: 'rgba(15, 23, 42, 0.8)' }}
                className="cursor-pointer transition-colors"
              >
                {item}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {[
                { label: 'Total Problems', value: '847', change: '+23 this week', color: 'dt-primary' },
                { label: 'Current Streak', value: '45', suffix: 'days', emoji: '🔥', color: 'dt-warning' },
                { label: 'Rating', value: '1842', change: 'Top 15%', color: 'dt-secondary' },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ scale: 1.02 }}
                  className="p-5 rounded-xl dt-card bg-dt-surface border border-dt-primary/10 backdrop-blur-sm"
                >
                  <div className="text-[11px] font-bold text-dt-textSecondary uppercase tracking-widest mb-2">{stat.label}</div>
                  <div className="text-3xl font-extrabold text-dt-text flex items-center gap-2 tracking-tight">
                    {stat.value}
                    {stat.suffix && <span className="text-[14px] font-semibold text-dt-textSecondary">{stat.suffix}</span>}
                    {stat.emoji && <span>{stat.emoji}</span>}
                  </div>
                  <div className={`text-[12px] font-bold mt-2 ${stat.color === 'dt-primary' ? 'text-dt-primary' : stat.color === 'dt-warning' ? 'text-dt-warning' : 'text-dt-secondary'}`}>
                    {stat.change}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Heatmap */}
              <div className="p-5 rounded-xl dt-card bg-dt-surface border border-dt-primary/10 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[14px] font-bold text-dt-text">Activity Heatmap</div>
                  <div className="flex gap-1">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                      <span key={i} className="text-[10px] font-bold text-dt-textMuted w-3 text-center">{d}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 overflow-x-auto pb-2">
                  {Array.from({ length: 52 }).map((_, week) => (
                    <div key={week} className="flex flex-col gap-1">
                      {Array.from({ length: 7 }).map((_, day) => {
                        const intensity = Math.random();
                        return (
                          <motion.div
                            key={day}
                            whileHover={{ scale: 2 }}
                            className="w-3 h-3 rounded-sm"
                            style={{
                              backgroundColor: intensity > 0.25
                                ? `rgba(124, 92, 252, ${Math.min(intensity + 0.3, 1)})`
                                : 'rgba(124, 92, 252, 0.05)'
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-1 mt-3">
                  <span className="text-[11px] font-semibold text-dt-textMuted">Less</span>
                  {[0.05, 0.3, 0.5, 0.7, 0.9].map((v, i) => (
                    <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: v === 0.05 ? 'rgba(124, 92, 252, 0.05)' : `rgba(124, 92, 252, ${v})` }} />
                  ))}
                  <span className="text-[11px] font-semibold text-dt-textMuted">More</span>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="p-5 rounded-xl dt-card bg-dt-surface border border-dt-primary/10 backdrop-blur-sm">
                <div className="text-[14px] font-bold text-dt-text mb-4">Recent Activity</div>
                <div className="space-y-3">
                  {[
                    { type: 'solved', platform: 'LeetCode', problem: 'Binary Tree Level Order Traversal', difficulty: 'Medium', time: '2h ago' },
                    { type: 'commit', platform: 'GitHub', problem: 'pushed to portfolio', time: '4h ago' },
                    { type: 'contest', platform: 'Codeforces', problem: 'Round #892 Div. 3', time: '1d ago' },
                  ].map((activity, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ x: 6, backgroundColor: 'rgba(124, 92, 252, 0.05)' }}
                      className="flex items-center gap-4 p-3 rounded-xl bg-dt-surface border border-dt-primary/5 cursor-pointer transition-all duration-200 shadow-sm"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        activity.type === 'solved' ? 'bg-dt-success/10 text-dt-success border border-dt-success/20' :
                        activity.type === 'commit' ? 'bg-dt-primary/10 text-dt-primary border border-dt-primary/20' :
                        'bg-dt-info/10 text-dt-info border border-dt-info/20'
                      }`}>
                        {activity.type === 'solved' ? '✓' : activity.type === 'commit' ? '⬡' : '🏆'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-bold text-dt-text truncate">{activity.problem}</div>
                        <div className="text-[12px] font-medium text-dt-textSecondary">{activity.platform} · {activity.time}</div>
                      </div>
                      {activity.difficulty && (
                        <span className={`px-2 py-1 text-[11px] font-bold tracking-wider uppercase rounded-md ${
                          activity.difficulty === 'Easy' ? 'bg-dt-success/10 text-dt-success' :
                          activity.difficulty === 'Medium' ? 'bg-dt-warning/10 text-dt-warning' :
                          'bg-dt-error/10 text-dt-error'
                        }`}>
                          {activity.difficulty}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
