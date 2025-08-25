'use client';

import { FileText, Loader2 } from 'lucide-react';
import DocumentCard from '../DocumentCard';
import toast from 'react-hot-toast';
import { TempDocument, ExtendedDocument } from './types';


/**
 * Props for the DocumentList component
 */
interface DocumentListProps {
  /** Array of documents to display */
  documents: (ExtendedDocument | TempDocument)[];
  /** Whether the component is loading */
  isLoading: boolean;
  /** Callback when a document is deleted */
  onDeleteDocument: (id: string) => void;
  /** Function to update documents state (for temp document removal) */
  setDocuments?: React.Dispatch<React.SetStateAction<(ExtendedDocument | TempDocument)[]>>;
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
  setDocuments,
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
      {/* Scrollable Documents Container */}
      <div
        className={`
        flex-1 overflow-y-auto space-y-1.5 min-h-0 pb-1
        ${
          documents.length > 4
            ? 'scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent'
            : ''
        }
        scrollbar-thumb-rounded-full scrollbar-track-rounded-full
      `}
        style={{
          scrollbarWidth: documents.length > 4 ? 'thin' : 'none',
          scrollbarColor:
            documents.length > 4
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
            // Handle both temporary documents and real documents
            const isTemp = doc.id.startsWith('temp-');
            
            const tempDoc = isTemp ? doc as TempDocument : null;
            const extDoc = !isTemp ? doc as ExtendedDocument : null;

            const mappedDoc = {
              id: doc.id,
              name: doc.name,
              type: tempDoc 
                ? tempDoc.type  // Temp documents have type directly
                : extDoc?.metadata?.type === 'video/youtube'
                  ? ('youtube' as const)
                  : extDoc?.metadata?.type === 'text/html'
                  ? ('website' as const)
                  : ('file' as const),
              size: tempDoc 
                ? tempDoc.size  // Temp documents have size as string
                : formatFileSize(extDoc?.metadata?.size || 0),
              status: doc.status,
              chunksCount: tempDoc 
                ? tempDoc.chunksCount || 0
                : extDoc?.metadata?.chunksCount || 0,
              uploadedAt: tempDoc 
                ? tempDoc.uploadedAt || ''
                : extDoc?.metadata?.uploadedAt ?? '',
              sourceUrl: tempDoc 
                ? tempDoc.sourceUrl
                : extDoc?.sourceUrl,
              fileType: tempDoc 
                ? tempDoc.fileType
                : extDoc?.fileType,
            };

            return (
              <DocumentCard
                key={doc.id}
                document={mappedDoc}
                onDelete={async (id: string) => {
                  if (isTemp && setDocuments) {
                    // For temp documents, just remove from state
                    setDocuments(prev => prev.filter(doc => doc.id !== id));
                    toast.success('Upload cancelled');
                  } else {
                    // For real documents, use the proper delete function
                    await onDeleteDocument(id);
                  }
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
