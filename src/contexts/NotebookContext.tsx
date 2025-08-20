'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NotebookContextValue {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const NotebookContext = createContext<NotebookContextValue | null>(null);

interface NotebookProviderProps {
  children: ReactNode;
}

export function NotebookProvider({ children }: NotebookProviderProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const value: NotebookContextValue = {
    refreshTrigger,
    triggerRefresh,
  };

  return (
    <NotebookContext.Provider value={value}>
      {children}
    </NotebookContext.Provider>
  );
}

export function useNotebookContext() {
  const context = useContext(NotebookContext);
  if (!context) {
    throw new Error('useNotebookContext must be used within a NotebookProvider');
  }
  return context;
}