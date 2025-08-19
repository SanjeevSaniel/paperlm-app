import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  collapsedPanels: Set<string>;
  layout: {
    sourcesWidth: number;
    chatWidth: number;
  };
}

interface UserState {
  isLoggedIn: boolean;
  userId: string | null;
  preferences: UserPreferences;
  lastSync: Date | null;
}

interface UserActions {
  setUser: (userId: string) => void;
  clearUser: () => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  togglePanelCollapse: (panelId: string) => void;
  syncAllData: () => Promise<void>;
  loadAllData: () => Promise<void>;
  setLastSync: (date: Date) => void;
}

type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()(
  persist(
    immer((set, get) => ({
      // State
      isLoggedIn: false,
      userId: null,
      preferences: {
        theme: 'system',
        collapsedPanels: new Set(),
        layout: {
          sourcesWidth: 280,
          chatWidth: 380,
        },
      },
      lastSync: null,

      // Actions
      setUser: (userId) =>
        set((state) => {
          state.isLoggedIn = true;
          state.userId = userId;
        }),

      clearUser: () =>
        set((state) => {
          state.isLoggedIn = false;
          state.userId = null;
          state.lastSync = null;
        }),

      updatePreferences: (newPreferences) =>
        set((state) => {
          Object.assign(state.preferences, newPreferences);
        }),

      togglePanelCollapse: (panelId) =>
        set((state) => {
          if (state.preferences.collapsedPanels.has(panelId)) {
            state.preferences.collapsedPanels.delete(panelId);
          } else {
            state.preferences.collapsedPanels.add(panelId);
          }
        }),

      // Sync all user data to MongoDB
      syncAllData: async () => {
        const { userId } = get();
        if (!userId) return;

        try {
          // Import stores dynamically to avoid circular dependencies
          const { useDocumentStore } = await import('./documentStore');
          const { useChatStore } = await import('./chatStore');
          const { useNotebookStore } = await import('./notebookStore');

          // Sync all stores
          await Promise.all([
            useDocumentStore.getState().syncToRemote(),
            useChatStore.getState().syncToRemote(),
            useNotebookStore.getState().syncToRemote(),
          ]);

          set((state) => {
            state.lastSync = new Date();
          });
        } catch (error) {
          console.error('Failed to sync all data:', error);
        }
      },

      // Load all user data from MongoDB
      loadAllData: async () => {
        const { userId } = get();
        if (!userId) return;

        try {
          const { useDocumentStore } = await import('./documentStore');
          const { useChatStore } = await import('./chatStore');
          const { useNotebookStore } = await import('./notebookStore');

          // Load all stores
          await Promise.all([
            useDocumentStore.getState().loadFromRemote(userId),
            useChatStore.getState().loadFromRemote(userId),
            useNotebookStore.getState().loadFromRemote(userId),
          ]);

          set((state) => {
            state.lastSync = new Date();
          });
        } catch (error) {
          console.error('Failed to load all data:', error);
        }
      },

      setLastSync: (date) =>
        set((state) => {
          state.lastSync = date;
        }),
    })),
    {
      name: 'paperlm-user',
      storage: createJSONStorage(() => localStorage),
      // Custom serialization for Set objects
      serialize: (state) => {
        return JSON.stringify({
          ...state,
          state: {
            ...state.state,
            preferences: {
              ...state.state.preferences,
              collapsedPanels: Array.from(state.state.preferences.collapsedPanels),
            },
          },
        });
      },
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        return {
          ...parsed,
          state: {
            ...parsed.state,
            preferences: {
              ...parsed.state.preferences,
              collapsedPanels: new Set(parsed.state.preferences.collapsedPanels),
            },
          },
        };
      },
    }
  )
);