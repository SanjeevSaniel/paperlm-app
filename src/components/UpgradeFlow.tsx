'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Check, X, Zap, FileText, MessageSquare, Shield, Star } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserLimits, hasProAccess } from '@/lib/userIdGenerator';

interface UpgradeFlowProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUsage?: {
    documentsUploaded: number;
    chatMessagesUsed: number;
  };
  trigger?: 'limit_reached' | 'manual' | 'feature_lock';
}

export default function UpgradeFlow({ 
  userId, 
  isOpen, 
  onClose, 
  currentUsage,
  trigger = 'manual'
}: UpgradeFlowProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  
  const currentLimits = getUserLimits(userId);
  const isAlreadyPro = hasProAccess(userId);

  if (isAlreadyPro) {
    return null; // Don't show upgrade flow for pro users
  }

  const features = [
    {
      icon: FileText,
      title: 'Unlimited Documents',
      description: 'Upload and analyze as many documents as you need',
      free: currentLimits.maxDocuments === -1 ? 'Unlimited' : `${currentLimits.maxDocuments} documents`,
      pro: 'Unlimited',
    },
    {
      icon: MessageSquare,
      title: 'Unlimited Chat Messages',
      description: 'Have endless conversations with your documents',
      free: currentLimits.maxChatMessages === -1 ? 'Unlimited' : `${currentLimits.maxChatMessages} messages`,
      pro: 'Unlimited',
    },
    {
      icon: Zap,
      title: 'Priority Processing',
      description: 'Faster document processing and AI responses',
      free: 'Standard speed',
      pro: 'Lightning fast',
    },
    {
      icon: Shield,
      title: 'Advanced Security',
      description: 'Enhanced data protection and privacy controls',
      free: 'Basic security',
      pro: 'Enterprise grade',
    },
    {
      icon: Star,
      title: 'Premium Support',
      description: 'Direct access to our support team',
      free: 'Community support',
      pro: 'Priority support',
    },
  ];

  const handleUpgrade = async () => {
    setIsProcessing(true);
    try {
      // Redirect to subscription page with user context
      router.push(`/subscription?userId=${userId}&upgrade=true`);
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getTriggerMessage = () => {
    switch (trigger) {
      case 'limit_reached':
        return 'You\'ve reached your usage limit. Upgrade to continue!';
      case 'feature_lock':
        return 'This feature requires a Pro subscription.';
      default:
        return 'Unlock the full potential of PaperLM';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}>
          <motion.div
            className='bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl'
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className='relative p-8 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-t-2xl'>
              <button
                onClick={onClose}
                className='absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors'>
                <X className='w-5 h-5' />
              </button>

              <div className='text-center'>
                <motion.div
                  className='inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4'
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}>
                  <Crown className='w-8 h-8' />
                </motion.div>

                <h2 className='text-3xl font-bold mb-2'>
                  Upgrade to PaperLM Pro
                </h2>
                <p className='text-lg opacity-90'>{getTriggerMessage()}</p>
              </div>
            </div>

            {/* Current Usage Stats (if limit reached) */}
            {trigger === 'limit_reached' && currentUsage && (
              <div className='p-6 bg-amber-50 border-b border-amber-200'>
                <h3 className='font-semibold text-gray-900 mb-3'>
                  Your Current Usage
                </h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='bg-white p-4 rounded-lg border border-amber-200'>
                    <div className='flex items-center gap-2 mb-2'>
                      <FileText className='w-4 h-4 text-amber-600' />
                      <span className='font-medium text-gray-900'>
                        Documents
                      </span>
                    </div>
                    <div className='text-2xl font-bold text-amber-600'>
                      {currentUsage.documentsUploaded} /{' '}
                      {currentLimits.maxDocuments}
                    </div>
                  </div>
                  <div className='bg-white p-4 rounded-lg border border-amber-200'>
                    <div className='flex items-center gap-2 mb-2'>
                      <MessageSquare className='w-4 h-4 text-amber-600' />
                      <span className='font-medium text-gray-900'>
                        Chat Messages
                      </span>
                    </div>
                    <div className='text-2xl font-bold text-amber-600'>
                      {currentUsage.chatMessagesUsed} /{' '}
                      {currentLimits.maxChatMessages}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Features Comparison */}
            <div className='p-8'>
              <h3 className='text-2xl font-bold text-gray-900 mb-6 text-center'>
                What You&#39;ll Get with Pro
              </h3>

              <div className='space-y-6'>
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className='flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-amber-300 transition-colors'
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}>
                    <div className='flex-shrink-0 w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center'>
                      <feature.icon className='w-6 h-6 text-white' />
                    </div>

                    <div className='flex-1'>
                      <h4 className='font-semibold text-gray-900 mb-1'>
                        {feature.title}
                      </h4>
                      <p className='text-gray-600 mb-3'>
                        {feature.description}
                      </p>

                      <div className='flex items-center gap-6'>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm font-medium text-gray-500'>
                            {currentLimits.planName}:
                          </span>
                          <span className='text-sm text-gray-700'>
                            {feature.free}
                          </span>
                        </div>

                        <div className='flex items-center gap-2'>
                          <span className='text-sm font-medium text-orange-600'>
                            Pro:
                          </span>
                          <span className='text-sm font-semibold text-orange-600'>
                            {feature.pro}
                          </span>
                          <Check className='w-4 h-4 text-green-500' />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className='p-8 bg-gray-50 rounded-b-2xl'>
              <div className='max-w-sm mx-auto'>
                <div className='bg-white p-6 rounded-2xl border-2 border-orange-500 shadow-lg'>
                  <div className='text-center mb-6'>
                    <div className='flex items-baseline justify-center gap-1 mb-2'>
                      <span className='text-4xl font-bold text-gray-900'>
                        $19
                      </span>
                      <span className='text-lg text-gray-600'>/month</span>
                    </div>
                    <p className='text-gray-600'>
                      Everything you need to excel
                    </p>
                  </div>

                  <motion.button
                    onClick={handleUpgrade}
                    disabled={isProcessing}
                    className='w-full py-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}>
                    {isProcessing ? (
                      <div className='flex items-center justify-center gap-2'>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                          className='w-4 h-4 border-2 border-white border-t-transparent rounded-full'
                        />
                        Processing...
                      </div>
                    ) : (
                      <>
                        <Crown className='w-5 h-5 inline mr-2' />
                        Upgrade to Pro
                      </>
                    )}
                  </motion.button>

                  <p className='text-xs text-gray-500 text-center mt-3'>
                    Cancel anytime • 30-day money-back guarantee
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}