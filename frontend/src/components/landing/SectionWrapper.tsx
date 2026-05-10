import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface SectionWrapperProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  bgConfig?: {
    color?: string;
    hasGlow?: boolean;
    glowPositions?: ('top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center')[];
  };
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({ 
  id, 
  className = '', 
  children,
  bgConfig = { color: 'bg-[#F7F6F3]', hasGlow: false, glowPositions: [] }
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <section id={id} ref={ref} className={`relative py-32 overflow-hidden ${bgConfig.color} ${className}`}>
      {bgConfig.hasGlow && (
        <div className="absolute inset-0 pointer-events-none">
          {bgConfig.glowPositions?.includes('top-left') && (
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#7C6CF2]/5 rounded-full blur-[120px]" />
          )}
          {bgConfig.glowPositions?.includes('top-right') && (
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#A78BFA]/5 rounded-full blur-[120px]" />
          )}
          {bgConfig.glowPositions?.includes('bottom-left') && (
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#7C6CF2]/5 rounded-full blur-[100px]" />
          )}
          {bgConfig.glowPositions?.includes('bottom-right') && (
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#A78BFA]/5 rounded-full blur-[120px]" />
          )}
          {bgConfig.glowPositions?.includes('center') && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#7C6CF2]/10 rounded-full blur-[120px]" />
          )}
        </div>
      )}
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
};
