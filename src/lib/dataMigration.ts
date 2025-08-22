/**
 * Data Migration Utility for PaperLM
 * Migrates existing localStorage data to NeonDB
 */

import { getSessionId } from './sessionStorage';

export interface MigrationResult {
  success: boolean;
  migratedDocuments: number;
  migratedNotes: number;
  migratedMessages: number;
  errors: string[];
}

export interface LocalStorageData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documents: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notes: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[];
  sessionId: string;
}

/**
 * Extract all localStorage data for the current session
 */
export function extractLocalStorageData(): LocalStorageData | null {
  if (typeof window === 'undefined') return null;

  const sessionId = getSessionId();
  if (!sessionId) return null;

  try {
    // Extract documents
    const documentsKey = `session_documents_${sessionId}`;
    const documentsData = localStorage.getItem(documentsKey);
    const documents = documentsData ? JSON.parse(documentsData) : [];

    // Extract notes
    const notesKey = `notebook_notes_${sessionId}`;
    const notesData = localStorage.getItem(notesKey);
    const notes = notesData ? JSON.parse(notesData) : [];

    // Extract chat messages
    const messagesKey = `chat_messages_${sessionId}`;
    const messagesData = localStorage.getItem(messagesKey);
    const messages = messagesData ? JSON.parse(messagesData) : [];

    return {
      documents,
      notes,
      messages,
      sessionId,
    };
  } catch (error) {
    console.error('Failed to extract localStorage data:', error);
    return null;
  }
}

/**
 * Check if user has existing localStorage data that needs migration
 */
export function hasLocalStorageData(): boolean {
  if (typeof window === 'undefined') return false;

  const sessionId = getSessionId();
  if (!sessionId) return false;

  const documentsKey = `session_documents_${sessionId}`;
  const notesKey = `notebook_notes_${sessionId}`;
  const messagesKey = `chat_messages_${sessionId}`;

  const hasDocuments = localStorage.getItem(documentsKey) !== null;
  const hasNotes = localStorage.getItem(notesKey) !== null;
  const hasMessages = localStorage.getItem(messagesKey) !== null;

  return hasDocuments || hasNotes || hasMessages;
}

/**
 * Migrate documents to NeonDB
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function migrateDocuments(documents: any[], sessionId: string): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = [];
  let success = 0;

  for (const doc of documents) {
    try {
      // Create document in NeonDB via API
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: doc.id,
          name: doc.name,
          content: doc.content,
          sessionId: sessionId,
          status: doc.status || 'ready',
          sourceUrl: doc.sourceUrl,
          metadata: {
            type: doc.type || 'text/plain',
            size: doc.size || 0,
            chunksCount: doc.chunksCount || 0,
            uploadedAt: doc.uploadedAt || new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        success++;
      } else {
        errors.push(`Failed to migrate document ${doc.name}: ${response.statusText}`);
      }
    } catch (error) {
      errors.push(`Error migrating document ${doc.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { success, errors };
}

/**
 * Migrate notes to NeonDB
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function migrateNotes(notes: any[], sessionId: string): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = [];
  let success = 0;

  for (const note of notes) {
    try {
      // Determine note type
      let noteType = 'summary';
      if (note.title?.includes('Citation:') || note.content?.includes('Citation Content')) {
        noteType = 'quote';
      } else if (note.title?.includes('Insight') || note.content?.includes('## 💡')) {
        noteType = 'insight';
      }

      // Create note in NeonDB via API
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: note.id,
          title: note.title,
          content: note.content,
          sessionId: sessionId,
          metadata: {
            type: noteType,
            sourceDocumentId: note.sourceDocumentId,
            sourceUrl: note.sourceUrl,
            tags: note.tags || [],
          },
        }),
      });

      if (response.ok) {
        success++;
      } else {
        errors.push(`Failed to migrate note ${note.title}: ${response.statusText}`);
      }
    } catch (error) {
      errors.push(`Error migrating note ${note.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { success, errors };
}

/**
 * Migrate chat messages to NeonDB
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function migrateMessages(messages: any[], sessionId: string): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = [];
  let success = 0;

  // Group messages by conversation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversationMap = new Map<string, any[]>();
  
  for (const message of messages) {
    const convId = message.conversationId || 'default';
    if (!conversationMap.has(convId)) {
      conversationMap.set(convId, []);
    }
    conversationMap.get(convId)!.push(message);
  }

  // Migrate each conversation
  for (const [conversationId, convMessages] of conversationMap) {
    try {
      // Create conversation first if needed
      let actualConversationId = conversationId;
      
      if (conversationId === 'default') {
        // Create a new conversation for default messages
        const firstMessage = convMessages[0];
        const convResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: firstMessage.content,
            sessionId: sessionId,
            role: firstMessage.role || 'user',
            citations: firstMessage.citations,
          }),
        });
        
        if (convResponse.ok) {
          const convData = await convResponse.json();
          actualConversationId = convData.conversationId;
          success++; // Count the first message
          convMessages.shift(); // Remove the first message as it's already created
        } else {
          errors.push(`Failed to create conversation: ${convResponse.statusText}`);
          continue;
        }
      }

      // Migrate remaining messages
      for (const message of convMessages) {
        const messageResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message.content,
            sessionId: sessionId,
            conversationId: actualConversationId,
            role: message.role || 'user',
            citations: message.citations,
          }),
        });

        if (messageResponse.ok) {
          success++;
        } else {
          errors.push(`Failed to migrate message: ${messageResponse.statusText}`);
        }
      }
    } catch (error) {
      errors.push(`Error migrating conversation ${conversationId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { success, errors };
}

/**
 * Perform complete data migration from localStorage to NeonDB
 */
export async function migrateToNeonDB(): Promise<MigrationResult> {
  const localData = extractLocalStorageData();
  
  if (!localData) {
    return {
      success: false,
      migratedDocuments: 0,
      migratedNotes: 0,
      migratedMessages: 0,
      errors: ['No localStorage data found or no session ID'],
    };
  }

  const allErrors: string[] = [];
  let totalDocuments = 0;
  let totalNotes = 0;
  let totalMessages = 0;

  try {
    // Migrate documents
    if (localData.documents.length > 0) {
      const docResult = await migrateDocuments(localData.documents, localData.sessionId);
      totalDocuments = docResult.success;
      allErrors.push(...docResult.errors);
    }

    // Migrate notes
    if (localData.notes.length > 0) {
      const notesResult = await migrateNotes(localData.notes, localData.sessionId);
      totalNotes = notesResult.success;
      allErrors.push(...notesResult.errors);
    }

    // Migrate messages
    if (localData.messages.length > 0) {
      const messagesResult = await migrateMessages(localData.messages, localData.sessionId);
      totalMessages = messagesResult.success;
      allErrors.push(...messagesResult.errors);
    }

    return {
      success: allErrors.length === 0,
      migratedDocuments: totalDocuments,
      migratedNotes: totalNotes,
      migratedMessages: totalMessages,
      errors: allErrors,
    };
  } catch (error) {
    return {
      success: false,
      migratedDocuments: totalDocuments,
      migratedNotes: totalNotes,
      migratedMessages: totalMessages,
      errors: [...allErrors, `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Clear localStorage data after successful migration
 */
export function clearLocalStorageData(): void {
  if (typeof window === 'undefined') return;

  const sessionId = getSessionId();
  if (!sessionId) return;

  try {
    const documentsKey = `session_documents_${sessionId}`;
    const notesKey = `notebook_notes_${sessionId}`;
    const messagesKey = `chat_messages_${sessionId}`;

    localStorage.removeItem(documentsKey);
    localStorage.removeItem(notesKey);
    localStorage.removeItem(messagesKey);
    
    // Also clear processed documents tracking
    localStorage.removeItem('paperlm_processed_documents');
    
    console.log('Successfully cleared localStorage data after migration');
  } catch (error) {
    console.error('Failed to clear localStorage data:', error);
  }
}

/**
 * Create a backup of localStorage data before migration
 */
export function createLocalStorageBackup(): string | null {
  const localData = extractLocalStorageData();
  if (!localData) return null;

  try {
    const backup = {
      timestamp: new Date().toISOString(),
      sessionId: localData.sessionId,
      data: localData,
    };
    
    return JSON.stringify(backup, null, 2);
  } catch (error) {
    console.error('Failed to create backup:', error);
    return null;
  }
}