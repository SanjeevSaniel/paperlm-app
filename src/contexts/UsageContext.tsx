'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UsageContextType {
  usageCount: number;
  maxFreeUsage: number;
  incrementUsage: () => void;
  canUseService: boolean;
  resetUsage: () => void;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export function UsageProvider({ children }: { children: ReactNode }) {
  const [usageCount, setUsageCount] = useState(0);
  const maxFreeUsage = 10;

  // Load usage count from localStorage
  useEffect(() => {
    const savedUsage = localStorage.getItem('paperlm_usage_count');
    if (savedUsage) {
      setUsageCount(parseInt(savedUsage, 10));
    }
  }, []);

  // Update usage count in localStorage
  useEffect(() => {
    localStorage.setItem('paperlm_usage_count', usageCount.toString());
  }, [usageCount]);

  const incrementUsage = () => {
    setUsageCount(prev => prev + 1);
  };

  const canUseService = usageCount < maxFreeUsage;

  const resetUsage = () => {
    setUsageCount(0);
  };

  return (
    <UsageContext.Provider value={{
      usageCount,
      maxFreeUsage,
      incrementUsage,
      canUseService,
      resetUsage
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