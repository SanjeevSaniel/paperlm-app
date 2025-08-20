'use client';

import { useDocumentContext } from '@/contexts/DocumentContext';
import { getSessionData, updateSessionDocuments } from '@/lib/sessionStorage';
import { Document } from '@/types';
import { FileText, Loader2, Plus } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FileUploadDialog from '../FileUploadDialog';
import DocumentCard from '../DocumentCard';

interface ExtendedDocument extends Document {
  sourceUrl?: string;
  loader?: string;
  fileType?: string;
}

export default function DocumentSourcesPanel() {
  const [documents, setDocuments] = useState<ExtendedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setHasDocuments, setDocumentCount } = useDocumentContext();

  // Load session data on mount
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        const sessionData = getSessionData();
        if (sessionData && sessionData.documents) {
          setDocuments(sessionData.documents);
        } else {
          setDocuments([]);
        }
      } catch (error) {
        console.error('Failed to load session data:', error);
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessionData();
  }, []);

  // Save documents to session whenever they change
  useEffect(() => {
    if (!isLoading) {
      updateSessionDocuments(documents);
    }
  }, [documents, isLoading]);

  // Update document context when documents change
  useEffect(() => {
    const readyDocuments = documents.filter((doc) => doc.status === 'ready');
    setHasDocuments(readyDocuments.length > 0);
    setDocumentCount(readyDocuments.length);
  }, [documents, setHasDocuments, setDocumentCount]);

  const handleFiles = useCallback(async (files: FileList) => {
    Array.from(files).forEach(async (file) => {
      if (
        file.type === 'text/plain' ||
        file.type === 'application/pdf' ||
        file.type === 'text/csv' ||
        file.type === 'text/markdown' ||
        file.type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.pdf') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.docx')
      ) {
        const tempId = `temp_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const newDoc: ExtendedDocument = {
          id: tempId,
          name: file.name,
          content: '',
          metadata: {
            size: file.size,
            type: file.type,
            uploadedAt: new Date(),
          },
          status: 'uploading',
          fileType: file.type,
        };

        setDocuments((prev) => [...prev, newDoc]);

        const loadingToast = toast.loading(`Uploading ${file.name}...`);

        try {
          const formData = new FormData();
          formData.append('file', file);

          setDocuments((prev) =>
            prev.map((doc) =>
              doc.id === tempId
                ? { ...doc, status: 'processing' as const }
                : doc,
            ),
          );

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const result = await response.json();
            setDocuments((prev) =>
              prev.map((doc) =>
                doc.id === tempId
                  ? {
                      ...doc,
                      id: result.documentId,
                      content: result.content || '', // Store the full content
                      status: 'ready' as const,
                      metadata: {
                        ...doc.metadata,
                        chunksCount: result.chunksCount,
                      },
                    }
                  : doc,
              ),
            );

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

          setDocuments((prev) =>
            prev.map((doc) =>
              doc.id === tempId ? { ...doc, status: 'error' as const } : doc,
            ),
          );

          toast.dismiss(loadingToast);
          toast.error(errorMessage, {
            duration: 6000,
          });
        }
      }
    });
  }, []);

  const handleTextSubmit = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const tempId = `temp_text_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const newDoc: Document = {
      id: tempId,
      name: 'Text Input',
      content: text,
      metadata: {
        size: text.length,
        type: 'text/plain',
        uploadedAt: new Date(),
      },
      status: 'processing',
    };

    setDocuments((prev) => [...prev, newDoc]);

    const loadingToast = toast.loading('Processing text input...');

    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const file = new File([blob], 'text-input.txt', { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === tempId
              ? {
                  ...doc,
                  id: result.documentId,
                  status: 'ready' as const,
                  metadata: {
                    ...doc.metadata,
                    chunksCount: result.chunksCount,
                  },
                }
              : doc,
          ),
        );

        toast.dismiss(loadingToast);
        toast.success('Text input processed and indexed successfully!', {
          duration: 3000,
        });
      } else {
        throw new Error(`Processing failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Text input error:', error);

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === tempId ? { ...doc, status: 'error' as const } : doc,
        ),
      );

      toast.dismiss(loadingToast);
      toast.error('Failed to process text input', {
        duration: 6000,
      });
    }
  }, []);

  const handleUrlSubmit = useCallback(
    async (url: string, type: 'youtube' | 'website') => {
      if (!url.trim()) return;

      const tempId = `temp_url_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const newDoc: ExtendedDocument = {
        id: tempId,
        name: type === 'youtube' ? 'YouTube Video' : 'Website',
        content: url,
        metadata: {
          size: url.length,
          type: type === 'youtube' ? 'video/youtube' : 'text/html',
          uploadedAt: new Date(),
        },
        status: 'uploading',
        sourceUrl: url,
        fileType: type === 'youtube' ? 'video/youtube' : 'text/html',
      };

      setDocuments((prev) => [...prev, newDoc]);

      const loadingToast = toast.loading(
        `Scraping ${
          type === 'youtube' ? 'YouTube video' : 'website'
        } content...`,
      );

      try {
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === tempId ? { ...doc, status: 'processing' as const } : doc,
          ),
        );

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        const response = await fetch('/api/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, type }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          setDocuments((prev) =>
            prev.map((doc) =>
              doc.id === tempId
                ? {
                    ...doc,
                    id: result.documentId,
                    name: result.title || result.fileName || 'Document',
                    status: 'ready' as const,
                    metadata: {
                      ...doc.metadata,
                      chunksCount: result.chunksCount,
                      size: result.contentLength,
                    },
                    loader: result.meta?.loader,
                  }
                : doc,
            ),
          );

          toast.dismiss(loadingToast);
          toast.success(
            `${
              type === 'youtube' ? 'YouTube video' : 'Website'
            } content scraped successfully!`,
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
            errorMessage =
              'Scraping timeout - content took too long to process';
          } else if (error.message.includes('fetch')) {
            errorMessage = 'Network error - check if server is running';
          } else {
            errorMessage = error.message;
          }
        }

        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === tempId ? { ...doc, status: 'error' as const } : doc,
          ),
        );

        toast.dismiss(loadingToast);
        toast.error(errorMessage, {
          duration: 6000,
        });
      }
    },
    [],
  );

  const removeDocument = useCallback(
    (id: string) => {
      const docToRemove = documents.find((doc) => doc.id === id);
      if (!docToRemove) {
        toast.error('Document not found');
        return;
      }

      const updatedDocuments = documents.filter((doc) => doc.id !== id);
      setDocuments(updatedDocuments);
      toast.success(`Removed "${docToRemove.name}"`);
    },
    [documents],
  );

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes || isNaN(bytes) || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className='h-full flex flex-col'>
      {/* Header */}
      <div className='px-4 py-3 border-b border-gray-100 bg-slate-50/30 flex-shrink-0'>
        <p className='text-sm text-gray-600'>
          Upload and manage your documents
        </p>
      </div>

      {/* Content - Reduced bottom padding from p-4 to px-4 py-2 */}
      <div className='flex-1 flex flex-col px-4 py-2 min-h-0'>
        {/* Add Content Button - Reduced margin bottom */}
        <div className='mb-3 flex-shrink-0'>
          <FileUploadDialog
            onFileUpload={handleFiles}
            onTextSubmit={handleTextSubmit}
            onUrlSubmit={handleUrlSubmit}>
            <button className='w-full flex items-center gap-3 p-3 border-2 border-dashed border-blue-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200 group'>
              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors'>
                <Plus className='w-4 h-4 text-blue-600' />
              </div>
              <div className='text-left'>
                <p className='text-sm font-semibold text-gray-900'>
                  Add Content
                </p>
                <p className='text-xs text-gray-500'>
                  Upload files, paste text, add URLs
                </p>
              </div>
            </button>
          </FileUploadDialog>
        </div>

        {/* Documents List */}
        <div className='flex-1 flex flex-col min-h-0'>
          <div className='flex items-center justify-between mb-2 flex-shrink-0'>
            <h3 className='text-xs font-semibold text-gray-700 uppercase tracking-wider'>
              Documents
            </h3>
            <span className='text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full'>
              {documents.length}
            </span>
          </div>

          {/* Scrollable Documents Container with Conditional Thin Scrollbars - Reduced space between items */}
          <div
            className={`
            flex-1 overflow-y-auto space-y-2 min-h-0 pb-1
            ${
              documents.length > 3
                ? 'scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent'
                : ''
            }
            scrollbar-thumb-rounded-full scrollbar-track-rounded-full
          `}
            style={{
              scrollbarWidth: documents.length > 3 ? 'thin' : 'none',
              scrollbarColor:
                documents.length > 3
                  ? '#d1d5db transparent'
                  : 'transparent transparent',
            }}>
            {isLoading ? (
              <div className='text-center py-6'>
                <div className='w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3'>
                  <Loader2 className='w-6 h-6 text-gray-400 animate-spin' />
                </div>
                <p className='text-sm font-medium text-gray-500 mb-1'>
                  Loading documents...
                </p>
                <p className='text-xs text-gray-400'>
                  Please wait while we fetch your files
                </p>
              </div>
            ) : documents.length === 0 ? (
              <div className='text-center py-8'>
                <div className='w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                  <FileText className='w-8 h-8 text-gray-400' />
                </div>
                <p className='text-sm font-medium text-gray-500 mb-2'>
                  No documents yet
                </p>
                <p className='text-xs text-gray-400 mb-4'>
                  Upload your first document to get started
                </p>
                <div className='flex justify-center'>
                  <div className='px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium'>
                    ✨ Ready to upload
                  </div>
                </div>
              </div>
            ) : (
              documents.map((doc) => {
                const mappedDoc = {
                  id: doc.id,
                  name: doc.name,
                  type:
                    doc.metadata.type === 'video/youtube'
                      ? ('youtube' as const)
                      : doc.metadata.type === 'text/html'
                      ? ('website' as const)
                      : ('file' as const),
                  size: formatFileSize(doc.metadata.size),
                  status: doc.status,
                  chunksCount: doc.metadata.chunksCount,
                  uploadedAt: doc.metadata.uploadedAt,
                  sourceUrl: doc.sourceUrl,
                  fileType: doc.fileType,
                };

                return (
                  <DocumentCard
                    key={doc.id}
                    document={mappedDoc}
                    onDelete={removeDocument}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
