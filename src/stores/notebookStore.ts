import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface NotebookNote {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  tags?: string[];
  metadata?: {
    wordCount: number;
    lastModified: Date;
  };
}

interface NotebookState {
  notes: NotebookNote[];
  selectedNoteId: string | null;
  isEditing: boolean;
}

interface NotebookActions {
  addNote: (note: Omit<NotebookNote, 'id' | 'timestamp'>) => void;
  updateNote: (id: string, updates: Partial<NotebookNote>) => void;
  deleteNote: (id: string) => void;
  setSelectedNote: (id: string | null) => void;
  setIsEditing: (editing: boolean) => void;
  clearNotes: () => void;
  syncToRemote: () => Promise<void>;
  loadFromRemote: (userId: string) => Promise<void>;
}

type NotebookStore = NotebookState & NotebookActions;

export const useNotebookStore = create<NotebookStore>()(
  persist(
    immer((set, get) => ({
      // State
      notes: [],
      selectedNoteId: null,
      isEditing: false,

      // Actions
      addNote: (noteData) =>
        set((state) => {
          const newNote: NotebookNote = {
            ...noteData,
            id: Date.now().toString(),
            timestamp: new Date(),
            metadata: {
              wordCount: noteData.content.split(/\s+/).length,
              lastModified: new Date(),
            },
          };
          state.notes.unshift(newNote);
          state.selectedNoteId = newNote.id;
        }),

      updateNote: (id, updates) =>
        set((state) => {
          const index = state.notes.findIndex((note) => note.id === id);
          if (index !== -1) {
            Object.assign(state.notes[index], updates);
            if (updates.content) {
              state.notes[index].metadata = {
                ...state.notes[index].metadata,
                wordCount: updates.content.split(/\s+/).length,
                lastModified: new Date(),
              };
            }
          }
        }),

      deleteNote: (id) =>
        set((state) => {
          state.notes = state.notes.filter((note) => note.id !== id);
          if (state.selectedNoteId === id) {
            state.selectedNoteId = null;
            state.isEditing = false;
          }
        }),

      setSelectedNote: (id) =>
        set((state) => {
          state.selectedNoteId = id;
          state.isEditing = false;
        }),

      setIsEditing: (editing) =>
        set((state) => {
          state.isEditing = editing;
        }),

      clearNotes: () =>
        set((state) => {
          state.notes = [];
          state.selectedNoteId = null;
          state.isEditing = false;
        }),

      // Sync functions for MongoDB integration
      syncToRemote: async () => {
        const { notes } = get();
        try {
          await fetch('/api/user/notebook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes }),
          });
        } catch (error) {
          console.error('Failed to sync notebook to remote:', error);
        }
      },

      loadFromRemote: async (userId) => {
        try {
          const response = await fetch(`/api/user/notebook?userId=${userId}`);
          if (response.ok) {
            const { notes } = await response.json();
            set((state) => {
              state.notes = notes;
              state.selectedNoteId = null;
              state.isEditing = false;
            });
          }
        } catch (error) {
          console.error('Failed to load notebook from remote:', error);
        }
      },
    })),
    {
      name: 'paperlm-notebook',
      storage: createJSONStorage(() => localStorage),
      // Don't persist selectedNoteId and isEditing states
      partialize: (state) => ({
        notes: state.notes,
      }),
    }
  )
);