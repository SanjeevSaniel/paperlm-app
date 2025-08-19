'use client';

import { TourProvider, useTour } from '@reactour/tour';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  FileText,
  MessageSquare,
  NotebookPen
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface TourStep {
  selector: string;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  actionBefore?: () => void;
  actionAfter?: () => void;
}

const tourSteps: TourStep[] = [
  {
    selector: '[data-tour="welcome"]',
    content: (
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}>
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
          className="mx-auto mb-4 w-12 h-12 bg-gradient-to-br from-purple-100 to-amber-100 rounded-xl flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-purple-600" />
        </motion.div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Welcome to PaperLM! ✨
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Let's take a quick tour to help you get the most out of your AI-powered document analysis platform.
        </p>
      </motion.div>
    ),
    position: 'bottom'
  },
  {
    selector: '[data-tour="sources-panel"]',
    content: (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Sources Panel</h3>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          Start here! Upload PDFs, documents, paste text, or add YouTube videos and websites. 
          Watch beautiful animations as your content gets processed.
        </p>
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700 font-medium">
            💡 Tip: Drag & drop files for the fastest upload experience!
          </p>
        </div>
      </motion.div>
    ),
    position: 'right'
  },
  {
    selector: '[data-tour="notebook-panel"]',
    content: (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <NotebookPen className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Smart Notebook</h3>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          AI automatically generates analysis cards for your documents. Create custom notes, 
          generate insights across multiple documents, and organize your research.
        </p>
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-700 font-medium">
            ✨ Watch for gradient animations when AI is analyzing your content!
          </p>
        </div>
      </motion.div>
    ),
    position: 'left'
  },
  {
    selector: '[data-tour="chat-panel"]',
    content: (
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">AI Chat</h3>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          Ask questions about your documents! Get intelligent responses with source citations. 
          The AI understands context across all your uploaded content.
        </p>
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <p className="text-xs text-green-700 font-medium">
            💬 Try: "Summarize the main points" or "Compare these documents"
          </p>
        </div>
      </motion.div>
    ),
    position: 'left'
  },
  {
    selector: '[data-tour="usage-indicator"]',
    content: (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Usage Tracking
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          Keep track of your AI queries here. Guest users get 10 free queries per session. 
          Sign up for unlimited access!
        </p>
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
          <p className="text-xs text-purple-700 font-medium">
            🔥 Pro tip: Sign in for unlimited queries and cloud sync!
          </p>
        </div>
      </motion.div>
    ),
    position: 'bottom'
  },
  {
    selector: '[data-tour="welcome"]',
    content: (
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            duration: 0.6,
            ease: [0.34, 1.56, 0.64, 1],
            delay: 0.2
          }}
          className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl flex items-center justify-center border-2 border-green-200">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, ease: 'linear' }}>
            ✨
          </motion.div>
        </motion.div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          You're All Set! 🎉
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          Start by uploading your first document in the Sources panel, then chat with your AI assistant!
        </p>
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
          <p className="text-xs text-gray-700 font-medium">
            💡 Need help anytime? Look for the tour button in the header to restart this guide.
          </p>
        </div>
      </motion.div>
    ),
    position: 'bottom'
  }
];

// Custom Tour Badge Component
function TourBadge({ 
  children, 
  badgeContent, 
  className = "",
  onClick 
}: { 
  children: React.ReactNode;
  badgeContent?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div 
      className={`relative ${className}`}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}>
      {children}
      {badgeContent && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.3,
            ease: [0.34, 1.56, 0.64, 1],
            delay: 0.5
          }}
          className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium shadow-lg">
          {badgeContent}
        </motion.div>
      )}
    </motion.div>
  );
}

// Tour Control Button
function TourButton() {
  const { setIsOpen } = useTour();
  const [hasSeenTour, setHasSeenTour] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('paperlm_tour_seen');
    setHasSeenTour(!!seen);
    
    // Auto-start tour for new users after a delay
    if (!seen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [setIsOpen]);

  const startTour = () => {
    setIsOpen(true);
    localStorage.setItem('paperlm_tour_seen', 'true');
    setHasSeenTour(true);
  };

  return (
    <TourBadge 
      badgeContent={!hasSeenTour ? "New!" : undefined}
      onClick={startTour}>
      <motion.button
        className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-purple-200/50 rounded-full hover:bg-purple-50 transition-all duration-200 text-sm font-medium text-gray-700"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Take a guided tour">
        <Play className="w-3 h-3" />
        <span className="hidden sm:inline">Tour</span>
      </motion.button>
    </TourBadge>
  );
}

// Custom Tour Content Component with animations
function CustomTourContent({ 
  currentStep, 
  totalSteps, 
  content, 
  setCurrentStep, 
  setIsOpen 
}: {
  currentStep: number;
  totalSteps: number;
  content: React.ReactNode;
  setCurrentStep: (step: number) => void;
  setIsOpen: (open: boolean) => void;
}) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  const handleNext = () => {
    if (isLast) {
      setIsOpen(false);
      localStorage.setItem('paperlm_tour_seen', 'true');
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    localStorage.setItem('paperlm_tour_seen', 'true');
  };

  return (
    <motion.div
      key={currentStep}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-xl shadow-xl border border-gray-200/50 p-6 max-w-sm backdrop-blur-sm">
      
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }, (_, i) => (
            <motion.div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                i === currentStep ? 'bg-purple-500' : 'bg-gray-200'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
            />
          ))}
        </div>
        <motion.button
          onClick={handleSkip}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}>
          <X className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}>
          {content}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <motion.button
          onClick={handlePrev}
          disabled={isFirst}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isFirst 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          whileHover={!isFirst ? { scale: 1.02 } : {}}
          whileTap={!isFirst ? { scale: 0.98 } : {}}>
          <ChevronLeft className="w-4 h-4" />
          Previous
        </motion.button>

        <span className="text-xs text-gray-500 px-3">
          {currentStep + 1} of {totalSteps}
        </span>

        <motion.button
          onClick={handleNext}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}>
          {isLast ? 'Finish' : 'Next'}
          {!isLast && <ChevronRight className="w-4 h-4" />}
        </motion.button>
      </div>
    </motion.div>
  );
}

// Main Tour Provider Component
export function GuidedTourProvider({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider
      steps={tourSteps}
      styles={{
        popover: (base) => ({
          ...base,
          '--reactour-accent': '#9333ea',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: 0,
          background: 'transparent',
          border: 'none',
        }),
        maskArea: (base) => ({
          ...base,
          rx: 8,
        }),
        badge: (base) => ({
          ...base,
          display: 'none', // We'll use our custom content
        }),
      }}
      components={{
        Content: CustomTourContent,
      }}
      showBadge={false}
      showCloseButton={false}
      showNavigation={false}
      showDots={false}
      disableDotsNavigation={true}
      padding={{ mask: 10, popover: [10, 10] }}
      onClickMask={({ setIsOpen }) => setIsOpen(false)}>
      {children}
    </TourProvider>
  );
}

export { TourButton, TourBadge };