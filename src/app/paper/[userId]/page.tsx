'use client';

import AppLayout from '@/components/AppLayout';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function UserPaperApp() {
  const params = useParams();
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { setPaperlmUserId, fetchUserData } = useAuthStore();
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [loadingStep, setLoadingStep] = useState(0);

  const userId = params.userId as string;

  useEffect(() => {
    if (!isLoaded) {
      setLoadingMessage('Loading authentication...');
      setLoadingStep(0);
      return;
    }

    const validateUser = async () => {
      try {
        setLoadingMessage('Checking authentication status...');
        setLoadingStep(1);
        await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for UX

        // Since middleware enforces authentication, user should be signed in
        if (!isSignedIn || !user?.id) {
          setValidationError('Authentication required. Please sign in.');
          return;
        }

        setLoadingMessage('Verifying user permissions...');
        setLoadingStep(2);
        await new Promise(resolve => setTimeout(resolve, 200));

        // Validate that this is a Clerk User ID
        if (!userId.startsWith('user_')) {
          setValidationError('Invalid user ID format');
          return;
        }

        // Verify the user owns this workspace by checking if the URL userId matches their Clerk ID
        if (userId !== user.id) {
          setValidationError('Access denied. You can only access your own workspace.');
          return;
        }

        setLoadingMessage('Setting up your workspace...');
        setLoadingStep(3);
        await new Promise(resolve => setTimeout(resolve, 200));

        // Update auth store with the paperlm user ID
        setPaperlmUserId(userId);
          
        setLoadingMessage('Loading your documents and data...');
        setLoadingStep(4);
        
        // Fetch user data to ensure it's in the store
        await fetchUserData();

        setLoadingMessage('Welcome back! Starting PaperLM...');
        setLoadingStep(5);
        await new Promise(resolve => setTimeout(resolve, 300));

        // If all validations pass
        setIsValidating(false);
      } catch (error) {
        console.error('User validation error:', error);
        setValidationError('Failed to validate user session');
      }
    };

    validateUser();
  }, [isLoaded, isSignedIn, user, userId, setPaperlmUserId, fetchUserData]);

  // Show loading while validating
  if (!isLoaded || isValidating) {
    const progressPercentage = (loadingStep / 5) * 100;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50/60 via-amber-50/50 to-orange-50/40 flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-6"
          >
            <Loader2 className="w-10 h-10 text-amber-600 mx-auto" />
          </motion.div>
          
          <motion.h2 
            className="text-xl font-semibold text-gray-800 mb-3"
            key={loadingMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {loadingMessage}
          </motion.h2>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
            <motion.div 
              className="h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          
          <p className="text-sm text-gray-500">
            {isSignedIn && user ? `Welcome ${user.firstName || 'back'}!` : 'Please wait...'}
          </p>
          
          {/* Steps indicator */}
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <motion.div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index < loadingStep 
                    ? 'bg-amber-500' 
                    : index === loadingStep 
                      ? 'bg-amber-400' 
                      : 'bg-gray-300'
                }`}
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: index === loadingStep ? [0.8, 1.2, 0.8] : 0.8,
                }}
                transition={{ 
                  duration: index === loadingStep ? 1.5 : 0.3,
                  repeat: index === loadingStep ? Infinity : 0 
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Show error if validation failed
  if (validationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50/60 via-amber-50/50 to-orange-50/40 flex items-center justify-center">
        <motion.div
          className="max-w-md mx-auto text-center p-8 bg-white rounded-2xl shadow-lg border border-red-200"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{validationError}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/paper')}
              className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
            {!isSignedIn && (
              <>
                <button
                  onClick={() => router.push('/sign-up')}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create Account
                </button>
                <button
                  onClick={() => router.push('/sign-in')}
                  className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Render the main app with user context
  return <AppLayout userId={userId} />;
}