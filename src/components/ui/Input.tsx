'use client';

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useEffect, useRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'outlined' | 'ghost';
  error?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'outlined' | 'ghost';
  error?: string;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', variant = 'default', error, ...props }, ref) => {
    const baseClasses = 'w-full transition-all duration-200 focus:ring-2 focus:outline-none disabled:opacity-50 cursor-text text-slate-800 bg-white placeholder-slate-400';
    
    const variants = {
      default: 'px-4 py-3 border border-slate-300 rounded-lg focus:ring-purple-300 focus:border-purple-500 shadow-sm',
      outlined: 'px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-purple-300 focus:border-purple-500 shadow-sm',
      ghost: 'px-3 py-2 bg-transparent border-0 border-b-2 border-slate-200 rounded-none focus:ring-0 focus:border-purple-500'
    };
    
    const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-300' : '';
    const classes = `${baseClasses} ${variants[variant]} ${errorClasses} ${className}`;

    return (
      <div>
        <input ref={ref} className={classes} {...props} />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className = '', 
    variant = 'default', 
    error, 
    autoResize = false,
    minRows = 1,
    maxRows = 5,
    onChange,
    value,
    ...props 
  }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = ref || internalRef;

    const baseClasses = 'w-full transition-all duration-200 ease-in-out focus:ring-2 focus:outline-none disabled:opacity-50 resize-none cursor-text text-slate-800 bg-white placeholder-slate-400';
    
    const variants = {
      default: 'px-4 py-3 border border-slate-300 rounded-lg focus:ring-purple-300 focus:border-purple-500 shadow-sm',
      outlined: 'px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-purple-300 focus:border-purple-500 shadow-sm',
      ghost: 'px-3 py-2 bg-transparent border-0 border-b-2 border-slate-200 rounded-none focus:ring-0 focus:border-purple-500'
    };
    
    const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-300' : '';
    const autoResizeClasses = autoResize ? 'overflow-y-auto scrollbar-thin' : '';
    const classes = `${baseClasses} ${variants[variant]} ${errorClasses} ${autoResizeClasses} ${className}`;

    const adjustHeight = () => {
      if (autoResize && textareaRef && 'current' in textareaRef && textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        
        const lineHeight = 20; // Approximate line height in pixels
        const padding = 24; // Approximate total padding
        const minHeight = (minRows * lineHeight) + padding;
        const maxHeight = (maxRows * lineHeight) + padding;
        
        const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
        textarea.style.height = newHeight + 'px';
      }
    };

    useEffect(() => {
      if (autoResize) {
        adjustHeight();
      }
    }, [value, autoResize]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        adjustHeight();
      }
      onChange?.(e);
    };

    const style = autoResize ? {
      lineHeight: '1.25rem',
      minHeight: `${(minRows * 20) + 24}px`
    } : undefined;

    return (
      <div>
        <textarea 
          ref={textareaRef}
          className={classes}
          style={style}
          rows={autoResize ? minRows : props.rows}
          onChange={handleChange}
          value={value}
          {...props} 
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
Textarea.displayName = 'Textarea';

export { Input, Textarea };