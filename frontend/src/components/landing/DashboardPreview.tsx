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
      <div className="absolute inset-0 bg-gradient-to-r from-[#7C6CF2]/10 to-[#A78BFA]/10 blur-3xl rounded-3xl" />
      <div className="relative bg-[#F7F6F3] rounded-2xl border border-[rgba(15,23,42,0.06)] overflow-hidden shadow-2xl">
        {/* Window Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F7F6F3]/80 border-b border-[rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C6CF2] to-[#A78BFA] flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg className="w-5 h-5 text-[#0F172A]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-[#0F172A]/70">DevTrack</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-[#64748B]">
            {['Dashboard', 'Analytics', 'Settings', 'Profile'].map((item) => (
              <motion.span
                key={item}
                whileHover={{ color: 'rgba(255,255,255,0.6)' }}
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
                { label: 'Total Problems', value: '847', change: '+23 this week', color: '[#7C6CF2]' },
                { label: 'Current Streak', value: '45', suffix: 'days', emoji: '🔥', color: 'orange' },
                { label: 'Rating', value: '1842', change: 'Top 15%', color: '[#A78BFA]' },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ scale: 1.02 }}
                  className="p-5 rounded-xl bg-white border border-[rgba(15,23,42,0.06)] backdrop-blur-sm"
                >
                  <div className="text-xs text-[#64748B] mb-2">{stat.label}</div>
                  <div className="text-3xl font-bold text-[#0F172A] flex items-center gap-2">
                    {stat.value}
                    {stat.suffix && <span className="text-sm font-normal text-[#64748B]">{stat.suffix}</span>}
                    {stat.emoji && <span>{stat.emoji}</span>}
                  </div>
                  <div className={`text-xs mt-2 ${stat.color === '[#7C6CF2]' ? 'text-[#7C6CF2]' : stat.color === 'orange' ? 'text-orange-400' : 'text-[#A78BFA]'}`}>
                    {stat.change}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Heatmap */}
              <div className="p-5 rounded-xl bg-white border border-[rgba(15,23,42,0.06)] backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium text-[#0F172A]">Activity Heatmap</div>
                  <div className="flex gap-1">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                      <span key={i} className="text-xs text-[#94A3B8] w-3 text-center">{d}</span>
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
                                ? `rgba(124, 108, 242, ${Math.min(intensity + 0.3, 1)})`
                                : 'rgba(15, 23, 42, 0.04)'
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-1 mt-3">
                  <span className="text-xs text-[#94A3B8]">Less</span>
                  {[0.04, 0.3, 0.5, 0.7, 0.9].map((v, i) => (
                    <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: v === 0.04 ? 'rgba(15, 23, 42, 0.04)' : `rgba(124, 108, 242, ${v})` }} />
                  ))}
                  <span className="text-xs text-[#94A3B8]">More</span>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="p-5 rounded-xl bg-white border border-[rgba(15,23,42,0.06)] backdrop-blur-sm">
                <div className="text-sm font-medium text-[#0F172A] mb-4">Recent Activity</div>
                <div className="space-y-3">
                  {[
                    { type: 'solved', platform: 'LeetCode', problem: 'Binary Tree Level Order Traversal', difficulty: 'Medium', time: '2h ago' },
                    { type: 'commit', platform: 'GitHub', problem: 'pushed to portfolio', time: '4h ago' },
                    { type: 'contest', platform: 'Codeforces', problem: 'Round #892 Div. 3', time: '1d ago' },
                  ].map((activity, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ x: 6, backgroundColor: 'rgba(15, 23, 42, 0.02)' }}
                      className="flex items-center gap-4 p-3 rounded-lg bg-white cursor-pointer transition-all duration-200"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        activity.type === 'solved' ? 'bg-green-500/20 text-green-400' :
                        activity.type === 'commit' ? 'bg-[#7C6CF2]/20 text-[#7C6CF2]' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {activity.type === 'solved' ? '✓' : activity.type === 'commit' ? '⬡' : '🏆'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[#0F172A] truncate">{activity.problem}</div>
                        <div className="text-xs text-[#64748B]">{activity.platform} · {activity.time}</div>
                      </div>
                      {activity.difficulty && (
                        <span className={`px-2 py-1 text-xs rounded ${
                          activity.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                          activity.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
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
