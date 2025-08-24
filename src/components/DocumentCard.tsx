'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Hash,
  Trash2,
  Video,
  MoreVertical,
} from 'lucide-react';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

interface CompactDocumentCardProps {
  document: {
    id: string;
    name: string;
    type: 'file' | 'website' | 'youtube';
    size?: string;
    status: 'uploading' | 'processing' | 'ready' | 'error';
    chunksCount?: number;
    uploadedAt: Date | string; // Allow both Date and string types
    sourceUrl?: string;
    fileType?: string;
  };
  onDelete?: (id: string) => Promise<void>;
}

const DocumentCard = ({ document, onDelete }: CompactDocumentCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
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

  const getTypeConfig = () => {
    switch (document.type) {
      case 'website':
        return {
          icon: 'text-emerald-600',
          bg: 'bg-emerald-50',
          border: 'border-emerald-100',
          badge: 'bg-emerald-100 text-emerald-700',
          label: 'Website'
        };
      case 'youtube':
        return {
          icon: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-100', 
          badge: 'bg-red-100 text-red-700',
          label: 'Video'
        };
      default:
        return {
          icon: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-100',
          badge: 'bg-blue-100 text-blue-700',
          label: 'Document'
        };
    }
  };

  const formatSize = (size: string | undefined) => {
    if (!size) return '';
    return size.replace('Bytes', 'B').replace('KB', 'K').replace('MB', 'M').replace('GB', 'G');
  };

  const formatTimeAgo = (date: Date | string) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'unknown';

      const now = new Date();
      const diff = now.getTime() - dateObj.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (minutes < 1) return 'now';
      if (minutes < 60) return `${minutes}m`;
      if (hours < 24) return `${hours}h`;
      if (days < 7) return `${days}d`;
      return `${Math.floor(days / 7)}w`;
    } catch (error) {
      return 'unknown';
    }
  };

  const Icon = getIcon();
  const typeConfig = getTypeConfig();
  const isProcessing = document.status === 'processing' || document.status === 'uploading';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className='group relative'
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}>
      
      {/* Compact Card Container */}
      <div
        className={cn(
          'relative w-full bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-200 overflow-hidden',
          isProcessing && 'ring-2 ring-blue-100 border-blue-200',
          document.status === 'error' && 'ring-2 ring-red-100 border-red-200'
        )}>
        
        {/* Processing Animation Bar */}
        {isProcessing && (
          <motion.div
            className='absolute top-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500'
            initial={{ width: '0%' }}
            animate={{ width: ['0%', '100%', '0%'] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Well-Structured Layout */}
        <div className='p-4'>
          {/* Header Row */}
          <div className='flex items-start justify-between gap-3 mb-3'>
            {/* Left: Icon + Type + Status */}
            <div className='flex items-center gap-2.5'>
              <motion.div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  typeConfig.bg,
                  typeConfig.border,
                  'border shadow-sm'
                )}
                animate={isProcessing ? { 
                  scale: [1, 1.03, 1],
                  rotate: [0, 1, -1, 0] 
                } : {}}
                transition={{
                  duration: 2.5,
                  repeat: isProcessing ? Infinity : 0,
                  ease: 'easeInOut',
                }}>
                <Icon className={cn('w-5 h-5', typeConfig.icon)} />
              </motion.div>
              
              <div className='flex flex-col gap-1'>
                <span className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold',
                  typeConfig.badge
                )}>
                  {typeConfig.label}
                </span>
                
                <span
                  className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full font-medium w-fit',
                    document.status === 'ready' && 'bg-emerald-100 text-emerald-700',
                    document.status === 'processing' && 'bg-blue-100 text-blue-700',
                    document.status === 'uploading' && 'bg-orange-100 text-orange-700',
                    document.status === 'error' && 'bg-red-100 text-red-700',
                  )}>
                  {document.status === 'ready' && '✓ Ready'}
                  {document.status === 'processing' && '⚡ Processing'}
                  {document.status === 'uploading' && '📤 Uploading'}
                  {document.status === 'error' && '❌ Error'}
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className='flex items-center gap-1 flex-shrink-0'>
              <motion.div
                className='flex items-center gap-1'
                initial={{ opacity: 0, x: 8 }}
                animate={{ 
                  opacity: showActions ? 1 : 0,
                  x: showActions ? 0 : 8
                }}
                transition={{ duration: 0.2 }}>
                
                {document.sourceUrl && (
                  <motion.button
                    className='w-8 h-8 rounded-lg hover:bg-blue-50 flex items-center justify-center transition-colors group/btn border border-transparent hover:border-blue-200'
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(document.sourceUrl, '_blank');
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title='Open source'>
                    <ExternalLink className='w-4 h-4 text-gray-400 group-hover/btn:text-blue-600' />
                  </motion.button>
                )}

                {onDelete && (
                  <motion.button
                    className='w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors group/btn border border-transparent hover:border-red-200'
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                    disabled={isDeleting}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title='Delete document'>
                    <Trash2 className='w-4 h-4 text-gray-400 group-hover/btn:text-red-600' />
                  </motion.button>
                )}
              </motion.div>
            </div>
          </div>

          {/* Document Name */}
          <div className='mb-3'>
            <h3 className='font-semibold text-base text-gray-900 line-clamp-2 leading-snug'>
              {document.name}
            </h3>
          </div>
          
          {/* Metadata Grid */}
          <div className='grid grid-cols-3 gap-4 text-xs text-gray-600'>
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-1.5 text-gray-400'>
                <div className='w-3 h-3 bg-gray-200 rounded-full flex items-center justify-center'>
                  <span className='text-[8px]'>📊</span>
                </div>
                <span className='font-medium'>Size</span>
              </div>
              <span className='font-semibold text-gray-700 ml-4'>
                {document.size ? formatSize(document.size) : 'Unknown'}
              </span>
            </div>
            
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-1.5 text-gray-400'>
                <Hash className='w-3 h-3' />
                <span className='font-medium'>Chunks</span>
              </div>
              <span className='font-semibold text-gray-700 ml-4'>
                {typeof document.chunksCount === 'number' ? document.chunksCount : 0}
              </span>
            </div>
            
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-1.5 text-gray-400'>
                <Clock className='w-3 h-3' />
                <span className='font-medium'>Added</span>
              </div>
              <span className='font-semibold text-gray-700 ml-4'>
                {formatTimeAgo(document.uploadedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Source URL Tooltip */}
        {document.sourceUrl && (
          <motion.div
            className='absolute -bottom-8 left-3 bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap max-w-xs truncate pointer-events-none z-20'
            initial={{ opacity: 0, y: -5 }}
            animate={{ 
              opacity: showActions ? 1 : 0,
              y: showActions ? 0 : -5
            }}
            transition={{ duration: 0.2 }}>
            {new URL(document.sourceUrl).hostname}
          </motion.div>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={async () => {
          if (onDelete) {
            setIsDeleting(true);
            try {
              await onDelete(document.id);
            } finally {
              setIsDeleting(false);
              setShowDeleteDialog(false);
            }
          }
        }}
        itemType="document"
        itemName={document.name}
        itemDetails={{
          type: document.fileType,
          size: document.size,
          uploadDate: new Date(document.uploadedAt).toLocaleDateString(),
          chunkCount: document.chunksCount
        }}
        isDeleting={isDeleting}
      />
    </motion.div>
  );
};

export default DocumentCard;
