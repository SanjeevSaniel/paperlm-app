'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { useDocumentContext } from '@/contexts/DocumentContext';
import { useNotebookContext } from '@/contexts/NotebookContext';
import { getSessionId } from '@/lib/sessionStorage';
import { Note, Document, FilterState, NoteTypeFilter } from './types';

/**
 * Custom hook for managing notes
 * 
 * Features:
 * - Load notes from API
 * - Create, edit, and delete notes
 * - Filter and search notes
 * - Auto-save functionality
 * - Real-time note generation
 * - Context integration
 * 
 * @returns Object containing notes state and handlers
 */
export function useNotes() {
  const { user } = useUser();
  const { hasDocuments } = useDocumentContext();
  const { refreshTrigger } = useNotebookContext();

  // State management
  const [notes, setNotes] = useState<Note[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedType: 'all' as NoteTypeFilter,
    selectedDocument: '',
    selectedTag: '',
  });

  /**
   * Load notes from API
   */
  const loadNotesFromAPI = useCallback(async () => {
    try {
      const sessionId = getSessionId();
      if (!sessionId) {
        setNotes([]);
        return;
      }

      const notesResponse = await fetch(`/api/notes?sessionId=${sessionId}`);
      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        const apiNotes: Note[] = notesData.notes.map((note: {
          id: string;
          title: string;
          content: string;
          userId: string;
          createdAt: string;
          updatedAt: string;
          metadata?: {
            type?: string;
            sourceDocumentId?: string;
            sourceUrl?: string;
            tags?: string[];
          };
        }) => ({
          id: note.id,
          title: note.title,
          content: note.content,
          userId: note.userId,
          timestamp: new Date(note.createdAt).getTime(),
          type: note.metadata?.type || 'insight',
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          sourceDocumentId: note.metadata?.sourceDocumentId,
          sourceUrl: note.metadata?.sourceUrl,
          tags: note.metadata?.tags || [],
        }));
        setNotes(apiNotes);
      }
    } catch (error) {
      console.error('Failed to load notes from API:', error);
    }
  }, []);

  /**
   * Load documents from API
   */
  const loadDocuments = useCallback(async () => {
    try {
      const sessionId = getSessionId();
      if (!sessionId) return;

      const response = await fetch(`/api/documents?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  }, []);

  /**
   * Initial data loading
   */
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadNotesFromAPI(), loadDocuments()]);
      setIsLoading(false);
    };

    loadData();
  }, [loadNotesFromAPI, loadDocuments]);

  /**
   * Handle context refresh triggers
   */
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadNotesFromAPI();
    }
  }, [refreshTrigger, loadNotesFromAPI]);

  /**
   * Create a new note
   */
  const createNote = useCallback(async (noteData: {
    title: string;
    content: string;
    type: 'summary' | 'insight' | 'quote';
    sourceDocumentId?: string;
    tags?: string[];
  }) => {
    try {
      const sessionId = getSessionId();
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noteData.title,
          content: noteData.content,
          sessionId,
          userEmail: user?.primaryEmailAddress?.emailAddress,
          metadata: {
            type: noteData.type,
            sourceDocumentId: noteData.sourceDocumentId,
            tags: noteData.tags || [],
          },
        }),
      });

      if (response.ok) {
        await loadNotesFromAPI();
        toast.success('Note created successfully!');
        return true;
      } else {
        throw new Error('Failed to create note');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
      return false;
    }
  }, [user, loadNotesFromAPI]);

  /**
   * Update an existing note
   */
  const updateNote = useCallback(async (noteId: string, updates: {
    title?: string;
    content?: string;
    type?: 'summary' | 'insight' | 'quote';
    tags?: string[];
  }) => {
    try {
      const sessionId = getSessionId();
      const response = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId,
          sessionId,
          updates: {
            title: updates.title,
            content: updates.content,
            metadata: {
              type: updates.type,
              tags: updates.tags,
            },
          },
        }),
      });

      if (response.ok) {
        await loadNotesFromAPI();
        toast.success('Note updated successfully!');
        return true;
      } else {
        throw new Error('Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
      return false;
    }
  }, [loadNotesFromAPI]);

  /**
   * Delete a note
   */
  const deleteNote = useCallback(async (noteId: string) => {
    try {
      const sessionId = getSessionId();
      const response = await fetch(`/api/notes?noteId=${noteId}&sessionId=${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadNotesFromAPI();
        toast.success('Note deleted successfully!');
        return true;
      } else {
        throw new Error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
      return false;
    }
  }, [loadNotesFromAPI]);

  /**
   * Generate AI notes for all documents
   */
  const generateAINotes = useCallback(async () => {
    if (!hasDocuments || isGenerating) return;

    setIsGenerating(true);
    const loadingToast = toast.loading('Generating AI notes...');

    try {
      const sessionId = getSessionId();
      const response = await fetch('/api/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userEmail: user?.primaryEmailAddress?.emailAddress,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        await loadNotesFromAPI();
        
        toast.dismiss(loadingToast);
        toast.success(`Generated ${result.notesCreated || 0} AI notes!`, {
          duration: 4000,
          icon: '🤖',
        });
      } else {
        throw new Error('Failed to generate notes');
      }
    } catch (error) {
      console.error('Error generating AI notes:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to generate AI notes');
    } finally {
      setIsGenerating(false);
    }
  }, [hasDocuments, isGenerating, user, loadNotesFromAPI]);

  /**
   * Filter and search notes
   */
  const filteredNotes = useMemo(() => {
    let filtered = [...notes];

    // Text search
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(searchLower) ||
          note.content.toLowerCase().includes(searchLower) ||
          note.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Type filter
    if (filters.selectedType !== 'all') {
      filtered = filtered.filter((note) => note.type === filters.selectedType);
    }

    // Document filter
    if (filters.selectedDocument) {
      filtered = filtered.filter((note) => note.sourceDocumentId === filters.selectedDocument);
    }

    // Tag filter
    if (filters.selectedTag) {
      filtered = filtered.filter((note) => 
        note.tags?.includes(filters.selectedTag)
      );
    }

    // Sort by creation date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notes, filters]);

  /**
   * Get all available tags
   */
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => {
      note.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [notes]);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      selectedType: 'all',
      selectedDocument: '',
      selectedTag: '',
    });
  }, []);

  /**
   * Check if filters are active
   */
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.searchTerm ||
      filters.selectedType !== 'all' ||
      filters.selectedDocument ||
      filters.selectedTag
    );
  }, [filters]);

  return {
    // State
    notes: filteredNotes,
    documents,
    isLoading,
    isGenerating,
    hasDocuments,
    hasActiveFilters,
    availableTags,
    
    // Filters
    filters,
    setFilters,
    clearFilters,
    
    // Actions
    createNote,
    updateNote,
    deleteNote,
    generateAINotes,
    refreshNotes: loadNotesFromAPI,
  };
}