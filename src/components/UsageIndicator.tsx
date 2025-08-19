'use client';

import { motion } from 'framer-motion';
import { Zap, Crown } from 'lucide-react';
import { useFreemium } from '@/contexts/FreemiumContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export default function UsageIndicator() {
  const { usage, limits, isAuthenticated } = useFreemium();

  // Don't show for authenticated users
  if (isAuthenticated) {
    return null;
  }

  const totalProgress = (usage.total / limits.total) * 100;

  const getIndicatorColor = () => {
    if (totalProgress < 60) return 'text-emerald-500';
    if (totalProgress < 80) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getBgColor = () => {
    if (totalProgress < 60) return 'bg-emerald-500/10 border-emerald-200/50';
    if (totalProgress < 80) return 'bg-amber-500/10 border-amber-200/50';
    return 'bg-rose-500/10 border-rose-200/50';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'relative flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-200',
              getBgColor(),
              'hover:shadow-md',
            )}>
            <Zap className={cn('w-4 h-4', getIndicatorColor())} />

            {/* Progress ring */}
            <svg
              className='absolute inset-0 w-8 h-8 -rotate-90'
              viewBox='0 0 32 32'>
              <circle
                cx='16'
                cy='16'
                r='14'
                stroke='currentColor'
                strokeWidth='2'
                fill='none'
                className='text-slate-200'
              />
              <motion.circle
                cx='16'
                cy='16'
                r='14'
                stroke='currentColor'
                strokeWidth='2'
                fill='none'
                strokeLinecap='round'
                className={getIndicatorColor()}
                initial={{ strokeDasharray: '0 88' }}
                animate={{
                  strokeDasharray: `${(totalProgress / 100) * 88} 88`,
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>

            {/* Warning indicator when usage is high */}
            {totalProgress > 80 && (
              <motion.div
                className='absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full'
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.button>
        </TooltipTrigger>

        <TooltipContent
          side='bottom'
          sideOffset={10}
          className='w-72 p-4 bg-white/95 backdrop-blur-sm border border-purple-100/50 shadow-xl'
          avoidCollisions={true}
          collisionPadding={10}>
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <Crown className='w-4 h-4 text-purple-600' />
              <span className='font-semibold text-slate-800'>
                Free Trial Usage
              </span>
            </div>

            <div className='space-y-2'>
              {/* Uploads */}
              <div className='flex items-center justify-between text-sm'>
                <span className='text-slate-600'>Uploads</span>
                <span className='font-medium'>
                  {usage.uploads}/{limits.uploads}
                </span>
              </div>
              <div className='w-full bg-slate-200 rounded-full h-1.5'>
                <motion.div
                  className='h-1.5 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full'
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(usage.uploads / limits.uploads) * 100}%`,
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>

              {/* Queries */}
              <div className='flex items-center justify-between text-sm'>
                <span className='text-slate-600'>Queries</span>
                <span className='font-medium'>
                  {usage.queries}/{limits.queries}
                </span>
              </div>
              <div className='w-full bg-slate-200 rounded-full h-1.5'>
                <motion.div
                  className='h-1.5 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full'
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(usage.queries / limits.queries) * 100}%`,
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                />
              </div>

              {/* Total */}
              <div className='pt-2 border-t border-slate-200'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='font-medium text-slate-700'>
                    Total Usage
                  </span>
                  <span className='font-bold'>
                    {usage.total}/{limits.total}
                  </span>
                </div>
                <div className='w-full bg-slate-200 rounded-full h-2 mt-1'>
                  <motion.div
                    className={cn(
                      'h-2 rounded-full',
                      totalProgress < 60
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                        : totalProgress < 80
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                        : 'bg-gradient-to-r from-rose-400 to-rose-500',
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${totalProgress}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                  />
                </div>
              </div>
            </div>

            {totalProgress > 80 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200/50 rounded-lg p-2 mt-3'>
                <p className='text-xs text-amber-700 font-medium text-center'>
                  Almost at your limit! Sign up to continue.
                </p>
              </motion.div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
