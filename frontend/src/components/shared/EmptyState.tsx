import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from './Icon';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'cube',
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-20 px-6 text-center ${className}`}>
      <div className="relative mb-10">
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
          className="relative w-24 h-24 rounded-3xl bg-white shadow-dt-floating border border-dt-primary/10 flex items-center justify-center overflow-hidden group"
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
            <Icon name={icon} size={40} className="text-dt-primary drop-shadow-sm" />
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
        <h3 className="text-2xl font-black text-dt-text tracking-tighter mb-3">{title}</h3>
        <p className="text-[15px] text-dt-textSecondary max-w-sm mx-auto leading-relaxed font-medium opacity-80">
          {description}
        </p>
      </motion.div>

      {action && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-10"
        >
          {action}
        </motion.div>
      )}
    </div>
  );
};
