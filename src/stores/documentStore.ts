import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Document } from '@/types';

interface DocumentState {
  documents: Document[];
  hasDocuments: boolean;
  documentCount: number;
}

interface DocumentActions {
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  removeDocument: (id: string) => void;
  setDocuments: (documents: Document[]) => void;
  clearDocuments: () => void;
  syncToRemote: () => Promise<void>;
  loadFromRemote: (userId: string) => Promise<void>;
}

type DocumentStore = DocumentState & DocumentActions;

// Create the store with persistence
export const useDocumentStore = create<DocumentStore>()(
  persist(
    immer((set, get) => ({
      // State
      documents: [],
      hasDocuments: false,
      documentCount: 0,

      // Actions
      addDocument: (document) =>
        set((state) => {
          state.documents.push(document);
          state.hasDocuments = state.documents.length > 0;
          state.documentCount = state.documents.length;
        }),

      updateDocument: (id, updates) =>
        set((state) => {
          const index = state.documents.findIndex((doc) => doc.id === id);
          if (index !== -1) {
            Object.assign(state.documents[index], updates);
          }
        }),

      removeDocument: (id) =>
        set((state) => {
          state.documents = state.documents.filter((doc) => doc.id !== id);
          state.hasDocuments = state.documents.length > 0;
          state.documentCount = state.documents.length;
        }),

      setDocuments: (documents) =>
        set((state) => {
          state.documents = documents;
          state.hasDocuments = documents.length > 0;
          state.documentCount = documents.length;
        }),

      clearDocuments: () =>
        set((state) => {
          state.documents = [];
          state.hasDocuments = false;
          state.documentCount = 0;
        }),

      // Sync functions for MongoDB integration
      syncToRemote: async () => {
        const { documents } = get();
        try {
          await fetch('/api/user/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documents }),
          });
        } catch (error) {
          console.error('Failed to sync documents to remote:', error);
        }
      },

      loadFromRemote: async (userId) => {
        try {
          const response = await fetch(`/api/user/documents?userId=${userId}`);
          if (response.ok) {
            const { documents } = await response.json();
            set((state) => {
              state.documents = documents;
              state.hasDocuments = documents.length > 0;
              state.documentCount = documents.length;
            });
          }
        } catch (error) {
          console.error('Failed to load documents from remote:', error);
        }
      },
    })),
    {
      name: 'paperlm-documents',
      storage: createJSONStorage(() => localStorage),
      // Only persist for session users, logged-in users use MongoDB
      skipHydration: false,
    }
  )
);