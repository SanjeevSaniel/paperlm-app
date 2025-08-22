'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

interface UserData {
  id: string;
  clerkId: string;
  email: string;
  subscription: {
    plan: 'free' | 'pro';
    status: 'active' | 'expired' | 'cancelled';
    startDate: string;
    endDate: string;
  };
  usage: {
    documentsUploaded: number;
    messagesUsed: number;
    lastResetDate: string;
  };
  canUploadDocument: boolean;
  canSendMessage: boolean;
  isSubscriptionExpired: boolean;
}

interface SubscriptionContextType {
  userData: UserData | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
  incrementDocumentUsage: () => Promise<boolean>;
  incrementMessageUsage: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    if (!user) {
      setUserData(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isLoaded) {
      fetchUserData();
    }
  }, [user, isLoaded, fetchUserData]);

  const refreshUserData = async () => {
    await fetchUserData();
  };

  const incrementDocumentUsage = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'increment_document' }),
      });

      if (response.ok) {
        await refreshUserData();
        return true;
      } else {
        const error = await response.json();
        console.error('Document usage increment failed:', error.error);
        return false;
      }
    } catch (error) {
      console.error('Failed to increment document usage:', error);
      return false;
    }
  };

  const incrementMessageUsage = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'increment_message' }),
      });

      if (response.ok) {
        await refreshUserData();
        return true;
      } else {
        const error = await response.json();
        console.error('Message usage increment failed:', error.error);
        return false;
      }
    } catch (error) {
      console.error('Failed to increment message usage:', error);
      return false;
    }
  };

  return (
    <SubscriptionContext.Provider value={{
      userData,
      loading,
      refreshUserData,
      incrementDocumentUsage,
      incrementMessageUsage,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}