import React from 'react';
import { GlowCard } from './GlowCard';

interface FeatureCardProps {
  icon: string | React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay = 0 }) => {
  return (
    <GlowCard delay={delay}>
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C6CF2]/20 to-[#A78BFA]/20 flex items-center justify-center mb-4 text-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[#0F172A] mb-2 group-hover:text-[#7C6CF2] transition-colors">
        {title}
      </h3>
      <p className="text-sm text-[#64748B] leading-relaxed">
        {description}
      </p>
    </GlowCard>
  );
};
