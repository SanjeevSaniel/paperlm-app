'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';

interface UsageData {
  uploads: number;
  queries: number;
  total: number;
}

interface FreemiumContextValue {
  usage: UsageData;
  limits: UsageData;
  isAuthenticated: boolean;
  showUpgradeModal: (trigger: 'upload' | 'query', currentUsage: UsageData) => void;
  updateUsage: (type: 'upload' | 'query') => void;
  canPerformAction: (type: 'upload' | 'query') => boolean;
  remainingUsage: UsageData;
}

const FreemiumContext = createContext<FreemiumContextValue | null>(null);

const LIMITS = {
  uploads: 3,
  queries: 5,
  total: 5,
};

interface FreemiumProviderProps {
  children: ReactNode;
  onShowUpgradeModal: (trigger: 'upload' | 'query', currentUsage: UsageData) => void;
}

export function FreemiumProvider({ children, onShowUpgradeModal }: FreemiumProviderProps) {
  const { user } = useUser();
  const [usage, setUsage] = useState<UsageData>({
    uploads: 0,
    queries: 0,
    total: 0,
  });

  const isAuthenticated = !!user;

  const canPerformAction = useCallback((type: 'upload' | 'query') => {
    if (isAuthenticated) return true;

    const total = usage.uploads + usage.queries;
    
    if (type === 'upload') {
      return usage.uploads < LIMITS.uploads && total < LIMITS.total;
    } else {
      return usage.queries < LIMITS.queries && total < LIMITS.total;
    }
  }, [usage, isAuthenticated]);

  const updateUsage = useCallback((type: 'upload' | 'query') => {
    if (isAuthenticated) return; // Don't track for authenticated users

    setUsage(prev => {
      const newUsage = {
        ...prev,
        [type === 'upload' ? 'uploads' : 'queries']: prev[type === 'upload' ? 'uploads' : 'queries'] + 1,
      };
      newUsage.total = newUsage.uploads + newUsage.queries;
      return newUsage;
    });
  }, [isAuthenticated]);

  const showUpgradeModal = useCallback((trigger: 'upload' | 'query', currentUsage: UsageData) => {
    if (!isAuthenticated) {
      onShowUpgradeModal(trigger, currentUsage);
    }
  }, [isAuthenticated, onShowUpgradeModal]);

  const remainingUsage = {
    uploads: isAuthenticated ? Infinity : Math.max(0, LIMITS.uploads - usage.uploads),
    queries: isAuthenticated ? Infinity : Math.max(0, LIMITS.queries - usage.queries),
    total: isAuthenticated ? Infinity : Math.max(0, LIMITS.total - usage.total),
  };

  const value: FreemiumContextValue = {
    usage,
    limits: LIMITS,
    isAuthenticated,
    showUpgradeModal,
    updateUsage,
    canPerformAction,
    remainingUsage,
  };

  return (
    <FreemiumContext.Provider value={value}>
      {children}
    </FreemiumContext.Provider>
  );
}

export function useFreemium() {
  const context = useContext(FreemiumContext);
  if (!context) {
    throw new Error('useFreemium must be used within a FreemiumProvider');
  }
  return context;
}