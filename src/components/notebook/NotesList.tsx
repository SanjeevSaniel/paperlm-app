'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Note, NoteHandlers } from './types';
import NoteCard from './NoteCard';
import NotesEmptyState from './NotesEmptyState';

/**
 * Props for the NotesList component
 */
interface NotesListProps {
  /** Array of notes to display */
  notes: Note[];
  /** Whether the component is loading */
  isLoading: boolean;
  /** Whether documents are available */
  hasDocuments: boolean;
  /** Whether filters are active */
  hasActiveFilters: boolean;
  /** Note action handlers */
  handlers: NoteHandlers;
  /** Callback to create a new note */
  onCreateNote: () => void;
  /** Callback to clear filters */
  onClearFilters?: () => void;
}

/**
 * NotesList displays a list of notes with loading and empty states
 * 
 * Features:
 * - Animated note cards with staggered entrance
 * - Loading state with spinner
 * - Multiple empty states (no documents, no notes, filtered results)
 * - Scrollable list with custom scrollbars
 * - Responsive grid layout
 * 
 * @param props - The component props
 * @returns JSX element representing the notes list
 */
export default function NotesList({
  notes,
  isLoading,
  hasDocuments,
  hasActiveFilters,
  handlers,
  onCreateNote,
  onClearFilters,
}: NotesListProps) {
  
  // Loading state
  if (isLoading) {
    return (
      <div className='flex-1 flex items-center justify-center py-12'>
        <div className='text-center'>
          <div className='w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3'>
            <Loader2 className='w-6 h-6 text-gray-400 animate-spin' />
          </div>
          <p className='text-sm font-medium text-gray-500 mb-1'>
            Loading notes...
          </p>
          <p className='text-xs text-gray-400'>
            Please wait while we fetch your notes
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (notes.length === 0) {
    return (
      <div className='flex-1 flex items-center justify-center'>
        <NotesEmptyState
          hasDocuments={hasDocuments}
          hasActiveFilters={hasActiveFilters}
          onCreateNote={onCreateNote}
          onClearFilters={onClearFilters}
        />
      </div>
    );
  }

  return (
    <div className='flex-1 min-h-0'>
      {/* Notes Grid */}
      <div 
        className='h-full overflow-y-auto pb-4 pr-1'
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(148, 163, 184, 0.3) transparent',
        }}>
        <style jsx>{`
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-track {
            background: transparent;
            margin: 4px 0;
          }
          div::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.3);
            border-radius: 10px;
            transition: all 0.2s ease;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.6);
          }
          div::-webkit-scrollbar-corner {
            background: transparent;
          }
        `}</style>
        
        <motion.div
          className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4'
          layout>
          <AnimatePresence mode='popLayout'>
            {notes.map((note, index) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { 
                    delay: index * 0.05,
                    duration: 0.2 
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.8,
                  transition: { duration: 0.15 }
                }}
                className='h-fit'>
                <NoteCard
                  note={note}
                  handlers={handlers}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}