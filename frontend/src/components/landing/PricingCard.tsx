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
      className={`relative p-6 rounded-3xl border transition-all duration-300 ${
        popular
          ? 'bg-white border-[#7C6CF2]/40 shadow-2xl shadow-[#7C6CF2]/10 scale-105'
          : 'bg-[#FAFAF8] border-[rgba(15,23,42,0.06)] hover:border-[rgba(15,23,42,0.1)]'
      }`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-[#7C6CF2] to-[#A78BFA] rounded-full text-xs font-semibold text-white shadow-lg shadow-purple-500/30">
          Most Popular
        </div>
      )}

      <div className="text-lg font-semibold text-[#0F172A] mb-2">{name}</div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-4xl font-bold text-[#0F172A]">{price}</span>
        {period && <span className="text-sm text-[#64748B]">{period}</span>}
      </div>
      <p className="text-sm text-[#64748B] mb-6">{description}</p>

      <ul className="space-y-3 mb-8">
        {features.map((feature, j) => (
          <li key={j} className="flex items-center gap-2 text-sm text-[#64748B]">
            <svg className="w-4 h-4 text-[#7C6CF2] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      <motion.button
        onClick={onCtaClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
          popular
            ? 'bg-gradient-to-r from-[#7C6CF2] to-[#A78BFA] text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30'
            : 'bg-white text-[#0F172A] hover:bg-[#F1EFEA] border border-[rgba(15,23,42,0.06)] shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
        }`}
      >
        {cta}
      </motion.button>
    </motion.div>
  );
};
