// frontend/src/components/ui/Card.tsx — Premium Card Component
// Phase-G: Calm, elevated, premium card system

import { forwardRef, type HTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/design-system/tokens.css';

type CardVariant = 'default' | 'elevated' | 'outline' | 'glow';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'padding'> {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  selected?: boolean;
}

const variants = {
  default: 'bg-white border border-zinc-200 shadow-sm',
  elevated: 'bg-white border border-zinc-200 shadow-md',
  outline: 'bg-transparent border border-zinc-200',
  glow: 'bg-white border border-[#7C5CFF]/20 shadow-[0_0_20px_rgba(124,92,255,0.08)]',
};

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { variant = 'default', padding = 'md', interactive = false, selected = false, className, children, ...props },
    ref
  ) => {
    const interactiveClasses = interactive
      ? 'cursor-pointer hover:border-[#7C5CFF]/40 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5'
      : '';
    const selectedClasses = selected
      ? 'border-[#7C5CFF] bg-[#7C5CFF]/5 shadow-[0_4px_12px_rgba(124,92,255,0.1)]'
      : '';

    return (
      <motion.div
        ref={ref}
        initial={false}
        className={cn(
          'rounded-2xl backdrop-blur-sm',
          variants[variant],
          paddings[padding],
          interactiveClasses,
          selectedClasses,
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// Card Header
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> { }

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-between mb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

// Card Title
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ as: Tag = 'h3', className, children, ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn('text-lg font-bold text-[#0F172A] tracking-tight', className)}
      {...props}
    >
      {children}
    </Tag>
  )
);

CardTitle.displayName = 'CardTitle';

// Card Description
interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> { }

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm font-medium text-[#667085] mt-1', className)}
      {...props}
    >
      {children}
    </p>
  )
);

CardDescription.displayName = 'CardDescription';

// Card Content
interface CardContentProps extends HTMLAttributes<HTMLDivElement> { }

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

// Card Footer
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> { }

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center gap-3 mt-6 pt-4 border-t border-zinc-100', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

export default Card;