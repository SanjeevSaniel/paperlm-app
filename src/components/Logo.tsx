'use client';

import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  animated?: boolean;
}

export default function Logo({ size = 'md', showText = true, className = '', animated = false }: LogoProps) {
  const sizes = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-lg' },
    md: { container: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-xl' },
    lg: { container: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-2xl' }
  };

  const LogoContainer = animated ? motion.div : 'div';
  const containerProps = animated ? {
    whileHover: { scale: 1.05, rotate: 2 },
    transition: { duration: 0.2 }
  } : {};

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* NotebookLM-Inspired Logo Icon */}
      <LogoContainer 
        className={`${sizes[size].container} relative ${animated ? 'cursor-pointer' : ''}`}
        {...containerProps}
      >
        {/* Main logo container - clean document design */}
        <div className="relative w-full h-full bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200/60">
          {/* NotebookLM-style document with lines */}
          <div className="relative w-full h-full p-1.5 flex flex-col justify-center">
            {/* Document header area */}
            <div className="flex items-center justify-between mb-1">
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
              <div className="flex gap-0.5">
                <div className="w-0.5 h-0.5 bg-gray-300 rounded-full"></div>
                <div className="w-0.5 h-0.5 bg-gray-300 rounded-full"></div>
                <div className="w-0.5 h-0.5 bg-gray-300 rounded-full"></div>
              </div>
            </div>
            
            {/* Document content lines - inspired by NotebookLM */}
            <div className="space-y-0.5">
              <div className="w-full h-0.5 bg-gray-200 rounded-full"></div>
              <div className="w-4/5 h-0.5 bg-gray-300 rounded-full"></div>
              <div className="w-full h-0.5 bg-blue-500 rounded-full"></div>
              <div className="w-3/5 h-0.5 bg-gray-200 rounded-full"></div>
            </div>
            
            {/* Bottom accent */}
            <div className="mt-1 flex justify-end">
              <div className="w-2 h-0.5 bg-orange-400 rounded-full"></div>
            </div>
          </div>
          
          {/* Subtle shadow overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-100/20 rounded-lg pointer-events-none"></div>
        </div>
      </LogoContainer>

      {/* Modern Professional Logo Text */}
      {showText && (
        <div className="flex items-center">
          <div className="flex items-baseline">
            <span className={`font-semibold tracking-tight text-gray-900 ${sizes[size].text}`}>
              Paper
            </span>
            <span className={`font-semibold tracking-tight text-orange-500 ${sizes[size].text} ml-0.5`}>
              LM
            </span>
          </div>
          {/* Professional accent dot */}
          <div className="w-1 h-1 bg-orange-400 rounded-full ml-1 mt-1 opacity-60"></div>
        </div>
      )}
    </div>
  );
}