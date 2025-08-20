'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Calendar,
  ExternalLink,
  FileText,
  Globe,
  Hash,
  Trash2,
  Video,
} from 'lucide-react';
import React from 'react';

interface CompactDocumentCardProps {
  document: {
    id: string;
    name: string;
    type: 'file' | 'website' | 'youtube';
    size?: string;
    status: 'uploading' | 'processing' | 'ready' | 'error';
    chunksCount?: number;
    uploadedAt: Date;
    sourceUrl?: string;
    fileType?: string;
  };
  onDelete?: (id: string) => void;
}

const DocumentCard = ({
  document,
  onDelete,
}: CompactDocumentCardProps) => {
  const getIcon = () => {
    switch (document.type) {
      case 'website':
        return Globe;
      case 'youtube':
        return Video;
      default:
        return FileText;
    }
  };

  const getIconColor = () => {
    switch (document.type) {
      case 'website':
        return 'text-emerald-500';
      case 'youtube':
        return 'text-red-500';
      default:
        return 'text-blue-500';
    }
  };

  const formatSize = (size: string | undefined) => {
    if (!size) return '';
    return size.replace('Bytes', 'B').replace('KB', 'K').replace('MB', 'M');
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'now';
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const Icon = getIcon();
  const isProcessing =
    document.status === 'processing' || document.status === 'uploading';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className='w-full group relative'>
      {/* Base card container */}
      <div
        className={cn(
          'relative w-full bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden',
          isProcessing
            ? 'border-2 border-transparent'
            : 'border border-gray-200 hover:border-gray-300',
        )}>
        {/* Animated border when processing */}
        {isProcessing && (
          <motion.div
            className='absolute inset-0 rounded-lg overflow-hidden'
            style={{
              background:
                document.status === 'processing'
                  ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.5), rgba(147, 51, 234, 0.5), rgba(236, 72, 153, 0.5), rgba(59, 130, 246, 0.5))'
                  : 'linear-gradient(90deg, rgba(245, 158, 11, 0.5), rgba(239, 68, 68, 0.5), rgba(245, 158, 11, 0.5), rgba(239, 68, 68, 0.5))',
              backgroundSize: '300% 100%',
            }}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}

        {/* Inner content background */}
        <div
          className={cn(
            'absolute inset-0 bg-white rounded-lg',
            isProcessing ? 'm-0.5' : 'm-0',
          )}
        />

        {/* Card content - Better aligned layout with smaller icons */}
        <div className='relative z-10 w-full overflow-hidden'>
          {/* Header section */}
          <div className='px-4 py-2.5 border-b border-gray-100'>
            <div className='flex items-center justify-between gap-3'>
              {/* Left: Icon and type - Made icon container smaller */}
              <div className='flex items-center gap-2.5'>
                <motion.div
                  className={cn(
                    'w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0',
                    document.type === 'website'
                      ? 'bg-emerald-50 border border-emerald-200'
                      : document.type === 'youtube'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-blue-50 border border-blue-200',
                  )}
                  animate={{
                    scale: isProcessing ? [1, 1.02, 1] : 1,
                    rotate: isProcessing ? [0, 1, -1, 0] : 0,
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: isProcessing ? Infinity : 0,
                    ease: 'easeInOut',
                  }}>
                  {/* Reduced main icon size from w-4 h-4 to w-3.5 h-3.5 */}
                  <Icon className={cn('w-3.5 h-3.5', getIconColor())} />
                </motion.div>

                {/* Document type badge */}
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium tracking-wide whitespace-nowrap',
                    document.type === 'youtube' && 'bg-red-100 text-red-700',
                    document.type === 'website' &&
                      'bg-emerald-100 text-emerald-700',
                    document.type === 'file' && 'bg-blue-100 text-blue-700',
                  )}>
                  {document.type === 'youtube' && 'Video'}
                  {document.type === 'website' && 'Website'}
                  {document.type === 'file' && 'Document'}
                </span>
              </div>

              {/* Right: Status and actions */}
              <div className='flex items-center gap-2'>
                <span
                  className={cn(
                    'text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap',
                    document.status === 'ready' &&
                      'bg-emerald-100 text-emerald-700',
                    document.status === 'processing' &&
                      'bg-blue-100 text-blue-700',
                    document.status === 'uploading' &&
                      'bg-amber-100 text-amber-700',
                    document.status === 'error' && 'bg-red-100 text-red-700',
                  )}>
                  {document.status === 'ready' && '✓ Ready'}
                  {document.status === 'processing' && '⚡ Processing'}
                  {document.status === 'uploading' && '📤 Uploading'}
                  {document.status === 'error' && '❌ Error'}
                </span>

                {/* Action buttons - Made containers and icons smaller */}
                <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                  {document.sourceUrl && (
                    <motion.button
                      className='h-6 w-6 rounded-md hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-colors'
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(document.sourceUrl, '_blank');
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title='Open source'>
                      {/* Reduced action icon size from w-4 h-4 to w-3.5 h-3.5 */}
                      <ExternalLink className='w-3.5 h-3.5' />
                    </motion.button>
                  )}

                  {onDelete && (
                    <motion.button
                      className='h-6 w-6 rounded-md hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors'
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${document.name}"?`)) {
                          onDelete(document.id);
                        }
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title='Delete document'>
                      {/* Reduced action icon size from w-4 h-4 to w-3.5 h-3.5 */}
                      <Trash2 className='w-3.5 h-3.5' />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content section */}
          <div className='px-4 py-3'>
            {/* Document title */}
            <h3 className='font-semibold text-sm text-gray-900 mb-2 line-clamp-1 leading-tight'>
              {document.name}
            </h3>

            {/* Metadata row with smaller icons */}
            <div className='flex items-center justify-between text-xs text-gray-500'>
              <div className='flex items-center gap-3'>
                {/* File size */}
                {document.size && (
                  <div className='flex items-center gap-1'>
                    <div className='w-3 h-3 rounded bg-gray-100 flex items-center justify-center'>
                      <span className='text-[8px]'>📊</span>
                    </div>
                    <span className='font-medium'>
                      {formatSize(document.size)}
                    </span>
                  </div>
                )}

                {/* Chunks count - Made Hash icon smaller */}
                {typeof document.chunksCount === 'number' && (
                  <div className='flex items-center gap-1'>
                    <Hash className='w-2.5 h-2.5 text-gray-400' />
                    <span className='font-medium'>{document.chunksCount}</span>
                  </div>
                )}

                {/* File type */}
                {document.fileType && (
                  <div className='flex items-center gap-1'>
                    <div className='w-3 h-3 rounded bg-gray-100 flex items-center justify-center'>
                      <span className='text-[8px]'>🏷️</span>
                    </div>
                    <span className='uppercase font-medium text-[11px]'>
                      {document.fileType.split('/')[1] || document.fileType}
                    </span>
                  </div>
                )}
              </div>

              {/* Upload date - Made Calendar icon smaller */}
              <div className='flex items-center gap-1'>
                <Calendar className='w-2.5 h-2.5 text-gray-400' />
                <span className='font-medium'>
                  {formatTimeAgo(document.uploadedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Source URL tooltip for web content */}
        {document.sourceUrl && (
          <div className='absolute -bottom-8 left-4 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none'>
            <div className='bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap max-w-xs truncate'>
              {new URL(document.sourceUrl).hostname}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DocumentCard;
