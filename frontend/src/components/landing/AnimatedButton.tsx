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
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200";
  
  const variants = {
    primary: "px-8 py-4 text-white bg-gradient-to-r from-[#7C6CF2] via-[#7C3AED] to-[#A78BFA] shadow-xl shadow-purple-500/20 bg-[length:200%_auto] hover:bg-[position:100%_0]",
    secondary: "px-8 py-4 text-[#0F172A] bg-white border border-[rgba(15,23,42,0.06)] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]",
    glass: "px-5 py-2.5 text-sm text-white bg-gradient-to-r from-[#7C6CF2] via-[#7C3AED] to-[#A78BFA] shadow-lg shadow-purple-500/20 bg-[length:200%_auto] hover:bg-[position:100%_0]"
  };

  const animations = {
    primary: { hover: { y: -3, boxShadow: '0 25px 60px rgba(139, 92, 246, 0.45)' }, tap: { scale: 0.98 } },
    secondary: { hover: { y: -2 }, tap: { scale: 0.98 } },
    glass: { hover: { y: -2, boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4)' }, tap: { scale: 0.98 } }
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
