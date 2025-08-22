'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { useAuthStore } from '@/stores/authStore';
// import { useSubscription } from './SubscriptionContext';

interface UsageContextType {
  chatCount: number;
  documentCount: number;
  maxFreeChats: number;
  maxFreeDocuments: number;
  incrementChatUsage: () => Promise<boolean>;
  incrementDocumentUsage: () => Promise<boolean>;
  canChat: boolean;
  canUploadDocument: boolean;
  resetUsage: () => void;
  isAuthenticated: boolean;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export function UsageProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useUser();
  const { user: authUser, incrementDocumentUsage: authIncrementDocument, incrementMessageUsage: authIncrementMessage } = useAuthStore();
  const [chatCount, setChatCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  
  const maxFreeChats = 5;
  const maxFreeDocuments = 1;

  // Load usage counts from auth store for authenticated users
  useEffect(() => {
    if (isSignedIn && authUser) {
      setChatCount(authUser.usage.messagesUsed);
      setDocumentCount(authUser.usage.documentsUploaded);
    } else {
      // Reset counts for non-authenticated state (shouldn't happen due to middleware)
      setChatCount(0);
      setDocumentCount(0);
    }
  }, [isSignedIn, authUser]);

  const incrementChatUsage = async (): Promise<boolean> => {
    if (isSignedIn && authUser) {
      // Use auth store for authenticated users
      const success = await authIncrementMessage();
      if (success) {
        setChatCount(prev => prev + 1);
      }
      return success;
    }
    return false;
  };

  const incrementDocumentUsage = async (): Promise<boolean> => {
    if (isSignedIn && authUser) {
      // Use auth store for authenticated users
      const success = await authIncrementDocument();
      if (success) {
        setDocumentCount(prev => prev + 1);
      }
      return success;
    }
    return false;
  };

  // Determine usage limits based on user type
  const canChat = isSignedIn 
    ? (authUser?.canSendMessage ?? false)
    : false;
    
  const canUploadDocument = isSignedIn 
    ? (authUser?.canUploadDocument ?? false) 
    : false;

  const resetUsage = () => {
    setChatCount(0);
    setDocumentCount(0);
    // No localStorage operations needed anymore since all users are authenticated
  };

  return (
    <UsageContext.Provider value={{
      chatCount,
      documentCount,
      maxFreeChats,
      maxFreeDocuments,
      incrementChatUsage,
      incrementDocumentUsage,
      canChat,
      canUploadDocument,
      resetUsage,
      isAuthenticated: !!isSignedIn
    }}>
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage() {
  const context = useContext(UsageContext);
  if (context === undefined) {
    throw new Error('useUsage must be used within a UsageProvider');
  }
  return context;
}