import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from './Icon';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  action?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'cube',
  action,
  className = '',
  size = 'md',
}) => {
  const isSm = size === 'sm';
  return (
    <div className={`flex flex-col items-center justify-center ${isSm ? 'py-8 px-4' : 'py-16 px-6'} text-center ${className}`}>
      <div className={`relative ${isSm ? 'mb-4' : 'mb-8'}`}>
        {/* Atmospheric Orbit Glows */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0 -m-8 bg-gradient-to-tr from-dt-primary/20 via-dt-secondary/10 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0 -m-12 bg-gradient-to-bl from-dt-lavender/15 via-dt-primary/5 to-transparent rounded-full blur-3xl"
        />

        {/* Animated Illustration Container */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`relative ${isSm ? 'w-14 h-14' : 'w-20 h-20'} dt-radius-xl bg-white shadow-dt-floating border border-dt-primary/10 flex items-center justify-center overflow-hidden group`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-dt-primary/5 to-transparent" />

          <motion.div
            animate={{
              y: [0, -4, 0],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative z-10"
          >
            <Icon name={icon} size={isSm ? 24 : 36} className="text-dt-primary drop-shadow-sm" />
          </motion.div>

          {/* Scanning Effect */}
          <motion.div
            animate={{ top: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-1/2 bg-gradient-to-b from-transparent via-dt-primary/10 to-transparent skew-y-12"
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <h3 className={`${isSm ? 'text-[15px] mb-1' : 'text-xl mb-2'} font-bold text-dt-text tracking-tight`}>{title}</h3>
        <p className={`${isSm ? 'text-[12px]' : 'text-[14px]'} text-dt-textSecondary max-w-sm mx-auto leading-relaxed`}>
          {description}
        </p>
      </motion.div>

      {action && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8"
        >
          {action}
        </motion.div>
      )}
    </div>
  );
};