'use client';

import { Plus } from 'lucide-react';
import FileUploadDialog from '../FileUploadDialog';

/**
 * Props for the DocumentUploadArea component
 */
interface DocumentUploadAreaProps {
  /** Callback when files are uploaded */
  onFileUpload: (files: FileList) => void;
  /** Callback when text is submitted */
  onTextSubmit: (text: string) => void;
  /** Callback when URL is submitted */
  onUrlSubmit: (url: string, type: 'youtube' | 'website') => void;
}

/**
 * DocumentUploadArea provides an interface for uploading content
 * 
 * Features:
 * - File upload through drag & drop or selection
 * - Text input for direct content
 * - URL scraping for websites and YouTube videos
 * - Visual feedback and hover states
 * 
 * @param props - The component props
 * @returns JSX element representing the upload area
 */
export default function DocumentUploadArea({
  onFileUpload,
  onTextSubmit,
  onUrlSubmit,
}: DocumentUploadAreaProps) {
  return (
    <div className='mb-3 flex-shrink-0'>
      <FileUploadDialog
        onFileUpload={onFileUpload}
        onTextSubmit={onTextSubmit}
        onUrlSubmit={onUrlSubmit}>
        <button className='w-full flex items-center gap-3 p-3 border-2 border-dashed border-blue-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200 group'>
          <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors'>
            <Plus className='w-4 h-4 text-blue-600' />
          </div>
          <div className='text-left'>
            <p className='text-sm font-semibold text-gray-900'>Add Content</p>
            <p className='text-xs text-gray-500'>
              Upload files, paste text, add URLs
            </p>
          </div>
        </button>
      </FileUploadDialog>
    </div>
  );
}