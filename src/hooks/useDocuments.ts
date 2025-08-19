'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export function useDocuments() {
  const [hasDocuments, setHasDocuments] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const checkDocuments = async () => {
      if (!isLoaded) return;
      
      try {
        setIsLoading(true);
        
        if (user) {
          // For authenticated users, check API
          const response = await fetch('/api/documents');
          if (response.ok) {
            const data = await response.json();
            setHasDocuments(data.documents && data.documents.length > 0);
          } else {
            setHasDocuments(false);
          }
        } else {
          // For anonymous users, check localStorage or sessionStorage
          // This is a simple check - in a real app you might want to check the anonymous storage
          const hasAnyDocuments = localStorage.getItem('anonymous_documents_count');
          setHasDocuments(!!hasAnyDocuments && parseInt(hasAnyDocuments) > 0);
        }
      } catch (error) {
        console.error('Error checking documents:', error);
        setHasDocuments(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkDocuments();
  }, [user, isLoaded]);

  const refreshDocuments = () => {
    if (isLoaded) {
      const checkDocuments = async () => {
        try {
          if (user) {
            const response = await fetch('/api/documents');
            if (response.ok) {
              const data = await response.json();
              setHasDocuments(data.documents && data.documents.length > 0);
            }
          } else {
            const hasAnyDocuments = localStorage.getItem('anonymous_documents_count');
            setHasDocuments(!!hasAnyDocuments && parseInt(hasAnyDocuments) > 0);
          }
        } catch (error) {
          console.error('Error refreshing documents:', error);
        }
      };
      checkDocuments();
    }
  };

  return { hasDocuments, isLoading, refreshDocuments };
}