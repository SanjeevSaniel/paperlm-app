'use client';

import { cn } from '@/lib/utils';
import { motion, useMotionTemplate } from 'framer-motion';
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
import { Button } from './ui/Button';

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

const CompactDocumentCard: React.FC<CompactDocumentCardProps> = ({
  document,
  onDelete,
}) => {
  // Motion values for animated gradient
  // const gradientX = useMotionValue(0);
  // const gradientY = useMotionValue(0);

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

  const getStatusColor = () => {
    switch (document.status) {
      case 'ready':
        return 'bg-emerald-500';
      case 'processing':
        return 'bg-blue-500';
      case 'uploading':
        return 'bg-amber-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
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

  // Animated gradient background when processing
  const animatedGradient = useMotionTemplate`
    linear-gradient(
      90deg,
      rgba(59, 130, 246, 0.1) 0%,
      rgba(147, 51, 234, 0.15) 25%,
      rgba(236, 72, 153, 0.1) 50%,
      rgba(59, 130, 246, 0.15) 75%,
      rgba(59, 130, 246, 0.1) 100%
    )
  `;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className='w-full group relative'>
      {/* Base card container */}
      <div className='relative w-full h-16 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden'>
        {/* Animated gradient overlay when processing */}
        {isProcessing && (
          <motion.div
            className='absolute inset-0 z-0'
            style={{
              background: animatedGradient,
            }}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}

        {/* Card content */}
        <div className='relative z-10 w-full h-full flex items-center px-4 gap-3'>
          {/* Left: Icon */}
          <motion.div
            className={cn(
              'flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center',
              document.type === 'website'
                ? 'bg-emerald-50'
                : document.type === 'youtube'
                ? 'bg-red-50'
                : 'bg-blue-50',
            )}
            animate={{
              scale: isProcessing ? [1, 1.1, 1] : 1,
              rotate: isProcessing ? [0, 5, -5, 0] : 0,
            }}
            transition={{
              duration: 2,
              repeat: isProcessing ? Infinity : 0,
              ease: 'easeInOut',
            }}>
            <Icon className={cn('w-4 h-4', getIconColor())} />
          </motion.div>

          {/* Center: Document info */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-center justify-between'>
              {/* Title and metadata */}
              <div className='min-w-0 flex-1'>
                <h3 className='font-medium text-sm text-gray-900 truncate mb-0.5'>
                  {document.name}
                </h3>
                <div className='flex items-center gap-2 text-xs text-gray-500'>
                  {document.size && <span>{formatSize(document.size)}</span>}

                  {document.chunksCount && (
                    <>
                      <span>•</span>
                      <span className='flex items-center gap-1'>
                        <Hash className='w-2.5 h-2.5' />
                        {document.chunksCount}
                      </span>
                    </>
                  )}

                  <span>•</span>
                  <span className='flex items-center gap-1'>
                    <Calendar className='w-2.5 h-2.5' />
                    {formatTimeAgo(document.uploadedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Status and actions */}
          <div className='flex items-center gap-2 flex-shrink-0'>
            {/* Status indicator */}
            <motion.div
              className={cn('w-2 h-2 rounded-full', getStatusColor())}
              animate={{
                scale: isProcessing ? [1, 1.5, 1] : 1,
                opacity: isProcessing ? [0.7, 1, 0.7] : 1,
              }}
              transition={{
                duration: 1.5,
                repeat: isProcessing ? Infinity : 0,
              }}
            />

            {/* Action buttons */}
            <div className='flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity'>
              {document.sourceUrl && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600'
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(document.sourceUrl, '_blank');
                  }}>
                  <ExternalLink className='w-3 h-3' />
                </Button>
              )}

              {onDelete && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600'
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete "${document.name}"?`)) {
                      onDelete(document.id);
                    }
                  }}>
                  <Trash2 className='w-3 h-3' />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Processing status text overlay */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className='absolute bottom-0 left-0 right-0 h-1 overflow-hidden'>
            <motion.div
              className={cn(
                'h-full w-1/3 rounded-full',
                document.status === 'processing'
                  ? 'bg-blue-500'
                  : 'bg-amber-500',
              )}
              animate={{
                x: ['-100%', '400%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </motion.div>
        )}

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

export default CompactDocumentCard;
