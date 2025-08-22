'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import NewNoteDialog from '../NewNoteDialog';
import NoteEditDialog from '../NoteEditDialog';
import NotesFilter from '../notebook/NotesFilter';
import NotesList from '../notebook/NotesList';
import { useNotes } from '../notebook/useNotes';
import { Note } from '../notebook/types';

/**
 * SmartNotebookPanel manages notes with AI generation and organization
 * 
 * Features:
 * - AI-powered note generation from documents
 * - Manual note creation and editing
 * - Advanced filtering and search
 * - Multiple note types (summary, insight, quote)
 * - Tag-based organization
 * - Real-time updates
 * 
 * @returns JSX element representing the smart notebook panel
 */
export default function SmartNotebookPanel() {
  // Custom hook for notes management
  const {
    notes,
    documents,
    isLoading,
    isGenerating,
    hasDocuments,
    hasActiveFilters,
    availableTags,
    filters,
    setFilters,
    clearFilters,
    createNote,
    updateNote,
    deleteNote,
    generateAINotes,
  } = useNotes();

  // Dialog state
  const [isNewNoteDialogOpen, setIsNewNoteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  /**
   * Handle note creation (matches NewNoteDialog interface)
   */
  const handleCreateNote = async (note: {
    id: string;
    title: string;
    content: string;
    type: 'summary' | 'insight' | 'quote';
    createdAt: string;
    updatedAt: string;
  }) => {
    const success = await createNote({
      title: note.title,
      content: note.content,
      type: note.type,
    });
    if (success) {
      setIsNewNoteDialogOpen(false);
    }
  };

  /**
   * Handle note editing (matches NoteEditDialog interface)
   */
  const handleEditNote = async (note: {
    id: string;
    title: string;
    content: string;
    type: 'summary' | 'insight' | 'quote';
    createdAt: string;
    updatedAt: string;
  }) => {
    const success = await updateNote(note.id, {
      title: note.title,
      content: note.content,
      type: note.type,
    });
    if (success) {
      setIsEditDialogOpen(false);
      setIsViewDialogOpen(false);
      setSelectedNote(null);
    }
  };

  /**
   * Handle note deletion
   */
  const handleDeleteNote = async (noteId: string) => {
    const success = await deleteNote(noteId);
    if (success) {
      // Close any open dialogs if the deleted note was selected
      if (selectedNote?.id === noteId) {
        setIsEditDialogOpen(false);
        setIsViewDialogOpen(false);
        setSelectedNote(null);
      }
    }
  };

  /**
   * Note action handlers
   */
  const noteHandlers = {
    onEdit: (note: Note) => {
      setSelectedNote(note);
      setIsEditDialogOpen(true);
    },
    onDelete: handleDeleteNote,
    onView: (note: Note) => {
      setSelectedNote(note);
      setIsViewDialogOpen(true);
    },
  };

  return (
    <div className='h-full flex flex-col'>
      {/* Header */}
      <div className='px-4 py-3 border-b border-gray-100 bg-slate-50/30 flex-shrink-0'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm text-gray-600'>
              Your AI-powered smart notebook
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className='flex items-center gap-2'>
            {hasDocuments && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={generateAINotes}
                  disabled={isGenerating}
                  size='sm'
                  variant='outline'
                  className='flex items-center gap-2 text-xs'>
                  {isGenerating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Bot className='w-3.5 h-3.5' />
                    </motion.div>
                  ) : (
                    <Sparkles className='w-3.5 h-3.5' />
                  )}
                  {isGenerating ? 'Generating...' : 'AI Generate'}
                </Button>
              </motion.div>
            )}
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => setIsNewNoteDialogOpen(true)}
                size='sm'
                className='flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-700'>
                <Plus className='w-3.5 h-3.5' />
                New Note
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 flex flex-col px-4 py-4 min-h-0 gap-4'>
        {/* Filters */}
        <div className='flex-shrink-0'>
          <NotesFilter
            filters={filters}
            documents={documents}
            availableTags={availableTags}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Notes List */}
        <NotesList
          notes={notes}
          isLoading={isLoading}
          hasDocuments={hasDocuments}
          hasActiveFilters={hasActiveFilters}
          handlers={noteHandlers}
          onCreateNote={() => setIsNewNoteDialogOpen(true)}
          onClearFilters={clearFilters}
        />
      </div>

      {/* Dialogs */}
      <NewNoteDialog
        isOpen={isNewNoteDialogOpen}
        onClose={() => setIsNewNoteDialogOpen(false)}
        onSave={handleCreateNote}
      />

      {selectedNote && (
        <>
          <NoteEditDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedNote(null);
            }}
            onSave={handleEditNote}
            note={selectedNote}
          />

          <NoteEditDialog
            isOpen={isViewDialogOpen}
            onClose={() => {
              setIsViewDialogOpen(false);
              setSelectedNote(null);
            }}
            onSave={handleEditNote}
            note={selectedNote}
          />
        </>
      )}
    </div>
  );
}