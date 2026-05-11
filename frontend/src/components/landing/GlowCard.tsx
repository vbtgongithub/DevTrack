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
      className={`group relative p-6 rounded-3xl dt-card bg-dt-surface border border-dt-primary/10 transition-all duration-500 overflow-hidden shadow-sm ${
        hoverGlow ? 'hover:border-dt-primary/30 hover:shadow-dt-card-hover' : ''
      } ${className}`}
    >
      {/* Gradient overlay on hover */}
      {hoverGlow && (
        <div className="absolute inset-0 bg-gradient-to-br from-dt-primary/0 to-dt-secondary/0 group-hover:from-dt-primary/5 group-hover:to-dt-secondary/5 transition-all duration-500" />
      )}

      <div className="relative z-10">
        {children}
      </div>

      {/* Glow effect */}
      {hoverGlow && (
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-dt-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
    </motion.div>
  );
};
