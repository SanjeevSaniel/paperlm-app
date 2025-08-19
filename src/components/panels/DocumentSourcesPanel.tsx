'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Trash2, Eye, Loader2, Plus } from 'lucide-react';
import { Document } from '@/types';
import { useFreemium } from '@/contexts/FreemiumContext';
import { useDocumentContext } from '@/contexts/DocumentContext';
import { Button } from '../ui';
import FileUploadDialog from '../FileUploadDialog';

export default function DocumentSourcesPanel() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const { canPerformAction, updateUsage, showUpgradeModal, usage } = useFreemium();
  const { setHasDocuments, setDocumentCount } = useDocumentContext();

  // Update document context when documents change
  useEffect(() => {
    const readyDocuments = documents.filter(doc => doc.status === 'ready');
    setHasDocuments(readyDocuments.length > 0);
    setDocumentCount(readyDocuments.length);
  }, [documents, setHasDocuments, setDocumentCount]);

  const handleFiles = useCallback(async (files: FileList) => {
    // Check if user can upload
    if (!canPerformAction('upload')) {
      showUpgradeModal('upload', usage);
      return;
    }

    Array.from(files).forEach(async (file) => {
      if (file.type === 'text/plain' || file.type === 'application/pdf') {
        const tempId = Math.random().toString(36).substr(2, 9);
        const newDoc: Document = {
          id: tempId,
          name: file.name,
          content: '',
          metadata: {
            size: file.size,
            type: file.type,
            uploadedAt: new Date(),
          },
          status: 'uploading'
        };
        
        setDocuments(prev => [...prev, newDoc]);
        
        try {
          // Upload file to API
          const formData = new FormData();
          formData.append('file', file);
          
          setDocuments(prev => 
            prev.map(doc => 
              doc.id === tempId 
                ? { ...doc, status: 'processing' as const }
                : doc
            )
          );

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            updateUsage('upload'); // Update usage count
            setDocuments(prev => 
              prev.map(doc => 
                doc.id === tempId 
                  ? { 
                      ...doc, 
                      id: result.documentId,
                      status: 'ready' as const, 
                      metadata: { 
                        ...doc.metadata, 
                        chunksCount: result.chunksCount 
                      } 
                    }
                  : doc
              )
            );
          } else {
            const errorData = await response.json();
            if (errorData.limitExceeded) {
              showUpgradeModal('upload', errorData.currentUsage);
              return;
            }
            throw new Error('Upload failed');
          }
        } catch (error) {
          console.error('Upload error:', error);
          setDocuments(prev => 
            prev.map(doc => 
              doc.id === tempId 
                ? { ...doc, status: 'error' as const }
                : doc
            )
          );
        }
      }
    });
  }, [canPerformAction, showUpgradeModal, usage, updateUsage]);


  const removeDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  }, []);

  const handleTextSubmit = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const tempId = Math.random().toString(36).substr(2, 9);
    const newDoc: Document = {
      id: tempId,
      name: 'Text Input',
      content: text,
      metadata: {
        size: text.length,
        type: 'text/plain',
        uploadedAt: new Date(),
      },
      status: 'processing'
    };

    setDocuments(prev => [...prev, newDoc]);

    try {
      // Create a text file and upload it
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
        updateUsage('upload');
        setDocuments(prev => 
          prev.map(doc => 
            doc.id === tempId 
              ? { 
                  ...doc, 
                  id: result.documentId,
                  status: 'ready' as const, 
                  metadata: { 
                    ...doc.metadata, 
                    chunksCount: result.chunksCount 
                  } 
                }
              : doc
          )
        );
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Text input error:', error);
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === tempId 
            ? { ...doc, status: 'error' as const }
            : doc
        )
      );
    }
  }, [updateUsage]);

  const handleUrlSubmit = useCallback(async (url: string, type: 'youtube' | 'website') => {
    if (!url.trim()) return;

    const tempId = Math.random().toString(36).substr(2, 9);
    const newDoc: Document = {
      id: tempId,
      name: type === 'youtube' ? 'YouTube Video' : 'Website',
      content: url,
      metadata: {
        size: url.length,
        type: type === 'youtube' ? 'video/youtube' : 'text/html',
        uploadedAt: new Date(),
      },
      status: 'processing'
    };

    setDocuments(prev => [...prev, newDoc]);

    // Simulate processing for now - in real implementation you'd fetch and process the content
    setTimeout(() => {
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === tempId 
            ? { 
                ...doc, 
                status: 'ready' as const, 
                metadata: { 
                  ...doc.metadata, 
                  chunksCount: 5 // Simulated
                } 
              }
            : doc
        )
      );
    }, 2000);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'uploading': return 'text-orange-600 bg-orange-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'ready': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDocumentIcon = (doc: Document) => {
    if (doc.metadata.type === 'video/youtube') return Youtube;
    if (doc.metadata.type === 'text/html') return Globe;
    if (doc.name === 'Text Input') return Type;
    return FileText;
  };

  const getDocumentIconColor = (doc: Document) => {
    if (doc.metadata.type === 'video/youtube') return 'text-red-600';
    if (doc.metadata.type === 'text/html') return 'text-emerald-600';
    if (doc.name === 'Text Input') return 'text-slate-600';
    return 'text-blue-600';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header for Card */}
      <div className="px-4 py-3 border-b border-gray-100 bg-slate-50/30">
        <p className="text-sm text-gray-600">Upload and manage your documents</p>
      </div>

      {/* Single Column Layout with Dialog Buttons */}
      <div className="flex-1 flex flex-col p-4 min-h-0">
        {/* Add Content Buttons - Horizontal Layout */}
        <div className="mb-4 space-y-3">
          {/* Upload Files - Primary */}
          <FileUploadDialog
            onFileUpload={handleFiles}
            onTextSubmit={handleTextSubmit}
            onUrlSubmit={handleUrlSubmit}
            canPerformAction={canPerformAction}
          >
            <button className="w-full flex items-center gap-3 p-3 border-2 border-dashed border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Add Content</p>
                <p className="text-xs text-gray-500">Upload files, paste text, add URLs</p>
              </div>
            </button>
          </FileUploadDialog>
        </div>

        {/* Documents List */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Documents
            </h3>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {documents.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2">
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs font-medium text-gray-500 mb-1">No documents</p>
                <p className="text-xs text-gray-400">Upload to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="group relative border border-gray-200 rounded-lg p-2.5 hover:shadow-sm hover:border-gray-300 transition-all duration-200 bg-white"
                  >
                    {/* Status indicator line */}
                    <div className={`absolute left-0 top-0 w-1 h-full rounded-l-lg ${
                      doc.status === 'ready' ? 'bg-green-500' :
                      doc.status === 'processing' ? 'bg-blue-500' :
                      doc.status === 'uploading' ? 'bg-orange-500' : 'bg-red-500'
                    }`} />
                    
                    <div className="flex items-start gap-2">
                      {/* Icon */}
                      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                        doc.metadata.type === 'video/youtube' ? 'bg-red-50 border border-red-100' :
                        doc.metadata.type === 'text/html' ? 'bg-emerald-50 border border-emerald-100' :
                        doc.name === 'Text Input' ? 'bg-slate-50 border border-slate-100' :
                        'bg-blue-50 border border-blue-100'
                      }`}>
                        {(() => {
                          const IconComponent = getDocumentIcon(doc);
                          const iconColor = getDocumentIconColor(doc);
                          return <IconComponent className={`w-3 h-3 ${iconColor}`} />;
                        })()}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-gray-900 truncate mb-1">{doc.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatFileSize(doc.metadata.size)}</span>
                          {doc.metadata.chunksCount && (
                            <>
                              <span>•</span>
                              <span>{doc.metadata.chunksCount}ch</span>
                            </>
                          )}
                          {/* Status badge */}
                          {doc.status !== 'ready' && (
                            <>
                              <span>•</span>
                              <span className={`font-medium ${
                                doc.status === 'processing' ? 'text-blue-600' :
                                doc.status === 'uploading' ? 'text-orange-600' : 'text-red-600'
                              }`}>
                                {doc.status}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {doc.status === 'processing' && (
                          <Loader2 className="w-3 h-3 animate-spin text-blue-500 mr-1" />
                        )}
                        <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                          <Eye className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => removeDocument(doc.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}