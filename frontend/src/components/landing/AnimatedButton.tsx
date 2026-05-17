import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'glass';
  className?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-200";

  const variants = {
    primary: "px-8 py-4 text-white bg-gradient-to-r from-dt-primary to-dt-secondary shadow-lg shadow-dt-primary/30 bg-[length:200%_auto] hover:bg-[position:100%_0]",
    secondary: "px-8 py-4 text-dt-text bg-dt-surface border border-dt-primary/10 shadow-sm hover:shadow-dt-card-hover",
    glass: "px-5 py-2.5 text-sm text-white bg-gradient-to-r from-dt-primary to-dt-secondary shadow-lg shadow-dt-primary/30 bg-[length:200%_auto] hover:bg-[position:100%_0]"
  };

  const animations = {
    primary: { hover: { y: -3, boxShadow: '0 20px 40px rgba(124, 92, 252, 0.4)' }, tap: { scale: 0.98 } },
    secondary: { hover: { y: -2 }, tap: { scale: 0.98 } },
    glass: { hover: { y: -2, boxShadow: '0 12px 30px rgba(124, 92, 252, 0.35)' }, tap: { scale: 0.98 } }
  };

  return (
    <motion.button
      whileHover={animations[variant].hover}
      whileTap={animations[variant].tap}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};
