/**
 * Simplified session storage using stores instead of localStorage
 * Provides compatibility with existing components during transition
 */

import { ChatMessage } from '@/types';

export interface NotebookNote {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  userId: string;
}

/**
 * Get current session ID - using user ID for simplicity
 */
export function getSessionId(): string | null {
  // This will be set by the chat store or auth store
  return typeof window !== 'undefined' ? localStorage.getItem('currentSessionId') : null;
}

/**
 * Get session data - simplified version
 */
export function getSessionData(): {
  messages: ChatMessage[];
  notes: NotebookNote[];
} {
  const sessionId = getSessionId();
  if (!sessionId) {
    return { messages: [], notes: [] };
  }

  try {
    const messagesKey = `chat_messages_${sessionId}`;
    const notesKey = `notebook_notes_${sessionId}`;
    
    const messages = typeof window !== 'undefined' ? 
      JSON.parse(localStorage.getItem(messagesKey) || '[]') : [];
    const notes = typeof window !== 'undefined' ? 
      JSON.parse(localStorage.getItem(notesKey) || '[]') : [];

    return { messages, notes };
  } catch (error) {
    console.error('Error getting session data:', error);
    return { messages: [], notes: [] };
  }
}

/**
 * Update chat messages for current session
 */
export function updateSessionChatMessages(messages: ChatMessage[]): void {
  const sessionId = getSessionId();
  if (!sessionId || typeof window === 'undefined') return;

  try {
    const messagesKey = `chat_messages_${sessionId}`;
    localStorage.setItem(messagesKey, JSON.stringify(messages));
  } catch (error) {
    console.error('Error updating chat messages:', error);
  }
}

/**
 * Update notebook notes for current session
 */
export function updateSessionNotebookNotes(notes: NotebookNote[]): void {
  const sessionId = getSessionId();
  if (!sessionId || typeof window === 'undefined') return;

  try {
    const notesKey = `notebook_notes_${sessionId}`;
    localStorage.setItem(notesKey, JSON.stringify(notes));
  } catch (error) {
    console.error('Error updating notebook notes:', error);
  }
}

/**
 * Set current session ID
 */
export function setSessionId(sessionId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentSessionId', sessionId);
  }
}

/**
 * Update session documents - compatibility function
 */
export function updateSessionDocuments(documents: any[]): void {
  const sessionId = getSessionId();
  if (!sessionId || typeof window === 'undefined') return;

  try {
    const documentsKey = `session_documents_${sessionId}`;
    localStorage.setItem(documentsKey, JSON.stringify(documents));
  } catch (error) {
    console.error('Error updating session documents:', error);
  }
}

/**
 * Update user auth - compatibility function (now handled by auth store)
 */
export function updateUserAuth(userId: string, email: string): void {
  // Set session ID to user ID for simplicity
  setSessionId(userId);
  console.log('User auth updated:', { userId, email });
}