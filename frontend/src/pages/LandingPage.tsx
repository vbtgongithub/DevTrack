import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { FeatureCard } from '../components/landing/FeatureCard';
import { DashboardPreview } from '../components/landing/DashboardPreview';
import { PricingCard } from '../components/landing/PricingCard';
import { TestimonialCard } from '../components/landing/TestimonialCard';
import { Footer } from '../components/landing/Footer';
import { AnimatedButton } from '../components/landing/AnimatedButton';
import { SectionWrapper } from '../components/landing/SectionWrapper';

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
// PLATFORMS SECTION
// ============================================================================

const PlatformsSection: React.FC = () => {
  const platforms = [
    { name: 'GitHub', icon: '🐙' },
    { name: 'LeetCode', icon: '🔥' },
    { name: 'Codeforces', icon: '⚡' },
    { name: 'CodeChef', icon: '🍴' },
  ];

  return (
    <SectionWrapper
      bgConfig={{ color: 'bg-dt-bg', hasGlow: true, glowPositions: ['top-left', 'top-right'] }}
      className="!py-20 border-y border-dt-primary/5"
    >
      <div className="text-center mb-10">
        <p className="text-sm font-medium text-dt-textSecondary tracking-wide uppercase mb-6">Sync with your favorite platforms</p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {platforms.map((platform, i) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, scale: 1.05 }}
              className="flex items-center gap-2 text-dt-textSecondary hover:text-dt-text transition-all duration-200 cursor-pointer"
            >
              <span className="text-2xl grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">{platform.icon}</span>
              <span className="text-sm font-bold tracking-tight">{platform.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
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
    <SectionWrapper id="features" bgConfig={{ color: 'bg-dt-bg', hasGlow: true, glowPositions: ['top-left', 'bottom-right'] }}>
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-dt-text tracking-tight mb-4">
          Everything you need to{' '}
          <span className="bg-gradient-to-r from-dt-primary to-dt-secondary bg-clip-text text-transparent">
            level up
          </span>
        </h2>
        <p className="text-lg text-dt-textSecondary max-w-2xl mx-auto font-medium">
          Comprehensive analytics and insights to help you become a better developer
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((feature, i) => (
          <FeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            delay={i * 0.08}
          />
        ))}
      </div>
    </SectionWrapper>
  );
};

// ============================================================================
// DASHBOARD PREVIEW SECTION
// ============================================================================

const DashboardPreviewSection: React.FC = () => {
  return (
    <SectionWrapper id="preview" bgConfig={{ color: 'bg-dt-elevated', hasGlow: true, glowPositions: ['center'] }}>
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-dt-text tracking-tight mb-4">
          Your development journey,{' '}
          <span className="bg-gradient-to-r from-dt-primary to-dt-secondary bg-clip-text text-transparent">
            visualized
          </span>
        </h2>
        <p className="text-lg text-dt-textSecondary max-w-2xl mx-auto font-medium">
          Beautiful, real-time dashboards that make tracking your progress effortless
        </p>
      </div>
      <DashboardPreview />
    </SectionWrapper>
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
    <SectionWrapper bgConfig={{ color: 'bg-dt-bg', hasGlow: true, glowPositions: ['top-left', 'bottom-right'] }}>
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-dt-text tracking-tight mb-4">
          How it{' '}
          <span className="bg-gradient-to-r from-dt-primary to-dt-secondary bg-clip-text text-transparent">
            works
          </span>
        </h2>
        <p className="text-lg text-dt-textSecondary max-w-2xl mx-auto font-medium">
          Get started in minutes with our simple onboarding process
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {/* Connection Line */}
        <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-dt-primary/30 to-transparent transform -translate-y-1/2" />

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
              className="p-6 rounded-3xl dt-card bg-dt-surface border border-dt-primary/10 backdrop-blur-sm h-full relative overflow-hidden group shadow-sm hover:shadow-dt-card-hover"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-dt-primary/0 to-dt-secondary/0 group-hover:from-dt-primary/5 group-hover:to-dt-secondary/5 transition-all duration-500" />
              <div className="relative">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-dt-primary/10 to-dt-secondary/10 flex items-center justify-center text-2xl mb-4 border border-dt-primary/10 shadow-sm text-dt-primary"
                >
                  {step.icon}
                </motion.div>
                <div className="text-5xl font-extrabold text-dt-primary/5 mb-2">{step.number}</div>
                <h3 className="text-[17px] font-bold text-dt-text tracking-tight mb-2">{step.title}</h3>
                <p className="text-[14px] text-dt-textSecondary font-medium">{step.description}</p>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
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
    <SectionWrapper bgConfig={{ color: 'bg-dt-elevated', hasGlow: true, glowPositions: ['bottom-left'] }}>
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-dt-text tracking-tight mb-4">
          Loved by{' '}
          <span className="bg-gradient-to-r from-dt-primary to-dt-secondary bg-clip-text text-transparent">
            developers
          </span>
        </h2>
        <p className="text-lg text-dt-textSecondary max-w-2xl mx-auto font-medium">
          Join thousands of developers tracking their growth with DevTrack
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, i) => (
          <TestimonialCard
            key={testimonial.author}
            {...testimonial}
            delay={i * 0.15}
          />
        ))}
      </div>
    </SectionWrapper>
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
    <SectionWrapper id="pricing" bgConfig={{ color: 'bg-dt-bg', hasGlow: true, glowPositions: ['center'] }}>
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-dt-text tracking-tight mb-4">
          Simple,{' '}
          <span className="bg-gradient-to-r from-dt-primary to-dt-secondary bg-clip-text text-transparent">
            transparent
          </span>
          {' '}pricing
        </h2>
        <p className="text-lg text-dt-textSecondary max-w-2xl mx-auto font-medium">
          Choose the plan that fits your coding journey
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {pricingPlans.map((plan, i) => (
          <PricingCard
            key={plan.name}
            {...plan}
            delay={i * 0.1}
            onCtaClick={() => navigate('/login')}
          />
        ))}
      </div>
    </SectionWrapper>
  );
};

// ============================================================================
// CTA SECTION
// ============================================================================

const CTASection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <SectionWrapper bgConfig={{ color: 'bg-dt-elevated', hasGlow: true, glowPositions: ['center'] }}>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-dt-primary/20 to-transparent pointer-events-none" />

      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-dt-text tracking-tight mb-6">
          Start tracking your{' '}
          <span className="bg-gradient-to-r from-dt-primary to-dt-secondary bg-clip-text text-transparent">
            developer growth
          </span>
        </h2>
        <p className="text-lg text-dt-textSecondary mb-10 max-w-2xl mx-auto font-medium">
          Join thousands of developers who are leveling up their coding journey with DevTrack
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <AnimatedButton onClick={() => navigate('/login')} variant="primary">
            Start Free Now
          </AnimatedButton>
          <AnimatedButton onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })} variant="secondary">
            View Demo
          </AnimatedButton>
        </div>
      </div>
    </SectionWrapper>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dt-bg">
      <NoiseOverlay />
      <Navbar />
      <Hero />
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