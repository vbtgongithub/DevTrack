// frontend/src/components/ui/Button.tsx — Premium Button Component
// Phase-G: Calm, premium, accessible button system

import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/design-system/tokens.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  subtle?: boolean;
}

const variants = {
  primary: {
    base: 'bg-[#7C5CFF] hover:bg-[#6D4DFF] text-white shadow-[0_4px_12px_rgba(124,92,255,0.25)]',
    active: 'active:bg-[#5B3DF5] active:shadow-sm',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
  },
  secondary: {
    base: 'bg-white hover:bg-zinc-50 text-[#0F172A] border border-zinc-200 shadow-sm',
    active: 'active:bg-zinc-100',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
  },
  ghost: {
    base: 'bg-transparent hover:bg-zinc-100/80 text-[#667085] hover:text-[#0F172A]',
    active: 'active:bg-zinc-200/50',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
  },
  danger: {
    base: 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200',
    active: 'active:bg-rose-200',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
  },
  success: {
    base: 'bg-[#12B76A]/10 hover:bg-[#12B76A]/20 text-[#12B76A] border border-[#12B76A]/20',
    active: 'active:bg-[#12B76A]/30',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
  },
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      subtle = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyles = variants[variant];
    const sizeStyles = sizes[size];

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: subtle ? 1 : 1.01 }}
        whileTap={{ scale: subtle ? 1 : 0.98 }}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-xl',
          'transition-all duration-300 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]/50 focus:ring-offset-2 focus:ring-offset-white',
          'disabled:pointer-events-none',
          variantStyles.base,
          variantStyles.active,
          variantStyles.disabled,
          sizeStyles,
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <motion.span
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="flex-shrink-0">{icon}</span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span className="flex-shrink-0">{icon}</span>
            )}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;