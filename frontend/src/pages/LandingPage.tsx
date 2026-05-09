import React, { useState, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

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

// ============================================================================
// NOISE TEXTURE COMPONENT
// ============================================================================

const NoiseOverlay: React.FC = () => (
  <div
    className="fixed inset-0 pointer-events-none opacity-[0.015] z-[9999]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
    }}
  />
);

// ============================================================================
// NAVBAR - Premium Floating Glass
// ============================================================================

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Dashboard', href: '#preview' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <>
      <NoiseOverlay />
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl transition-all duration-500 ${
          isScrolled
            ? 'top-3'
            : 'top-6'
        }`}
      >
        <motion.div
          className={`flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500 ${
            isScrolled
              ? 'bg-[#050816]/80 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-purple-500/10'
              : 'bg-[#050816]/60 backdrop-blur-xl border border-white/5'
          }`}
        >
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center shadow-lg shadow-purple-500/25 ring-1 ring-white/10">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">DevTrack</span>
          </motion.div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <motion.a
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/5 relative"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                {item.label}
              </motion.a>
            ))}
            <div className="ml-4 flex items-center gap-3">
              <motion.button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                Sign In
              </motion.button>
              <motion.button
                onClick={() => navigate('/login')}
                whileHover={{ y: -2, boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6366F1] rounded-full shadow-lg shadow-purple-500/20 transition-all duration-200 bg-[length:200%_auto] hover:bg-[position:100%_0]"
              >
                Get Started
              </motion.button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </motion.div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="md:hidden mt-2 p-4 rounded-2xl bg-[#050816]/90 backdrop-blur-xl border border-white/10"
            >
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="px-4 py-2 text-sm font-medium text-white/60"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <motion.button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 mt-2 text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] rounded-full"
                >
                  Get Started
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
};

// ============================================================================
// HERO SECTION - Cinematic
// ============================================================================

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[#050816]" />

      {/* Radial Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-[#8B5CF6]/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#6366F1]/10 rounded-full blur-[130px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[#7C3AED]/5 rounded-full blur-[180px]" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial="initial"
            animate={isInView ? "animate" : "initial"}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse shadow-lg shadow-green-400/50" />
              <span className="text-sm text-white/60">Trusted by 2,400+ developers</span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.02] tracking-tight mb-6"
            >
              Track Your
              <span className="block mt-3 bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#6366F1] bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">
                Developer Growth
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-white/60 max-w-xl mb-8 leading-relaxed"
            >
              The all-in-one platform for DSA tracking, coding streaks, GitHub insights, and productivity analytics. Level up your coding journey.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <motion.button
                onClick={() => navigate('/login')}
                whileHover={{ y: -3, boxShadow: '0 25px 60px rgba(139, 92, 246, 0.45)' }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6366F1] rounded-2xl shadow-xl shadow-purple-500/20 transition-all duration-200 bg-[length:200%_auto] hover:bg-[position:100%_0]"
              >
                Start Free
              </motion.button>
              <motion.button
                onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })}
                whileHover={{ y: -2, backgroundColor: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 text-base font-semibold text-white/80 bg-white/[0.05] border border-white/10 rounded-2xl backdrop-blur-sm transition-all duration-200"
              >
                View Dashboard
              </motion.button>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex items-center gap-8 mt-12">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.15, zIndex: 10 }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 border-2 border-[#050816] ring-1 ring-white/20"
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
                <span className="text-sm text-white/45">4.9/5 from 850+ reviews</span>
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
              <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6]/20 to-[#6366F1]/20 blur-3xl rounded-3xl" />

              {/* Dashboard Mockup */}
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.4 }}
                className="relative bg-[#070B1A]/90 rounded-2xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-sm"
              >
                {/* Window Controls */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#050816]/80 border-b border-white/5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="ml-4 text-xs text-white/40">DevTrack Dashboard</span>
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
                        whileHover={{ y: -4, borderColor: 'rgba(139, 92, 246, 0.3)' }}
                        className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span>{stat.icon}</span>
                          <div className="text-xs text-white/40">{stat.label}</div>
                        </div>
                        <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                          {stat.value}
                          {stat.suffix && <span className="text-sm font-normal text-white/40">{stat.suffix}</span>}
                        </div>
                        <div className="text-xs text-[#8B5CF6] mt-1">{stat.change}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Heatmap */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm">
                    <div className="text-xs text-white/40 mb-3">Contribution Activity</div>
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
                                    ? `rgba(139, 92, 246, ${Math.min(intensity + 0.2, 0.95)})`
                                    : 'rgba(255, 255, 255, 0.03)'
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
                        whileHover={{ x: 6, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] transition-all duration-200 cursor-pointer"
                      >
                        <span>{item.icon}</span>
                        <span className="text-sm text-white/70 flex-1">{item.text}</span>
                        <span className="text-xs text-white/30">{item.time}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Floating Elements */}
              <motion.div
                animate={floatAnimation}
                transition={floatAnimation.transition}
                className="absolute -right-10 top-20 p-4 bg-[#070B1A]/90 backdrop-blur-sm rounded-xl border border-white/10 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Streak: 45 Days</div>
                    <div className="text-xs text-white/40">Longest ever!</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 12, 0], transition: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 } }}
                className="absolute -left-8 bottom-24 p-4 bg-[#070B1A]/90 backdrop-blur-sm rounded-xl border border-white/10 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/20 flex items-center justify-center">
                    <span className="text-lg">📈</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">+847 Problems</div>
                    <div className="text-xs text-white/40">This year</div>
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

// ============================================================================
// PLATFORMS SECTION
// ============================================================================

const PlatformsSection: React.FC = () => {
  const platforms = [
    { name: 'GitHub', icon: '🐙' },
    { name: 'LeetCode', icon: '🔥' },
    { name: 'Codeforces', icon: '⚡' },
    { name: 'CodeChef', icon: '🍴' },
    { name: 'HackerRank', icon: '👨‍💻' },
  ];

  return (
    <section className="py-20 bg-[#050816] border-y border-white/5 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-[#8B5CF6]/5 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-[#6366F1]/5 rounded-full blur-[80px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-sm text-white/40 mb-6">Sync with your favorite platforms</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {platforms.map((platform, i) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, scale: 1.05 }}
                className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-all duration-200 cursor-pointer"
              >
                <span className="text-2xl grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">{platform.icon}</span>
                <span className="text-sm font-medium">{platform.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ============================================================================
// FEATURES SECTION
// ============================================================================

const features = [
  { icon: '🧮', title: 'DSA Analytics', description: 'Track problems solved across LeetCode, Codeforces, and more.' },
  { icon: '🔥', title: 'Streak Tracking', description: 'Build consistency with daily coding streaks. View historical data.' },
  { icon: '📊', title: 'GitHub Insights', description: 'Visualize commits, contributions, and repository activity.' },
  { icon: '🗓️', title: 'Contest Analytics', description: 'Track participation and ratings. Analyze performance trends.' },
  { icon: '🎯', title: 'Project Tracking', description: 'Monitor side projects. Track commits and milestones.' },
  { icon: '📈', title: 'Productivity AI', description: 'Get intelligent insights about your coding habits.' },
  { icon: '🏆', title: 'Achievements', description: 'Unlock badges and milestones for your coding journey.' },
  { icon: '📅', title: 'Activity Timeline', description: 'View your complete coding history in a beautiful timeline.' },
];

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-32 bg-[#050816] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#8B5CF6]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#6366F1]/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] bg-clip-text text-transparent">
              level up
            </span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Comprehensive analytics and insights to help you become a better developer
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
              className="group relative p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:border-[#8B5CF6]/30 hover:bg-white/[0.04] transition-all duration-500 overflow-hidden"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/0 to-[#6366F1]/0 group-hover:from-[#8B5CF6]/5 group-hover:to-[#6366F1]/5 transition-all duration-500" />

              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#6366F1]/20 flex items-center justify-center mb-4 text-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#8B5CF6] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Glow effect */}
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#8B5CF6]/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// DASHBOARD PREVIEW SECTION
// ============================================================================

const DashboardPreviewSection: React.FC = () => {
  return (
    <section id="preview" className="py-32 bg-[#070B1A] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#8B5CF6]/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Your development journey,{' '}
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] bg-clip-text text-transparent">
              visualized
            </span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Beautiful, real-time dashboards that make tracking your progress effortless
          </p>
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6]/10 to-[#6366F1]/10 blur-3xl rounded-3xl" />
          <div className="relative bg-[#050816] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Window Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#050816]/80 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-white/70">DevTrack</span>
              </div>
              <div className="flex items-center gap-6 text-xs text-white/40">
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
                    { label: 'Total Problems', value: '847', change: '+23 this week', color: '[#8B5CF6]' },
                    { label: 'Current Streak', value: '45', suffix: 'days', emoji: '🔥', color: 'orange' },
                    { label: 'Rating', value: '1842', change: 'Top 15%', color: '[#6366F1]' },
                  ].map((stat) => (
                    <motion.div
                      key={stat.label}
                      whileHover={{ scale: 1.02 }}
                      className="p-5 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-sm"
                    >
                      <div className="text-xs text-white/40 mb-2">{stat.label}</div>
                      <div className="text-3xl font-bold text-white flex items-center gap-2">
                        {stat.value}
                        {stat.suffix && <span className="text-sm font-normal text-white/40">{stat.suffix}</span>}
                        {stat.emoji && <span>{stat.emoji}</span>}
                      </div>
                      <div className={`text-xs mt-2 ${stat.color === '[#8B5CF6]' ? 'text-[#8B5CF6]' : stat.color === 'orange' ? 'text-orange-400' : 'text-[#6366F1]'}`}>
                        {stat.change}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Heatmap */}
                  <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-medium text-white">Activity Heatmap</div>
                      <div className="flex gap-1">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                          <span key={i} className="text-xs text-white/30 w-3 text-center">{d}</span>
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
                                    ? `rgba(139, 92, 246, ${Math.min(intensity + 0.3, 1)})`
                                    : 'rgba(255, 255, 255, 0.03)'
                                }}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-3">
                      <span className="text-xs text-white/30">Less</span>
                      {[0.1, 0.3, 0.5, 0.7, 0.9].map((v, i) => (
                        <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(139, 92, 246, ${v})` }} />
                      ))}
                      <span className="text-xs text-white/30">More</span>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                    <div className="text-sm font-medium text-white mb-4">Recent Activity</div>
                    <div className="space-y-3">
                      {[
                        { type: 'solved', platform: 'LeetCode', problem: 'Binary Tree Level Order Traversal', difficulty: 'Medium', time: '2h ago' },
                        { type: 'commit', platform: 'GitHub', problem: 'pushed to portfolio', time: '4h ago' },
                        { type: 'contest', platform: 'Codeforces', problem: 'Round #892 Div. 3', time: '1d ago' },
                      ].map((activity, i) => (
                        <motion.div
                          key={i}
                          whileHover={{ x: 6, backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
                          className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] cursor-pointer transition-all duration-200"
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            activity.type === 'solved' ? 'bg-green-500/20 text-green-400' :
                            activity.type === 'commit' ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {activity.type === 'solved' ? '✓' : activity.type === 'commit' ? '⬡' : '🏆'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">{activity.problem}</div>
                            <div className="text-xs text-white/40">{activity.platform} · {activity.time}</div>
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
      </div>
    </section>
  );
};

// ============================================================================
// HOW IT WORKS SECTION
// ============================================================================

const steps = [
  { number: '01', title: 'Connect Platforms', description: 'Link your GitHub, LeetCode, Codeforces accounts with one-click OAuth.', icon: '🔗' },
  { number: '02', title: 'Sync Data', description: 'We automatically fetch your activity, problems solved, and contributions.', icon: '🔄' },
  { number: '03', title: 'Track Progress', description: 'View beautiful dashboards with streaks, heatmaps, and analytics.', icon: '📊' },
  { number: '04', title: 'Improve', description: 'Get AI-powered insights to help you level up your coding skills.', icon: '🚀' },
];

const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-32 bg-[#050816] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#8B5CF6]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#6366F1]/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How it{' '}
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] bg-clip-text text-transparent">
              works
            </span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Get started in minutes with our simple onboarding process
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#8B5CF6]/30 to-transparent transform -translate-y-1/2" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              <motion.div
                whileHover={{ y: -8 }}
                className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm h-full relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/0 to-[#6366F1]/0 group-hover:from-[#8B5CF6]/5 group-hover:to-[#6366F1]/5 transition-all duration-500" />
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#6366F1]/20 flex items-center justify-center text-2xl mb-4 border border-white/10"
                  >
                    {step.icon}
                  </motion.div>
                  <div className="text-5xl font-bold text-white/[0.06] mb-2">{step.number}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-white/50">{step.description}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// TESTIMONIALS SECTION
// ============================================================================

const testimonials = [
  {
    quote: "Went from 50 to 400+ LeetCode problems in 6 months. The streak feature kept me accountable every single day.",
    author: "akash_dev",
    role: "SDE at Uber",
    stats: "400+ problems solved",
    avatar: "A",
    featured: true,
  },
  {
    quote: "Finally understood where my time went. The GitHub heatmap showed I was most productive at night - changed my schedule accordingly.",
    author: "sarah_codes",
    role: "Full Stack Developer",
    stats: "120-day streak",
    avatar: "S",
  },
  {
    quote: "Landed my dream job thanks to DevTrack. The analytics helped me identify weak areas in DP and graphs.",
    author: "priya_cpp",
    role: "Backend Engineer at Stripe",
    stats: "CF Rating: 1850 → 2150",
    avatar: "P",
  },
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-32 bg-[#070B1A] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#8B5CF6]/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Loved by{' '}
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] bg-clip-text text-transparent">
              developers
            </span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Join thousands of developers tracking their growth with DevTrack
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -8 }}
              className={`p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm hover:border-[#8B5CF6]/20 transition-all duration-300 ${
                testimonial.featured ? 'md:col-span-2 md:row-span-1' : ''
              }`}
            >
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-white/70 mb-6 leading-relaxed">"{testimonial.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center text-sm font-semibold text-white">
                  {testimonial.avatar}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{testimonial.author}</div>
                  <div className="text-xs text-white/40">{testimonial.role}</div>
                </div>
                <div className="text-xs text-[#8B5CF6] bg-[#8B5CF6]/10 px-2 py-1 rounded">
                  {testimonial.stats}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// PRICING SECTION
// ============================================================================

const pricingPlans = [
  {
    name: 'Solo Coder',
    price: 'Free',
    description: 'Perfect for individual developers getting started',
    features: [
      'DSA problem tracking',
      'GitHub integration',
      'Basic analytics',
      '7-day activity history',
      'Community support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro Developer',
    price: '$9',
    period: '/month',
    description: 'For serious developers who want full insights',
    features: [
      'Everything in Free',
      'Unlimited activity history',
      'Advanced analytics',
      'Contest tracking',
      'Achievement system',
      'Priority support',
      'Custom dashboards',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Team',
    price: '$29',
    period: '/month',
    description: 'For engineering teams tracking group progress',
    features: [
      'Everything in Pro',
      'Team analytics',
      'Leaderboards',
      'Shared dashboards',
      'API access',
      'Custom integrations',
      'Dedicated support',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const PricingSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-32 bg-[#050816] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#8B5CF6]/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple,{' '}
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] bg-clip-text text-transparent">
              transparent
            </span>
            {' '}pricing
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Choose the plan that fits your coding journey
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pricingPlans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className={`relative p-6 rounded-3xl border transition-all duration-300 ${
                plan.popular
                  ? 'bg-white/[0.04] border-[#8B5CF6]/40 shadow-2xl shadow-[#8B5CF6]/10 scale-105'
                  : 'bg-white/[0.02] border-white/[0.05] hover:border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] rounded-full text-xs font-semibold text-white shadow-lg shadow-purple-500/30">
                  Most Popular
                </div>
              )}

              <div className="text-lg font-semibold text-white mb-2">{plan.name}</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                {plan.period && <span className="text-sm text-white/40">{plan.period}</span>}
              </div>
              <p className="text-sm text-white/50 mb-6">{plan.description}</p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-white/50">
                    <svg className="w-4 h-4 text-[#8B5CF6] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <motion.button
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30'
                    : 'bg-white/[0.05] text-white hover:bg-white/[0.1] border border-white/10'
                }`}
              >
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// CTA SECTION
// ============================================================================

const CTASection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-32 bg-[#070B1A] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#8B5CF6]/20 to-transparent" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Start tracking your{' '}
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] bg-clip-text text-transparent">
              developer growth
            </span>
          </h2>
          <p className="text-lg text-white/50 mb-10 max-w-2xl mx-auto">
            Join thousands of developers who are leveling up their coding journey with DevTrack
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <motion.button
              onClick={() => navigate('/login')}
              whileHover={{ y: -4, boxShadow: '0 25px 60px rgba(139, 92, 246, 0.45)' }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6366F1] rounded-2xl shadow-xl shadow-purple-500/20 transition-all duration-200 bg-[length:200%_auto] hover:bg-[position:100%_0]"
            >
              Start Free Now
            </motion.button>
            <motion.button
              onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ y: -2, backgroundColor: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 text-base font-semibold text-white/70 bg-white/[0.05] border border-white/10 rounded-2xl backdrop-blur-sm transition-all duration-200"
            >
              View Demo
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ============================================================================
// FOOTER
// ============================================================================

const Footer: React.FC = () => {
  const footerLinks = {
    Product: ['Features', 'Pricing', 'Dashboard', 'Integrations'],
    Company: ['About', 'Blog', 'Careers', 'Contact'],
    Resources: ['Documentation', 'API', 'Guides', 'Community'],
    Legal: ['Privacy', 'Terms', 'Security', 'Cookies'],
  };

  return (
    <footer className="py-16 bg-[#050816] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-6 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center shadow-lg shadow-purple-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">DevTrack</span>
            </div>
            <p className="text-sm text-white/40 mb-6 max-w-xs leading-relaxed">
              The all-in-one platform for tracking your developer journey. Level up your coding skills with actionable insights.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-white/30 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-white/30 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <div className="text-sm font-semibold text-white mb-4">{category}</div>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-white/40 hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/30">
            © 2025 DevTrack. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-white/30">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050816]">
      <Navbar />
      <HeroSection />
      <PlatformsSection />
      <FeaturesSection />
      <DashboardPreviewSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;