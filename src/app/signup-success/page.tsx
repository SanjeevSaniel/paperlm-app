'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function SignUpSuccess() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    // Auto-redirect after successful signup
    const redirectTimer = setTimeout(() => {
      if (isSignedIn) {
        console.log('Sign-up successful, redirecting to app...');
        router.replace('/paper');
      } else {
        console.log('User not signed in, redirecting to sign-in...');
        router.replace('/sign-in');
      }
    }, 2000); // 2 second delay for user to see success message

    return () => clearTimeout(redirectTimer);
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50/60 via-amber-50/50 to-orange-50/40 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/60 via-amber-50/50 to-orange-50/40 flex items-center justify-center">
      <motion.div
        className="text-center max-w-md mx-auto p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-gray-900 mb-4"
        >
          Welcome to PaperLM! 🎉
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-gray-600 mb-6"
        >
          Your account has been created successfully. You&apos;ll be redirected to your workspace in a moment.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-sm text-gray-500"
        >
          <Loader2 className="w-4 h-4 inline-block animate-spin mr-2" />
          Setting up your personalized workspace...
        </motion.div>
      </motion.div>
    </div>
  );
}