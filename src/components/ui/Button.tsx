'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    animated = true,
    loading = false,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
    
    const variants = {
      primary: 'bg-[#7bc478] hover:bg-[#6bb068] text-white hover:shadow-md focus:ring-green-300 shadow-sm',
      secondary: 'bg-green-50 text-green-800 hover:bg-green-100 focus:ring-green-300 border border-green-200/60',
      ghost: 'text-slate-600 hover:bg-green-50 hover:text-[#7bc478] focus:ring-green-300',
      outline: 'border border-green-300 bg-white text-[#7bc478] hover:bg-green-50 focus:ring-green-300'
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
    
    const ButtonComponent = animated ? motion.button : 'button';
    const animationProps = animated ? {
      whileTap: { scale: 0.98 },
      whileHover: { scale: 1.02 }
    } : {};

    return (
      <ButtonComponent
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...animationProps}
        {...props}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        ) : null}
        {children}
      </ButtonComponent>
    );
  }
);

Button.displayName = 'Button';

export default Button;