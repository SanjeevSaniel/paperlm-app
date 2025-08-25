'use client';

import DocumentUploadArea from '../documents/DocumentUploadArea';
import DocumentList from '../documents/DocumentList';
import { useDocuments } from '../documents/useDocuments';
import { Button } from '@/components/ui/Button';
import { RefreshCw } from 'lucide-react';

/**
 * DocumentSourcesPanel manages document uploads and display
 * 
 * Features:
 * - Document upload via files, text, or URLs
 * - Document list with loading and empty states
 * - Automatic context updates for document availability
 * - Real-time document status tracking
 * 
 * @returns JSX element representing the document sources panel
 */
export default function DocumentSourcesPanel() {
  const {
    documents,
    isLoading,
    handleFiles,
    handleTextSubmit,
    handleUrlSubmit,
    removeDocument,
    refreshDocuments,
    setDocuments,
  } = useDocuments();

  return (
    <div className='h-full flex flex-col'>
      {/* Header */}
      <div className='px-4 py-3 border-b border-gray-100 bg-slate-50/30 flex-shrink-0'>
        <div className='flex items-center justify-between'>
          <p className='text-sm font-medium text-gray-700'>
            Documents ({documents.length})
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDocuments}
            disabled={isLoading}
            className="h-8 px-2"
            title="Refresh documents"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 flex flex-col px-4 py-2 min-h-0'>
        {/* Upload Area */}
        <DocumentUploadArea
          onFileUpload={handleFiles}
          onTextSubmit={handleTextSubmit}
          onUrlSubmit={handleUrlSubmit}
        />

        {/* Document List */}
        <DocumentList
          documents={documents}
          isLoading={isLoading}
          onDeleteDocument={removeDocument}
          setDocuments={setDocuments}
        />
      </div>
    </div>
  );
}