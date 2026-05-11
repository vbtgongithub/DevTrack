import React from 'react';
import { motion } from 'framer-motion';

export interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  delay?: number;
  onCtaClick?: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  name,
  price,
  period,
  description,
  features,
  cta,
  popular = false,
  delay = 0,
  onCtaClick
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      whileHover={{ y: -8 }}
      className={`relative p-6 rounded-3xl border transition-all duration-300 dt-card ${
        popular
          ? 'bg-dt-surface border-dt-primary/40 shadow-dt-glow shadow-dt-primary/20 scale-105 z-10'
          : 'bg-dt-elevated border-dt-primary/10 hover:border-dt-primary/20 shadow-sm hover:shadow-dt-card-hover'
      }`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-dt-primary to-dt-secondary rounded-full text-[11px] uppercase tracking-wider font-bold text-white shadow-lg shadow-purple-500/30">
          Most Popular
        </div>
      )}

      <div className="text-[17px] font-bold text-dt-text tracking-tight mb-2">{name}</div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-4xl font-extrabold text-dt-text tracking-tight">{price}</span>
        {period && <span className="text-[13px] font-semibold text-dt-textSecondary">{period}</span>}
      </div>
      <p className="text-[14px] font-medium text-dt-textSecondary mb-6">{description}</p>

      <ul className="space-y-3 mb-8">
        {features.map((feature, j) => (
          <li key={j} className="flex items-center gap-2 text-[14px] font-medium text-dt-textSecondary">
            <svg className="w-4 h-4 text-dt-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      <motion.button
        onClick={onCtaClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
          popular
            ? 'bg-gradient-to-r from-dt-primary to-dt-secondary text-white shadow-lg shadow-dt-primary/20 hover:shadow-dt-primary/30'
            : 'bg-dt-surface text-dt-text hover:bg-dt-bg border border-dt-primary/10 shadow-sm'
        }`}
      >
        {cta}
      </motion.button>
    </motion.div>
  );
};
