'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { useDocumentContext } from '@/contexts/DocumentContext';
import { useUsage } from '@/contexts/UsageContext';
import { getSessionId } from '@/lib/sessionStorage';
import { ExtendedDocument, TempDocument } from './types';

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
  const [documents, setDocuments] = useState<(ExtendedDocument | TempDocument)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setHasDocuments, setDocumentCount } = useDocumentContext();
  const tempIdCounter = useRef(0);

  // Generate predictable temporary ID to avoid hydration issues
  const generateTempId = (prefix: string) => {
    tempIdCounter.current += 1;
    return `temp-${prefix}-${tempIdCounter.current}`;
  };

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

      console.log('🔄 Refreshing documents for session:', sessionId);
      const response = await fetch(`/api/documents?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Fetched documents:', data.documents?.length || 0, 'documents');
        setDocuments(data.documents || []);
      } else {
        console.error('❌ Failed to fetch documents:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to refresh documents:', error);
    }
  }, []);

  /**
   * Handle file uploads
   */
  const handleFiles = useCallback(async (files: FileList) => {
    console.log('🎯 handleFiles called with:', files.length, 'files');
    
    if (!canUploadDocument) {
      console.log('❌ Upload blocked: Document upload limit reached');
      toast.error('Document upload limit reached. Sign in for unlimited uploads.', {
        duration: 5000,
      });
      return;
    }

    // Client-side only to avoid hydration issues with temp documents
    if (typeof window === 'undefined') {
      console.log('❌ Upload blocked: Server-side rendering');
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

        // Create temporary document entry to show immediately in UI
        const tempDocument: TempDocument = {
          id: generateTempId('file'),
          name: file.name,
          type: file.name.endsWith('.pdf') ? 'file' as const : 
                file.name.endsWith('.docx') ? 'file' as const :
                file.type?.includes('video') ? 'youtube' as const : 'file' as const,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          status: 'uploading' as const,
          chunksCount: 0,
          uploadedAt: new Date(),
          sourceUrl: undefined,
          fileType: file.type,
        };

        // Add temporary document to show instant feedback
        setDocuments(prev => [tempDocument, ...prev]);

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
            // Update temp document status to processing
            setDocuments(prev => prev.map(doc => 
              doc.id === tempDocument.id 
                ? { ...doc, status: 'processing' as const }
                : doc
            ));

            await response.json();
            await incrementDocumentUsage();
            
            // Immediately refresh documents and remove temp document
            await refreshDocuments();
            setDocuments(prev => prev.filter(doc => doc.id !== tempDocument.id));
            
            toast.dismiss(loadingToast);
            toast.success(`${file.name} uploaded successfully!`, {
              duration: 3000,
            });
          } else {
            // Check for specific error responses
            const errorData = await response.json().catch(() => null);
            if (response.status === 409 && errorData?.duplicate) {
              throw new Error(errorData.error || 'Duplicate file detected');
            } else {
              throw new Error(
                `Upload failed with status ${response.status}: ${response.statusText}`,
              );
            }
          }
        } catch (error) {
          console.error('Upload error:', error);

          // Remove temp document on error
          setDocuments(prev => prev.filter(doc => doc.id !== tempDocument.id));

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

    // Client-side only to avoid hydration issues with temp documents
    if (typeof window === 'undefined') return;

    const loadingToast = toast.loading('Processing text input...');

    // Create temporary document entry for text input
    const tempDocument: TempDocument = {
      id: generateTempId('text'),
      name: 'text-input.txt',
      type: 'file' as const,
      size: `${(text.length / 1024).toFixed(1)} KB`,
      status: 'uploading' as const,
      chunksCount: 0,
      uploadedAt: new Date(),
      sourceUrl: undefined,
      fileType: 'text/plain',
    };

    // Add temporary document to show instant feedback
    setDocuments(prev => [tempDocument, ...prev]);

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
        // Update temp document status to processing
        setDocuments(prev => prev.map(doc => 
          doc.id === tempDocument.id 
            ? { ...doc, status: 'processing' as const }
            : doc
        ));

        await response.json();
        await incrementDocumentUsage();
        
        // Immediately refresh documents and remove temp document
        await refreshDocuments();
        setDocuments(prev => prev.filter(doc => doc.id !== tempDocument.id));
        
        toast.dismiss(loadingToast);
        toast.success('Text input processed and indexed successfully!', {
          duration: 3000,
        });
      } else {
        throw new Error(`Processing failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Text input error:', error);
      
      // Remove temp document on error
      setDocuments(prev => prev.filter(doc => doc.id !== tempDocument.id));
      
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

      // Client-side only to avoid hydration issues with temp documents
      if (typeof window === 'undefined') return;

      const loadingToast = toast.loading(
        `Scraping ${type === 'youtube' ? 'YouTube video' : 'website'} content...`,
      );

      // Create temporary document entry for URL scraping
      let documentName = type === 'youtube' ? 'YouTube Video' : 'Website';
      try {
        if (type !== 'youtube') {
          documentName = new URL(url).hostname;
        }
      } catch {
        // Fallback if URL parsing fails
        documentName = 'Website';
      }

      const tempDocument: TempDocument = {
        id: generateTempId('url'),
        name: documentName,
        type: type,
        size: 'Calculating...',
        status: 'uploading' as const,
        chunksCount: 0,
        uploadedAt: new Date(),
        sourceUrl: url,
        fileType: type === 'youtube' ? 'video/youtube' : 'text/html',
      };

      // Add temporary document to show instant feedback
      setDocuments(prev => [tempDocument, ...prev]);

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
          // Update temp document status to processing
          setDocuments(prev => prev.map(doc => 
            doc.id === tempDocument.id 
              ? { ...doc, status: 'processing' as const }
              : doc
          ));

          await response.json();
          
          // Immediately refresh documents and remove temp document
          await refreshDocuments();
          setDocuments(prev => prev.filter(doc => doc.id !== tempDocument.id));

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

        // Remove temp document on error
        setDocuments(prev => prev.filter(doc => doc.id !== tempDocument.id));

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
    setDocuments,  // Export setDocuments for temp document management
  };
}