'use client';

import { useState, useEffect } from 'react';
import { getSessionData } from '@/lib/sessionStorage';

export function useDocuments() {
  const [hasDocuments, setHasDocuments] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkDocuments = async () => {
      try {
        setIsLoading(true);
        
        // Check session storage for documents (anonymous users)
        const sessionData = getSessionData();
        const documents = sessionData?.documents || [];
        setHasDocuments(documents.length > 0);
      } catch (error) {
        console.error('Error checking documents:', error);
        setHasDocuments(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkDocuments();
  }, []);

  const refreshDocuments = () => {
    const checkDocuments = async () => {
      try {
        const sessionData = getSessionData();
        const documents = sessionData?.documents || [];
        setHasDocuments(documents.length > 0);
      } catch (error) {
        console.error('Error refreshing documents:', error);
      }
    };
    checkDocuments();
  };

  return { hasDocuments, isLoading, refreshDocuments };
}