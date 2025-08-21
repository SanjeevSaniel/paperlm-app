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

  const userId = params.userId as string;

  useEffect(() => {
    if (!isLoaded) return;

    const validateUser = async () => {
      try {
        // Since middleware enforces authentication, user should be signed in
        if (!isSignedIn || !user?.id) {
          setValidationError('Authentication required. Please sign in.');
          return;
        }

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

        // Update auth store with the paperlm user ID
        setPaperlmUserId(userId);
          
        // Fetch user data to ensure it's in the store
        await fetchUserData();

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50/60 via-amber-50/50 to-orange-50/40 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-4"
          >
            <Loader2 className="w-8 h-8 text-amber-600 mx-auto" />
          </motion.div>
          <p className="text-gray-600">Validating session...</p>
          <p className="text-sm text-gray-500 mt-2">
            Authenticated access required
          </p>
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