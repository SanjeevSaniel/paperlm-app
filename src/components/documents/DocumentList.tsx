'use client';

import { FileText, Loader2 } from 'lucide-react';
import DocumentCard from '../DocumentCard';

/**
 * Extended document interface for the document list
 */
interface ExtendedDocument {
  id: string;
  name: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  metadata: {
    size?: number;
    type: string;
    uploadedAt?: Date;
    chunksCount?: number;
  };
  sourceUrl?: string;
  loader?: string;
  fileType?: string;
}

/**
 * Props for the DocumentList component
 */
interface DocumentListProps {
  /** Array of documents to display */
  documents: ExtendedDocument[];
  /** Whether the component is loading */
  isLoading: boolean;
  /** Callback when a document is deleted */
  onDeleteDocument: (id: string) => void;
}

/**
 * DocumentList displays a list of documents with loading and empty states
 *
 * Features:
 * - Loading state with spinner
 * - Empty state with illustration
 * - Scrollable list with conditional scrollbars
 * - Document count indicator
 *
 * @param props - The component props
 * @returns JSX element representing the document list
 */
export default function DocumentList({
  documents,
  isLoading,
  onDeleteDocument,
}: DocumentListProps) {
  /**
   * Formats file size from bytes to human readable format
   */
  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes || isNaN(bytes) || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className='flex-1 flex flex-col min-h-0'>
      {/* Header with count */}
      <div className='flex items-center justify-between mb-2 flex-shrink-0'>
        <h3 className='text-xs font-semibold text-gray-700 uppercase tracking-wider'>
          Documents
        </h3>
        <span className='text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full'>
          {documents.length}
        </span>
      </div>

      {/* Scrollable Documents Container */}
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
        {/* Loading State */}
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
          /* Empty State */
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
          /* Document List */
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
              uploadedAt: doc.metadata.uploadedAt ?? '',
              sourceUrl: doc.sourceUrl,
              fileType: doc.fileType,
            };

            return (
              <DocumentCard
                key={doc.id}
                document={mappedDoc}
                onDelete={onDeleteDocument}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
