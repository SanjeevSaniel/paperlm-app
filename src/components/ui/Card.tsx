'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  animated?: boolean;
  variant?: 'default' | 'elevated' | 'bordered';
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', animated = false, variant = 'default', children, ...props }, ref) => {
    const baseClasses = 'rounded-2xl overflow-hidden flex flex-col';
    
    const variants = {
      default: 'bg-white/90 backdrop-blur-sm shadow-lg border border-amber-200/50',
      elevated: 'bg-white/95 shadow-xl border border-amber-100/60',
      bordered: 'bg-white/90 border-2 border-amber-200/60'
    };
    
    const classes = `${baseClasses} ${variants[variant]} ${className}`;
    
    const CardComponent = animated ? motion.div : 'div';
    const animationProps = animated ? {
      initial: { opacity: 0, scale: 0.95, y: 20 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95, y: 20 },
      transition: { duration: 0.3 }
    } : {};

    return (
      <CardComponent ref={ref} className={classes} {...animationProps} {...props}>
        {children}
      </CardComponent>
    );
  }
);

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', title, description, icon, action, children, ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        className={`flex items-center justify-between p-4 border-b border-amber-100/80 bg-amber-50/30 ${className}`} 
        {...props}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-8 h-8 bg-gradient-to-br from-amber-100/80 to-orange-100/60 rounded-lg flex items-center justify-center border border-amber-200/60">
              {icon}
            </div>
          )}
          <div>
            {title && <h3 className="font-semibold text-slate-800 tracking-tight">{title}</h3>}
            {description && <p className="text-xs text-slate-500 font-medium">{description}</p>}
          </div>
        </div>
        {action}
        {children}
      </div>
    );
  }
);

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`flex-1 overflow-hidden ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`border-t border-gray-200 p-4 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };