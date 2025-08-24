'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function PaperApp() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { setPaperlmUserId, fetchUserData } = useAuthStore();
  const [, setIsGeneratingId] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    const redirectToWorkspace = async () => {
      try {
        // Since middleware enforces authentication, user should be signed in
        if (!isSignedIn || !user?.id) {
          console.log('User not authenticated, redirecting to sign-in');
          router.push('/sign-in');
          return;
        }

        console.log('User authenticated, getting workspace URL...');

        // Get authenticated user data and workspace URL
        const response = await fetch('/api/user-id', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'get_or_create'
          }),
        });

        if (!response.ok) {
          console.error('API Error:', response.status, await response.text());
          throw new Error(`Failed to get user data: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.paperlmUserId && data.workspaceUrl) {
          console.log('Got user data, redirecting to workspace:', data.workspaceUrl);
          
          // Update auth store with the user data
          setPaperlmUserId(data.paperlmUserId);
          
          // Fetch additional user data to populate the store with retry logic
          try {
            await fetchUserData();
            console.log('✅ User data populated successfully');
          } catch (fetchError) {
            console.warn('⚠️ Could not fetch user data immediately, will retry in background:', fetchError);
            // Don't block the redirect, user data will be retried by AuthProvider
          }
          
          // Redirect to user's workspace
          router.replace(data.workspaceUrl);
        } else {
          console.error('Invalid API response:', data);
          throw new Error(data.error || 'Invalid response from server');
        }
      } catch (error) {
        console.error('Error setting up workspace:', error);
        
        // Use authenticated user ID as fallback
        if (user?.id) {
          console.log('Using Clerk user ID as fallback workspace');
          const fallbackWorkspace = `/paper/${user.id}`;
          setPaperlmUserId(user.id);
          router.replace(fallbackWorkspace);
        } else {
          // Last resort: redirect to sign-in
          console.error('No user ID available, redirecting to sign-in');
          router.push('/sign-in');
        }
      } finally {
        setIsGeneratingId(false);
      }
    };

    redirectToWorkspace();
  }, [isLoaded, isSignedIn, user, router, setPaperlmUserId, fetchUserData]);

  // Show loading while redirecting
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
        <p className="text-gray-600">Redirecting to your workspace...</p>
        <p className="text-sm text-gray-500 mt-2">
          Preparing your personalized environment
        </p>
      </motion.div>
    </div>
  );
}