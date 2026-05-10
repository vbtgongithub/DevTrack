import React from 'react';
import { motion } from 'framer-motion';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hoverGlow?: boolean;
}

export const GlowCard: React.FC<GlowCardProps> = ({ 
  children, 
  className = '', 
  delay = 0,
  hoverGlow = true 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className={`group relative p-6 rounded-3xl bg-white border border-[rgba(15,23,42,0.06)] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-500 overflow-hidden ${
        hoverGlow ? 'hover:border-[#7C6CF2]/30 hover:bg-[#FAFAF8] hover:shadow-[0_12px_24px_rgba(124,108,242,0.15)]' : ''
      } ${className}`}
    >
      {/* Gradient overlay on hover */}
      {hoverGlow && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#7C6CF2]/0 to-[#A78BFA]/0 group-hover:from-[#7C6CF2]/5 group-hover:to-[#A78BFA]/5 transition-all duration-500" />
      )}

      <div className="relative z-10">
        {children}
      </div>

      {/* Glow effect */}
      {hoverGlow && (
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#7C6CF2]/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
    </motion.div>
  );
};
