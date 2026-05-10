import React from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AnimatedButton } from './AnimatedButton';

const fadeInUp = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const floatAnimation = {
  y: [0, -15, 0],
  transition: { duration: 4, repeat: Infinity },
};

export const Hero: React.FC = () => {
  const navigate = useNavigate();
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[#F7F6F3]" />

      {/* Radial Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-[#7C6CF2]/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#A78BFA]/10 rounded-full blur-[130px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[#7C3AED]/5 rounded-full blur-[180px]" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial="initial"
            animate={isInView ? "animate" : "initial"}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[rgba(15,23,42,0.06)] backdrop-blur-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse shadow-lg shadow-green-400/50" />
              <span className="text-sm text-[#64748B]">Trusted by 2,400+ developers</span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#0F172A] leading-[1.02] tracking-tight mb-6"
            >
              Track Your
              <span className="block mt-3 bg-gradient-to-r from-[#7C6CF2] via-[#7C6CF2] to-[#A78BFA] bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">
                Developer Growth
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-[#64748B] max-w-xl mb-8 leading-relaxed"
            >
              The all-in-one platform for DSA tracking, coding streaks, GitHub insights, and productivity analytics. Level up your coding journey.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <AnimatedButton
                onClick={() => navigate('/login')}
                variant="primary"
              >
                Start Free
              </AnimatedButton>
              <AnimatedButton
                onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })}
                variant="secondary"
              >
                View Dashboard
              </AnimatedButton>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex items-center gap-8 mt-12">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.15, zIndex: 10 }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[rgba(15,23,42,0.02)] to-[rgba(15,23,42,0.01)] border-2 border-[#050816] ring-1 ring-white/20 relative z-0"
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-[#0F172A]/45">4.9/5 from 850+ reviews</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, rotateX: 25 }}
            animate={isInView ? { opacity: 1, scale: 1, rotateX: 0 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#7C6CF2]/20 to-[#A78BFA]/20 blur-3xl rounded-3xl" />

              {/* Dashboard Mockup */}
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.4 }}
                className="relative bg-[#F1EFEA]/90 rounded-2xl border border-[rgba(15,23,42,0.06)] overflow-hidden shadow-2xl backdrop-blur-sm"
              >
                {/* Window Controls */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#F7F6F3]/80 border-b border-[rgba(15,23,42,0.06)]">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="ml-4 text-xs text-[#64748B]">DevTrack Dashboard</span>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Problems Solved', value: '847', change: '+23', icon: '🧮' },
                      { label: 'Current Streak', value: '45', suffix: 'days', change: '🔥', icon: '🔥' },
                      { label: 'GitHub Commits', value: '1,284', change: '+12%', icon: '📊' },
                    ].map((stat) => (
                      <motion.div
                        key={stat.label}
                        whileHover={{ y: -4, borderColor: 'rgba(124, 108, 242, 0.3)' }}
                        className="p-4 rounded-xl bg-white border border-[rgba(15,23,42,0.06)] backdrop-blur-sm transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span>{stat.icon}</span>
                          <div className="text-xs text-[#64748B]">{stat.label}</div>
                        </div>
                        <div className="text-2xl font-bold text-[#0F172A] flex items-baseline gap-1">
                          {stat.value}
                          {stat.suffix && <span className="text-sm font-normal text-[#64748B]">{stat.suffix}</span>}
                        </div>
                        <div className="text-xs text-[#7C6CF2] mt-1">{stat.change}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Heatmap */}
                  <div className="p-4 rounded-xl bg-white border border-[rgba(15,23,42,0.06)] backdrop-blur-sm">
                    <div className="text-xs text-[#64748B] mb-3">Contribution Activity</div>
                    <div className="flex gap-1">
                      {Array.from({ length: 52 }).map((_, week) => (
                        <div key={week} className="flex flex-col gap-1">
                          {Array.from({ length: 7 }).map((_, day) => {
                            const intensity = Math.random();
                            return (
                              <motion.div
                                key={day}
                                whileHover={{ scale: 2 }}
                                className="w-2 h-2 rounded-sm"
                                style={{
                                  backgroundColor: intensity > 0.35
                                    ? `rgba(124, 108, 242, ${Math.min(intensity + 0.2, 0.95)})`
                                    : 'rgba(15, 23, 42, 0.04)'
                                }}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Activity Feed */}
                  <div className="space-y-2">
                    {[
                      { icon: '💻', text: 'Solved "Binary Tree Inorder Traversal"', time: '2h ago' },
                      { icon: '📊', text: 'Completed 5 LeetCode medium problems', time: '4h ago' },
                      { icon: '🔥', text: 'Extended streak to 45 days!', time: '6h ago' },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ x: 6, backgroundColor: 'rgba(15, 23, 42, 0.02)' }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white transition-all duration-200 cursor-pointer"
                      >
                        <span>{item.icon}</span>
                        <span className="text-sm text-[#0F172A]/70 flex-1">{item.text}</span>
                        <span className="text-xs text-[#94A3B8]">{item.time}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Floating Elements */}
              <motion.div
                animate={floatAnimation}
                transition={floatAnimation.transition}
                className="absolute -right-10 top-20 p-4 bg-[#F1EFEA]/90 backdrop-blur-sm rounded-xl border border-[rgba(15,23,42,0.06)] shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#0F172A]">Streak: 45 Days</div>
                    <div className="text-xs text-[#64748B]">Longest ever!</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 12, 0], transition: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 } }}
                className="absolute -left-8 bottom-24 p-4 bg-[#F1EFEA]/90 backdrop-blur-sm rounded-xl border border-[rgba(15,23,42,0.06)] shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#7C6CF2]/20 flex items-center justify-center">
                    <span className="text-lg">📈</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#0F172A]">+847 Problems</div>
                    <div className="text-xs text-[#64748B]">This year</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
