'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  MessageSquare,
  NotebookPen,
  Target,
} from 'lucide-react';
import { useState, useEffect, createContext, useContext } from 'react';
import React from 'react';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: React.ReactNode;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to PaperLM! ✨',
    content: 'Let\'s take a quick tour to help you get the most out of your AI-powered document analysis platform.',
    target: '[data-tour="welcome"]',
    position: 'bottom',
    icon: <Sparkles className='w-5 h-5 text-purple-600' />,
  },
  {
    id: 'sources',
    title: 'Sources Panel',
    content: 'Start here! Upload PDFs, documents, paste text, or add YouTube videos and websites. Drag & drop files for the fastest upload experience!',
    target: '[data-tour="sources-panel"]',
    position: 'right',
    icon: <FileText className='w-5 h-5 text-blue-600' />,
  },
  {
    id: 'notebook',
    title: 'Smart Notebook',
    content: 'AI automatically generates analysis cards for your documents. Create custom notes, generate insights, and organize your research. Watch for gradient animations when AI is analyzing your content!',
    target: '[data-tour="notebook-panel"]',
    position: 'left',
    icon: <NotebookPen className='w-5 h-5 text-amber-600' />,
  },
  {
    id: 'chat',
    title: 'AI Chat',
    content: 'Ask questions about your documents! Get intelligent responses with source citations. Try: "Summarize the main points" or "Compare these documents"',
    target: '[data-tour="chat-panel"]',
    position: 'left',
    icon: <MessageSquare className='w-5 h-5 text-green-600' />,
  },
  {
    id: 'account',
    title: 'User Account',
    content: 'Guest users get 10 free queries per session. Sign up for unlimited access and cloud sync!',
    target: '[data-tour="usage-indicator"], .cl-userButtonTrigger',
    position: 'bottom',
    icon: <Target className='w-5 h-5 text-purple-600' />,
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    content: 'Start by uploading your first document in the Sources panel, then chat with your AI assistant! Need help anytime? Look for the tour button in the header.',
    target: '[data-tour="welcome"]',
    position: 'bottom',
    icon: <div className='text-2xl'>🎉</div>,
  },
];

// Tour Context
interface TourContextType {
  isOpen: boolean;
  currentStep: number;
  startTour: () => void;
  closeTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
}

const TourContext = createContext<TourContextType | null>(null);

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within TourProvider');
  }
  return context;
}

// Tour Control Button
export function TourButton() {
  const { startTour } = useTour();
  const [hasSeenTour, setHasSeenTour] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem('paperlm_tour_seen');
      setHasSeenTour(!!seen);

      // Auto-start tour for new users after a delay
      if (!seen) {
        const timer = setTimeout(() => {
          startTour();
        }, 3000);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.warn('Tour initialization error:', error);
    }
  }, [startTour]);

  return (
    <div className='relative'>
      <motion.button
        onClick={startTour}
        className='flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-purple-200/50 rounded-full hover:bg-purple-50 transition-all duration-200 text-sm font-medium text-gray-700'
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title='Take a guided tour'>
        <Play className='w-3 h-3' />
        <span className='hidden sm:inline'>Tour</span>
      </motion.button>
      {!hasSeenTour && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className='absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium shadow-lg'>
          New!
        </motion.div>
      )}
    </div>
  );
}

// Helper function to calculate optimal position
function calculatePopoverPosition(
  targetRect: DOMRect,
  popoverWidth: number,
  popoverHeight: number,
  preferredPosition: string
) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padding = 20;
  
  // Remove unused variables - positioning is handled differently now
  
  // Calculate positions for each side
  const positions = {
    top: {
      left: targetRect.left + targetRect.width / 2 - popoverWidth / 2,
      top: targetRect.top - popoverHeight - padding,
    },
    bottom: {
      left: targetRect.left + targetRect.width / 2 - popoverWidth / 2,
      top: targetRect.bottom + padding,
    },
    left: {
      left: targetRect.left - popoverWidth - padding,
      top: targetRect.top + targetRect.height / 2 - popoverHeight / 2,
    },
    right: {
      left: targetRect.right + padding,
      top: targetRect.top + targetRect.height / 2 - popoverHeight / 2,
    },
    center: {
      left: viewportWidth / 2 - popoverWidth / 2,
      top: viewportHeight / 2 - popoverHeight / 2,
    },
  };
  
  // Try preferred position first
  const preferred = positions[preferredPosition as keyof typeof positions];
  if (preferred &&
      preferred.left >= padding &&
      preferred.left + popoverWidth <= viewportWidth - padding &&
      preferred.top >= padding &&
      preferred.top + popoverHeight <= viewportHeight - padding) {
    return { ...preferred, position: preferredPosition };
  }
  
  // Try other positions if preferred doesn't fit
  const fallbackOrder = ['bottom', 'top', 'right', 'left', 'center'];
  for (const pos of fallbackOrder) {
    if (pos === preferredPosition) continue;
    const candidate = positions[pos as keyof typeof positions];
    if (candidate &&
        candidate.left >= padding &&
        candidate.left + popoverWidth <= viewportWidth - padding &&
        candidate.top >= padding &&
        candidate.top + popoverHeight <= viewportHeight - padding) {
      return { ...candidate, position: pos };
    }
  }
  
  // Fallback to center if nothing fits
  return { ...positions.center, position: 'center' };
}

// Tour Overlay Component
function TourOverlay() {
  const { isOpen, currentStep, closeTour, nextStep, prevStep } = useTour();
  // targetElement state removed as it's not being used
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ left: 0, top: 0, position: 'center' });
  const [popoverRef, setPopoverRef] = useState<HTMLDivElement | null>(null);

  const currentStepData = tourSteps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === tourSteps.length - 1;

  // Find and highlight target element
  useEffect(() => {
    if (isOpen && currentStepData) {
      const findElement = () => {
        const element = document.querySelector(currentStepData.target);
        if (element) {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
          
          // Scroll element into view with some offset
          const elementTop = rect.top + window.pageYOffset;
          const elementCenter = elementTop - window.innerHeight / 2 + rect.height / 2;
          window.scrollTo({
            top: Math.max(0, elementCenter),
            behavior: 'smooth'
          });
          
          return true;
        }
        return false;
      };
      
      // Try to find element immediately
      if (!findElement()) {
        // If not found, try again after a short delay
        const timeout = setTimeout(findElement, 100);
        return () => clearTimeout(timeout);
      }
    }
  }, [isOpen, currentStep, currentStepData]);
  
  // Calculate popover position when target rect or popover ref changes
  useEffect(() => {
    if (targetRect && popoverRef && currentStepData) {
      const popoverRect = popoverRef.getBoundingClientRect();
      const newPosition = calculatePopoverPosition(
        targetRect,
        popoverRect.width || 320, // fallback width
        popoverRect.height || 400, // fallback height
        currentStepData.position
      );
      setPopoverPosition(newPosition);
    }
  }, [targetRect, popoverRef, currentStepData]);

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('paperlm_tour_seen', 'true');
      closeTour();
    } else {
      nextStep();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('paperlm_tour_seen', 'true');
    closeTour();
  };

  if (!isOpen || !currentStepData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-[9999]'
        onClick={handleSkip}>
        
        {/* Backdrop overlay with cutout */}
        {targetRect && (
          <div className='absolute inset-0'>
            {/* Top overlay */}
            <div 
              className='absolute bg-black/40 backdrop-blur-sm'
              style={{
                left: 0,
                top: 0,
                right: 0,
                height: Math.max(0, targetRect.top - 12)
              }}
            />
            {/* Bottom overlay */}
            <div 
              className='absolute bg-black/40 backdrop-blur-sm'
              style={{
                left: 0,
                top: targetRect.bottom + 12,
                right: 0,
                bottom: 0
              }}
            />
            {/* Left overlay */}
            <div 
              className='absolute bg-black/40 backdrop-blur-sm'
              style={{
                left: 0,
                top: Math.max(0, targetRect.top - 12),
                width: Math.max(0, targetRect.left - 12),
                height: targetRect.height + 24
              }}
            />
            {/* Right overlay */}
            <div 
              className='absolute bg-black/40 backdrop-blur-sm'
              style={{
                left: targetRect.right + 12,
                top: Math.max(0, targetRect.top - 12),
                right: 0,
                height: targetRect.height + 24
              }}
            />
            
            {/* Target frame - transparent with visible border */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className='absolute rounded-xl border-4 border-purple-400 bg-transparent shadow-2xl'
              style={{
                left: targetRect.left - 12,
                top: targetRect.top - 12,
                width: targetRect.width + 24,
                height: targetRect.height + 24,
                boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.9), 0 0 40px rgba(147, 51, 234, 0.5), inset 0 0 0 2px rgba(147, 51, 234, 0.3)',
              }}
            />
          </div>
        )}
          
        {/* Semi-circular Arrow pointing to target */}
        {targetRect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
              }}
              className='absolute z-[10001]'
              style={{
                // Position arrows to be visible and point at the frame border
                left: popoverPosition.position === 'bottom' ? Math.max(20, Math.min(window.innerWidth - 100, targetRect.left + targetRect.width / 2 - 40)) : 
                     popoverPosition.position === 'top' ? Math.max(20, Math.min(window.innerWidth - 100, targetRect.left + targetRect.width / 2 - 40)) :
                     popoverPosition.position === 'left' ? Math.min(window.innerWidth - 100, targetRect.right + 20) :
                     popoverPosition.position === 'right' ? Math.max(20, targetRect.left - 100) :
                     Math.max(20, Math.min(window.innerWidth - 100, targetRect.left + targetRect.width / 2 - 40)),
                top: popoverPosition.position === 'bottom' ? Math.max(20, targetRect.top - 90) :
                     popoverPosition.position === 'top' ? Math.min(window.innerHeight - 100, targetRect.bottom + 20) :
                     popoverPosition.position === 'left' ? Math.max(20, Math.min(window.innerHeight - 100, targetRect.top + targetRect.height / 2 - 40)) :
                     popoverPosition.position === 'right' ? Math.max(20, Math.min(window.innerHeight - 100, targetRect.top + targetRect.height / 2 - 40)) :
                     Math.max(20, targetRect.top - 90),
              }}>
              
              {/* Realistic curved arrow SVG */}
              <motion.svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                className="drop-shadow-xl">
                
                {/* Glowing background */}
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgb(168, 85, 247)" />
                    <stop offset="100%" stopColor="rgb(147, 51, 234)" />
                  </linearGradient>
                </defs>
                
                {/* Semi-circular curved arrows based on position */}
                {popoverPosition.position === 'bottom' && (
                  <g>
                    <motion.path
                      d="M25 10 Q40 0, 55 10 Q50 20, 40 65"
                      stroke="url(#arrowGrad)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      fill="none"
                      filter="url(#glow)"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ 
                        pathLength: 1, 
                        opacity: 1,
                      }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                    />
                    <motion.polygon
                      points="40,65 35,55 40,50 45,55"
                      fill="url(#arrowGrad)"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.4 }}
                    />
                  </g>
                )}
                
                {popoverPosition.position === 'top' && (
                  <g>
                    <motion.path
                      d="M25 70 Q40 80, 55 70 Q50 60, 40 15"
                      stroke="url(#arrowGrad)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      fill="none"
                      filter="url(#glow)"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ 
                        pathLength: 1, 
                        opacity: 1,
                      }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                    />
                    <motion.polygon
                      points="40,15 35,25 40,30 45,25"
                      fill="url(#arrowGrad)"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.4 }}
                    />
                  </g>
                )}
                
                {popoverPosition.position === 'left' && (
                  <g>
                    <motion.path
                      d="M65 25 Q75 40, 65 55 Q55 50, 15 40"
                      stroke="url(#arrowGrad)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      fill="none"
                      filter="url(#glow)"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ 
                        pathLength: 1, 
                        opacity: 1,
                      }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                    />
                    <motion.polygon
                      points="15,40 25,35 30,40 25,45"
                      fill="url(#arrowGrad)"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.4 }}
                    />
                  </g>
                )}
                
                {popoverPosition.position === 'right' && (
                  <g>
                    <motion.path
                      d="M15 25 Q5 40, 15 55 Q25 50, 65 40"
                      stroke="url(#arrowGrad)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      fill="none"
                      filter="url(#glow)"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ 
                        pathLength: 1, 
                        opacity: 1,
                      }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                    />
                    <motion.polygon
                      points="65,40 55,35 50,40 55,45"
                      fill="url(#arrowGrad)"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.4 }}
                    />
                  </g>
                )}
                
                {/* Animated pulsing dot at curve start */}
                <motion.circle
                  cx={popoverPosition.position === 'bottom' ? 25 : 
                      popoverPosition.position === 'top' ? 25 :
                      popoverPosition.position === 'left' ? 65 : 15}
                  cy={popoverPosition.position === 'bottom' ? 10 : 
                      popoverPosition.position === 'top' ? 70 :
                      popoverPosition.position === 'left' ? 25 : 25}
                  r="4"
                  fill="url(#arrowGrad)"
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: [1, 1.4, 1],
                    opacity: [0.9, 0.5, 0.9]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.svg>
              
              {/* Floating step indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-xl border-3 border-white">
                {currentStep + 1}
              </motion.div>
            </motion.div>
          )}

        {/* Tour popover */}
        <motion.div
          ref={setPopoverRef}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            x: popoverPosition.left,
            y: popoverPosition.top
          }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className='absolute bg-white rounded-2xl shadow-2xl border border-gray-200/50 p-6 w-80 backdrop-blur-xl'
          style={{
            left: 0,
            top: 0,
            maxWidth: 'calc(100vw - 40px)',
            zIndex: 10000,
          }}>
          
          {/* Subtle pointer dot */}
          {targetRect && popoverPosition.position !== 'center' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className='absolute w-2 h-2 bg-purple-500 rounded-full shadow-sm'
              style={{
                left: popoverPosition.position === 'left' ? '100%' :
                      popoverPosition.position === 'right' ? '-4px' :
                      '50%',
                top: popoverPosition.position === 'top' ? '100%' :
                     popoverPosition.position === 'bottom' ? '-4px' :
                     '50%',
                transform: popoverPosition.position === 'left' || popoverPosition.position === 'right' ?
                          'translateY(-50%)' :
                          'translateX(-50%)',
                marginLeft: popoverPosition.position === 'left' ? '-4px' : '0',
                marginTop: popoverPosition.position === 'top' ? '-4px' : '0',
              }}
            />
          )}
          
          {/* Header */}
          <div className='flex items-start justify-between mb-4'>
            <div className='flex items-center gap-3 flex-1'>
              <div className='w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center border border-purple-200/50 shadow-sm'>
                {currentStepData.icon}
              </div>
              <div className='flex-1 min-w-0'>
                <h3 className='font-semibold text-gray-900 text-lg leading-tight mb-1'>
                  {currentStepData.title}
                </h3>
                <span className='text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-full'>
                  Step {currentStep + 1} of {tourSteps.length}
                </span>
              </div>
            </div>
            <motion.button
              onClick={handleSkip}
              className='text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 ml-2'
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}>
              <X className='w-5 h-5' />
            </motion.button>
          </div>

          {/* Content */}
          <div className='mb-6'>
            <p className='text-sm text-gray-600 leading-relaxed'>
              {currentStepData.content}
            </p>
          </div>

          {/* Progress bar */}
          <div className='mb-6'>
            <div className='flex justify-between items-center mb-2'>
              <span className='text-xs text-gray-500'>Progress</span>
              <span className='text-xs text-gray-500'>
                {Math.round(((currentStep + 1) / tourSteps.length) * 100)}%
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <motion.div
                className='bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full'
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className='flex justify-between items-center'>
            <motion.button
              onClick={prevStep}
              disabled={isFirst}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl transition-all duration-200 ${
                isFirst 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              whileHover={!isFirst ? { scale: 1.02 } : {}}
              whileTap={!isFirst ? { scale: 0.98 } : {}}>
              <ChevronLeft className='w-4 h-4' />
              Previous
            </motion.button>
            
            <motion.button
              onClick={handleNext}
              className='flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-sm rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl'
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}>
              {isLast ? (
                <>
                  Finish Tour
                  <Sparkles className='w-4 h-4' />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className='w-4 h-4' />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Main Tour Provider Component
export function GuidedTourProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const startTour = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  const closeTour = () => {
    setIsOpen(false);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < tourSteps.length) {
      setCurrentStep(step);
    }
  };

  const value: TourContextType = {
    isOpen,
    currentStep,
    startTour,
    closeTour,
    nextStep,
    prevStep,
    goToStep,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
      <TourOverlay />
    </TourContext.Provider>
  );
}
