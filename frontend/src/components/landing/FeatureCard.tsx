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
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dt-primary/10 to-dt-secondary/10 border border-dt-primary/10 flex items-center justify-center mb-4 text-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-dt-text mb-2 group-hover:text-dt-primary transition-colors tracking-tight">
        {title}
      </h3>
      <p className="text-sm font-medium text-dt-textSecondary leading-relaxed">
        {description}
      </p>
    </GlowCard>
  );
};
