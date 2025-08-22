'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { useDocumentContext } from '@/contexts/DocumentContext';
import { useUsage } from '@/contexts/UsageContext';
import { getSessionId } from '@/lib/sessionStorage';
import { ExtendedDocument } from './types';

/**
 * Custom hook for managing documents
 * 
 * Features:
 * - Load documents from API
 * - Handle file uploads
 * - Handle text input processing
 * - Handle URL scraping
 * - Handle document deletion
 * - Update context state
 * 
 * @returns Object containing documents state and handlers
 */
export function useDocuments() {
  const { user } = useUser();
  const { canUploadDocument, incrementDocumentUsage } = useUsage();
  const [documents, setDocuments] = useState<ExtendedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setHasDocuments, setDocumentCount } = useDocumentContext();

  /**
   * Load documents from NeonDB API
   */
  const loadDocuments = useCallback(async () => {
    try {
      const sessionId = getSessionId();
      if (!sessionId) {
        setDocuments([]);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/documents?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        console.error('Failed to load documents:', response.statusText);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh documents from API
   */
  const refreshDocuments = useCallback(async () => {
    try {
      const sessionId = getSessionId();
      if (!sessionId) return;

      const response = await fetch(`/api/documents?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to refresh documents:', error);
    }
  }, []);

  /**
   * Handle file uploads
   */
  const handleFiles = useCallback(async (files: FileList) => {
    if (!canUploadDocument) {
      toast.error('Document upload limit reached. Sign in for unlimited uploads.', {
        duration: 5000,
      });
      return;
    }

    Array.from(files).forEach(async (file) => {
      if (
        file.type === 'text/plain' ||
        file.type === 'application/pdf' ||
        file.type === 'text/csv' ||
        file.type === 'text/markdown' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.pdf') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.docx')
      ) {
        const loadingToast = toast.loading(`Uploading ${file.name}...`);

        try {
          const formData = new FormData();
          formData.append('file', file);
          const sessionId = getSessionId();
          if (sessionId) {
            formData.append('sessionId', sessionId);
          }
          if (user?.primaryEmailAddress?.emailAddress) {
            formData.append('userEmail', user.primaryEmailAddress.emailAddress);
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            await response.json();
            await incrementDocumentUsage();
            await refreshDocuments();
            
            toast.dismiss(loadingToast);
            toast.success(`${file.name} uploaded successfully!`, {
              duration: 3000,
            });
          } else {
            throw new Error(
              `Upload failed with status ${response.status}: ${response.statusText}`,
            );
          }
        } catch (error) {
          console.error('Upload error:', error);

          let errorMessage = 'Upload failed';
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              errorMessage = 'Upload timeout - file too large or server busy';
            } else if (error.message.includes('fetch')) {
              errorMessage = 'Network error - check if server is running';
            } else {
              errorMessage = error.message;
            }
          }

          toast.dismiss(loadingToast);
          toast.error(errorMessage, {
            duration: 6000,
          });
        }
      }
    });
  }, [canUploadDocument, incrementDocumentUsage, refreshDocuments, user]);

  /**
   * Handle text input submission
   */
  const handleTextSubmit = useCallback(async (text: string) => {
    if (!text.trim()) return;

    if (!canUploadDocument) {
      toast.error('Document upload limit reached. Sign in for unlimited uploads.', {
        duration: 5000,
      });
      return;
    }

    const loadingToast = toast.loading('Processing text input...');

    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const file = new File([blob], 'text-input.txt', { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', file);
      const sessionId = getSessionId();
      if (sessionId) {
        formData.append('sessionId', sessionId);
      }
      if (user?.primaryEmailAddress?.emailAddress) {
        formData.append('userEmail', user.primaryEmailAddress.emailAddress);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await response.json();
        await incrementDocumentUsage();
        await refreshDocuments();
        
        toast.dismiss(loadingToast);
        toast.success('Text input processed and indexed successfully!', {
          duration: 3000,
        });
      } else {
        throw new Error(`Processing failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Text input error:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to process text input', {
        duration: 6000,
      });
    }
  }, [canUploadDocument, incrementDocumentUsage, refreshDocuments, user]);

  /**
   * Handle URL submission for scraping
   */
  const handleUrlSubmit = useCallback(
    async (url: string, type: 'youtube' | 'website') => {
      if (!url.trim()) return;

      const loadingToast = toast.loading(
        `Scraping ${type === 'youtube' ? 'YouTube video' : 'website'} content...`,
      );

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        const response = await fetch('/api/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, type, sessionId: getSessionId() }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          await response.json();
          await refreshDocuments();

          toast.dismiss(loadingToast);
          toast.success(
            `${type === 'youtube' ? 'YouTube video' : 'Website'} content scraped successfully!`,
            {
              duration: 3000,
            },
          );
        } else {
          throw new Error(
            `Scraping failed with status ${response.status}: ${response.statusText}`,
          );
        }
      } catch (error) {
        console.error('URL scraping error:', error);

        let errorMessage = `Failed to scrape ${
          type === 'youtube' ? 'YouTube video' : 'website'
        }`;
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage = 'Scraping timeout - content took too long to process';
          } else if (error.message.includes('fetch')) {
            errorMessage = 'Network error - check if server is running';
          } else {
            errorMessage = error.message;
          }
        }

        toast.dismiss(loadingToast);
        toast.error(errorMessage, {
          duration: 6000,
        });
      }
    },
    [refreshDocuments],
  );

  /**
   * Handle document removal
   */
  const removeDocument = useCallback(
    async (id: string) => {
      const docToRemove = documents.find((doc) => doc.id === id);
      if (!docToRemove) {
        toast.error('Document not found');
        return;
      }

      try {
        const sessionId = getSessionId();
        const response = await fetch(`/api/documents?documentId=${id}&sessionId=${sessionId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const updatedDocuments = documents.filter((doc) => doc.id !== id);
          setDocuments(updatedDocuments);
          toast.success(`Removed "${docToRemove.name}"`);
        } else {
          toast.error('Failed to remove document');
        }
      } catch (error) {
        console.error('Error removing document:', error);
        toast.error('Failed to remove document');
      }
    },
    [documents],
  );

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Update document context when documents change
  useEffect(() => {
    const readyDocuments = documents.filter((doc) => doc.status === 'ready');
    setHasDocuments(readyDocuments.length > 0);
    setDocumentCount(readyDocuments.length);
  }, [documents, setHasDocuments, setDocumentCount]);

  return {
    documents,
    isLoading,
    handleFiles,
    handleTextSubmit,
    handleUrlSubmit,
    removeDocument,
    refreshDocuments,
  };
}