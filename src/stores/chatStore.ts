import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ChatMessage } from '@/types';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  showAnimation: boolean;
  inputValue: string;
}

interface ChatActions {
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setLoading: (loading: boolean) => void;
  setShowAnimation: (show: boolean) => void;
  setInputValue: (value: string) => void;
  clearMessages: () => void;
  syncToRemote: () => Promise<void>;
  loadFromRemote: (userId: string) => Promise<void>;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>()(
  persist(
    immer((set, get) => ({
      // State
      messages: [],
      isLoading: false,
      showAnimation: true,
      inputValue: '',

      // Actions
      addMessage: (message) =>
        set((state) => {
          state.messages.push(message);
          // Hide animation when messages are added
          if (state.showAnimation && state.messages.length > 0) {
            state.showAnimation = false;
          }
        }),

      updateMessage: (id, updates) =>
        set((state) => {
          const index = state.messages.findIndex((msg) => msg.id === id);
          if (index !== -1) {
            Object.assign(state.messages[index], updates);
          }
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setShowAnimation: (show) =>
        set((state) => {
          state.showAnimation = show;
        }),

      setInputValue: (value) =>
        set((state) => {
          state.inputValue = value;
        }),

      clearMessages: () =>
        set((state) => {
          state.messages = [];
          state.showAnimation = true;
          state.inputValue = '';
          state.isLoading = false;
        }),

      // Sync functions for MongoDB integration
      syncToRemote: async () => {
        const { messages } = get();
        try {
          await fetch('/api/user/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages }),
          });
        } catch (error) {
          console.error('Failed to sync chat to remote:', error);
        }
      },

      loadFromRemote: async (userId) => {
        try {
          const response = await fetch(`/api/user/chat?userId=${userId}`);
          if (response.ok) {
            const { messages } = await response.json();
            set((state) => {
              state.messages = messages;
              state.showAnimation = messages.length === 0;
            });
          }
        } catch (error) {
          console.error('Failed to load chat from remote:', error);
        }
      },
    })),
    {
      name: 'paperlm-chat',
      storage: createJSONStorage(() => localStorage),
      // Don't persist inputValue and isLoading
      partialize: (state) => ({
        messages: state.messages,
        showAnimation: state.showAnimation,
      }),
    }
  )
);