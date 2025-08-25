'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Upload,
  MessageSquare,
  BookOpen,
  ArrowRight,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAuthData } from '@/stores/authStore';

interface WelcomeScreenProps {
  isVisible: boolean;
  onComplete: () => void;
}

const WelcomeStep = ({
  step,
  title,
  description,
  icon: Icon,
  isActive,
  isCompleted,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ElementType;
  isActive: boolean;
  isCompleted: boolean;
}) => (
  <motion.div
    className={`flex items-start gap-4 p-6 rounded-xl transition-all duration-300 ${
      isActive
        ? 'bg-amber-50 border-2 border-amber-200 shadow-lg'
        : isCompleted
        ? 'bg-green-50 border border-green-200'
        : 'bg-gray-50 border border-gray-200'
    }`}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay: step * 0.1 }}>
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center ${
        isCompleted ? 'bg-green-500' : isActive ? 'bg-amber-500' : 'bg-gray-400'
      }`}>
      {isCompleted ? (
        <CheckCircle className='w-5 h-5 text-white' />
      ) : (
        <Icon className='w-5 h-5 text-white' />
      )}
    </div>
    <div className='flex-1'>
      <h3
        className={`font-medium mb-2 ${
          isActive
            ? 'text-amber-800'
            : isCompleted
            ? 'text-green-800'
            : 'text-gray-700'
        }`}>
        {title}
      </h3>
      <p
        className={`text-sm leading-relaxed ${
          isActive
            ? 'text-amber-700'
            : isCompleted
            ? 'text-green-700'
            : 'text-gray-600'
        }`}>
        {description}
      </p>
    </div>
  </motion.div>
);

export default function WelcomeScreen({
  isVisible,
  onComplete,
}: WelcomeScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const { completeOnboarding } = useAuthStore();
  const { displayName } = useAuthData();

  const steps = [
    {
      title: 'Welcome to PaperLM!',
      description:
        "Your AI-powered document analysis platform is ready. Let's get you started with a quick tour.",
      icon: Sparkles,
      action: () => setCurrentStep(1),
    },
    {
      title: 'Upload Your First Document',
      description:
        'Drag and drop PDFs, Word docs, or paste text directly. We support multiple formats and can extract text from images.',
      icon: Upload,
      action: () => setCurrentStep(2),
    },
    {
      title: 'Chat with Your Documents',
      description:
        "Ask questions in natural language and get precise answers with source citations. It's like having a conversation with your files.",
      icon: MessageSquare,
      action: () => setCurrentStep(3),
    },
    {
      title: 'Generate Smart Notes',
      description:
        'Let AI automatically generate summaries, insights, and notes from your documents. Build your knowledge base effortlessly.',
      icon: BookOpen,
      action: () => handleComplete(),
    },
  ];

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const success = await completeOnboarding();
      if (success) {
        onComplete();
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkip = async () => {
    await handleComplete();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleSkip();
          }
        }}>
        <motion.div
          className='bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className='p-6 border-b border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='text-2xl font-semibold text-gray-900'>
                  Welcome{displayName ? `, ${displayName}` : ''}!
                </h2>
                <p className='text-gray-600 mt-1'>
                  Let&apos;s get you started with PaperLM
                </p>
              </div>
              <button
                onClick={handleSkip}
                className='text-gray-400 hover:text-gray-600 transition-colors p-1'>
                <X className='w-6 h-6' />
              </button>
            </div>

            {/* Progress Bar */}
            <div className='mt-6'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm text-gray-600'>Progress</span>
                <span className='text-sm text-gray-600'>
                  {currentStep + 1}/{steps.length}
                </span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <motion.div
                  className='bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full'
                  initial={{ width: '0%' }}
                  animate={{
                    width: `${((currentStep + 1) / steps.length) * 100}%`,
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className='p-6'>
            <AnimatePresence mode='wait'>
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}>
                {currentStep === 0 && (
                  <div className='text-center py-8'>
                    <motion.div
                      className='w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6'
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}>
                      <Sparkles className='w-10 h-10 text-white' />
                    </motion.div>
                    <h3 className='text-2xl font-semibold text-gray-900 mb-4'>
                      Welcome to PaperLM!
                    </h3>
                    <p className='text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed'>
                      Your AI-powered document analysis platform is ready.
                      We&apos;ll guide you through the key features that will
                      transform how you work with documents.
                    </p>
                    <div className='grid grid-cols-2 gap-4 text-sm text-gray-600 max-w-md mx-auto'>
                      <div className='flex items-center gap-2'>
                        <CheckCircle className='w-4 h-4 text-green-500' />
                        <span>Upload documents</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <CheckCircle className='w-4 h-4 text-green-500' />
                        <span>AI-powered chat</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <CheckCircle className='w-4 h-4 text-green-500' />
                        <span>Smart insights</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <CheckCircle className='w-4 h-4 text-green-500' />
                        <span>Auto-generated notes</span>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep > 0 && (
                  <div className='space-y-4'>
                    {steps.slice(1).map((step, index) => (
                      <WelcomeStep
                        key={index + 1}
                        step={index + 1}
                        title={step.title}
                        description={step.description}
                        icon={step.icon}
                        isActive={index + 1 === currentStep}
                        isCompleted={index + 1 < currentStep}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className='p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl'>
            <div className='flex items-center justify-between'>
              <button
                onClick={handleSkip}
                className='text-gray-600 hover:text-gray-800 transition-colors text-sm'
                disabled={isCompleting}>
                Skip tour
              </button>

              <div className='flex gap-3'>
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className='px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors'
                    disabled={isCompleting}>
                    Back
                  </button>
                )}

                <button
                  onClick={() => {
                    if (currentStep < steps.length - 1) {
                      setCurrentStep(currentStep + 1);
                    } else {
                      handleComplete();
                    }
                  }}
                  disabled={isCompleting}
                  className='px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50'>
                  {isCompleting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className='w-4 h-4 border-2 border-white border-t-transparent rounded-full'
                    />
                  ) : currentStep === steps.length - 1 ? (
                    'Get Started'
                  ) : (
                    <>
                      Next
                      <ArrowRight className='w-4 h-4' />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
