'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DocumentContextValue {
  hasDocuments: boolean;
  setHasDocuments: (hasDocuments: boolean) => void;
  documentCount: number;
  setDocumentCount: (count: number) => void;
}

const DocumentContext = createContext<DocumentContextValue | null>(null);

interface DocumentProviderProps {
  children: ReactNode;
}

export function DocumentProvider({ children }: DocumentProviderProps) {
  const [hasDocuments, setHasDocuments] = useState(false);
  const [documentCount, setDocumentCount] = useState(0);

  const value: DocumentContextValue = {
    hasDocuments,
    setHasDocuments,
    documentCount,
    setDocumentCount,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocumentContext() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocumentContext must be used within a DocumentProvider');
  }
  return context;
}