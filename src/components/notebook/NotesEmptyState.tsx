'use client';

import { motion } from 'framer-motion';
import { FileText, Plus, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Props for the NotesEmptyState component
 */
interface NotesEmptyStateProps {
  /** Whether documents are available */
  hasDocuments: boolean;
  /** Whether filters are active */
  hasActiveFilters: boolean;
  /** Callback to create a new note */
  onCreateNote: () => void;
  /** Callback to clear filters */
  onClearFilters?: () => void;
}

/**
 * NotesEmptyState displays appropriate empty states for the notes panel
 * 
 * Features:
 * - Different states for no documents vs no notes
 * - Filtered results empty state
 * - Call-to-action buttons
 * - Animated illustrations
 * 
 * @param props - The component props
 * @returns JSX element representing the empty state
 */
export default function NotesEmptyState({
  hasDocuments,
  hasActiveFilters,
  onCreateNote,
  onClearFilters,
}: NotesEmptyStateProps) {
  
  // No documents available
  if (!hasDocuments) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center py-12'>
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className='w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4'>
          <FileText className='w-8 h-8 text-gray-400' />
        </motion.div>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
          No Documents Yet
        </h3>
        <p className='text-sm text-gray-600 mb-4 max-w-sm mx-auto'>
          Upload documents first to start creating smart notes, summaries, and insights.
        </p>
        <div className='px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium inline-block'>
          📚 Upload documents to get started
        </div>
      </motion.div>
    );
  }

  // Active filters but no results
  if (hasActiveFilters) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center py-12'>
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className='w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-4'>
          <Search className='w-8 h-8 text-orange-500' />
        </motion.div>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
          No Notes Found
        </h3>
        <p className='text-sm text-gray-600 mb-4 max-w-sm mx-auto'>
          No notes match your current filters. Try adjusting your search criteria or clear filters.
        </p>
        <div className='flex flex-col sm:flex-row gap-2 justify-center'>
          {onClearFilters && (
            <Button
              onClick={onClearFilters}
              variant='outline'
              size='sm'
              className='text-sm'>
              Clear Filters
            </Button>
          )}
          <Button
            onClick={onCreateNote}
            size='sm'
            className='text-sm bg-blue-600 hover:bg-blue-700'>
            <Plus className='w-4 h-4 mr-1' />
            Create Note
          </Button>
        </div>
      </motion.div>
    );
  }

  // No notes created yet
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='text-center py-12'>
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, -5, 5, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className='w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4'>
        <Sparkles className='w-8 h-8 text-purple-600' />
      </motion.div>
      <h3 className='text-lg font-semibold text-gray-900 mb-2'>
        Start Your Smart Notebook
      </h3>
      <p className='text-sm text-gray-600 mb-4 max-w-sm mx-auto'>
        Create your first note! Organize insights, summarize content, and capture important quotes.
      </p>
      <Button
        onClick={onCreateNote}
        size='sm'
        className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'>
        <Plus className='w-4 h-4 mr-2' />
        Create Your First Note
      </Button>
      <div className='mt-4 flex justify-center gap-2'>
        <div className='px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium'>
          📖 Summaries
        </div>
        <div className='px-2 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-medium'>
          💡 Insights
        </div>
        <div className='px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium'>
          💬 Quotes
        </div>
      </div>
    </motion.div>
  );
}