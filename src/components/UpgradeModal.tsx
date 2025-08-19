'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Crown, 
  FileText, 
  MessageSquare, 
  Upload, 
  Sparkles,
  ArrowRight,
  Github,
  Mail
} from 'lucide-react';
import { Button } from './ui';
import { useRouter } from 'next/navigation';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsage: {
    uploads: number;
    queries: number;
    total: number;
  };
  limits: {
    uploads: number;
    queries: number;
    total: number;
  };
  trigger?: 'upload' | 'query';
}

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  currentUsage, 
  limits,
  trigger = 'upload'
}: UpgradeModalProps) {
  const router = useRouter();

  const handleSignUp = () => {
    router.push('/sign-up');
  };

  const handleSignIn = () => {
    router.push('/sign-in');
  };

  const features = [
    {
      icon: <Upload className="w-5 h-5" />,
      title: "Unlimited Document Uploads",
      description: "Upload as many PDFs, text files, and documents as you need"
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Unlimited AI Queries",
      description: "Ask unlimited questions and get intelligent insights from your documents"
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Document Management",
      description: "Organize, save, and access your documents across all sessions"
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Advanced Features",
      description: "Access premium AI models and enhanced analysis capabilities"
    }
  ];

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop with creamy/lavender theme */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-purple-50/90 via-amber-50/80 to-orange-50/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="relative w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-purple-100/50"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="relative p-8 pb-6">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors duration-200 rounded-full hover:bg-purple-50/50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <motion.div 
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-amber-100 rounded-2xl mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <Crown className="w-8 h-8 text-purple-600" />
                </motion.div>

                <motion.h2 
                  className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-amber-600 bg-clip-text text-transparent mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Unlock Full Potential
                </motion.h2>

                <motion.p 
                  className="text-slate-600 text-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  You&apos;ve reached your {trigger} limit. Sign up for unlimited access!
                </motion.p>
              </div>
            </div>

            {/* Usage Stats */}
            <motion.div 
              className="px-8 py-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="bg-gradient-to-r from-purple-50/50 to-amber-50/50 rounded-2xl p-6 border border-purple-100/30">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">
                  Your Current Usage
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{currentUsage.uploads}</div>
                    <div className="text-sm text-slate-600">Uploads</div>
                    <div className="text-xs text-slate-500">of {limits.uploads}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">{currentUsage.queries}</div>
                    <div className="text-sm text-slate-600">Queries</div>
                    <div className="text-xs text-slate-500">of {limits.queries}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-rose-600">{currentUsage.total}</div>
                    <div className="text-sm text-slate-600">Total</div>
                    <div className="text-xs text-slate-500">of {limits.total}</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Features */}
            <div className="px-8 py-6">
              <motion.h3 
                className="text-xl font-semibold text-slate-800 mb-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                What you&apos;ll get with an account:
              </motion.h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-white/80 to-purple-50/30 border border-purple-100/20"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <div className="flex-shrink-0 p-2 bg-gradient-to-br from-purple-100 to-amber-100 rounded-lg text-purple-600">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-1">{feature.title}</h4>
                      <p className="text-sm text-slate-600">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <motion.div 
              className="p-8 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
            >
              <div className="space-y-3">
                <Button
                  onClick={handleSignUp}
                  className="w-full bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] group"
                  animated={true}
                >
                  <span className="flex items-center justify-center gap-2">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>

                <div className="text-center">
                  <span className="text-slate-500 text-sm">Already have an account? </span>
                  <button 
                    onClick={handleSignIn}
                    className="text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors"
                  >
                    Sign in
                  </button>
                </div>

                <div className="flex items-center justify-center gap-4 pt-4 border-t border-purple-100/30">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Github className="w-4 h-4" />
                    <span>Sign up with GitHub</span>
                  </div>
                  <div className="w-px h-4 bg-slate-300"></div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="w-4 h-4" />
                    <span>Or with Email</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100/20 to-transparent rounded-full -translate-y-16 translate-x-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-100/20 to-transparent rounded-full translate-y-12 -translate-x-12 pointer-events-none"></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}