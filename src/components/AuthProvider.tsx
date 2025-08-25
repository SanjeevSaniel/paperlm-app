'use client';

import { useAuthStore } from '@/stores/authStore';
import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const {
    fetchUserData,
    setAuthenticated,
    setInitialized,
    reset,
    isInitialized,
    setLoading,
  } = useAuthStore();

  useEffect(() => {
    if (!isLoaded) return;

    const initializeAuth = async () => {
      setLoading(true);

      try {
        if (isSignedIn && user?.id) {
          // User is authenticated
          setAuthenticated(true);

          // Try to fetch user data with retry logic for timing issues
          let retryCount = 0;
          const maxRetries = 3;
          const retryDelay = 1000; // 1 second

          const fetchUserDataWithRetry = async () => {
            try {
              await fetchUserData();
              console.log('✅ User data fetched successfully');
            } catch (fetchError: unknown) {
              console.error(`Failed to fetch user data (attempt ${retryCount + 1}/${maxRetries}):`, fetchError);
              
              // Retry on 401/500 errors which might be timing related
              const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
              if (retryCount < maxRetries && (
                errorMessage.includes('401') || 
                errorMessage.includes('500') ||
                errorMessage.includes('Unauthorized') ||
                errorMessage.includes('Failed to fetch user data')
              )) {
                retryCount++;
                console.log(`⏳ Retrying user data fetch in ${retryDelay}ms...`);
                setTimeout(fetchUserDataWithRetry, retryDelay);
              } else {
                console.error('❌ Max retries reached or non-retryable error. User is still authenticated.');
                // User can still proceed, data fetch can be retried later
              }
            }
          };

          await fetchUserDataWithRetry();
        } else {
          // User is not authenticated
          setAuthenticated(false);
          reset();
        }
      } catch (error) {
        console.error('Critical error initializing auth:', error);
        setAuthenticated(false);
        reset();
      } finally {
        setInitialized(true);
        setLoading(false);
      }
    };

    if (!isInitialized) {
      initializeAuth();
    }
  }, [
    isLoaded,
    isSignedIn,
    user,
    isInitialized,
    fetchUserData,
    setAuthenticated,
    setInitialized,
    reset,
    setLoading,
  ]);

  return <>{children}</>;
}
