'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useAuthStore } from '@/stores/authStore';

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
    setLoading 
  } = useAuthStore();

  useEffect(() => {
    if (!isLoaded) return;

    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        if (isSignedIn && user?.id) {
          // User is authenticated - fetch their data
          setAuthenticated(true);
          await fetchUserData();
        } else {
          // User is not authenticated - reset store
          setAuthenticated(false);
          reset();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
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
  }, [isLoaded, isSignedIn, user, isInitialized, fetchUserData, setAuthenticated, setInitialized, reset, setLoading]);

  return <>{children}</>;
}