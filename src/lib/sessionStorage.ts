import { Document, ChatMessage } from '@/types';

export interface NotebookNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionData {
  documents: Document[];
  chatMessages: ChatMessage[];
  notebookNotes: NotebookNote[];
  sessionId: string;
  isAuthenticated: boolean;
  userId?: string;
  userEmail?: string;
  cloudinaryUrls?: Record<string, string>; // documentId -> cloudinary URL mapping
  createdAt: string;
  expiresAt: string;
}

const SESSION_STORAGE_KEY = 'paperlm_session_data';
const SESSION_DURATION = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createDefaultSessionData(): SessionData {
  const now = new Date();
  return {
    documents: [],
    chatMessages: [],
    notebookNotes: [],
    sessionId: generateSessionId(),
    isAuthenticated: false,
    cloudinaryUrls: {},
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_DURATION).toISOString(),
  };
}

export function isSessionExpired(sessionData: SessionData): boolean {
  return new Date(sessionData.expiresAt) < new Date();
}

export function saveSessionData(data: Partial<SessionData>): void {
  try {
    const existingData = getSessionData();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION);

    const sessionData: SessionData = {
      documents: data.documents || existingData?.documents || [],
      chatMessages: data.chatMessages || existingData?.chatMessages || [],
      notebookNotes: data.notebookNotes || existingData?.notebookNotes || [],
      sessionId: data.sessionId || existingData?.sessionId || generateSessionId(),
      isAuthenticated: data.isAuthenticated || existingData?.isAuthenticated || false,
      userId: data.userId || existingData?.userId,
      userEmail: data.userEmail || existingData?.userEmail,
      cloudinaryUrls: data.cloudinaryUrls || existingData?.cloudinaryUrls || {},
      createdAt: existingData?.createdAt || now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    console.log('Session data saved:', sessionData.sessionId);
  } catch (error) {
    console.error('Failed to save session data:', error);
  }
}

export function getSessionData(): SessionData | null {
  try {
    const storedData = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!storedData) return null;

    const sessionData: SessionData = JSON.parse(storedData);
    
    // Check if session has expired
    if (isSessionExpired(sessionData)) {
      console.log('Session expired, clearing data');
      clearSessionData();
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error('Failed to get session data:', error);
    return null;
  }
}

export function clearSessionData(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    console.log('Session data cleared');
  } catch (error) {
    console.error('Failed to clear session data:', error);
  }
}

export function updateSessionDocuments(documents: Document[]): void {
  let sessionData = getSessionData();
  if (!sessionData) {
    sessionData = createDefaultSessionData();
  }
  saveSessionData({ ...sessionData, documents });
}

export function updateSessionChatMessages(chatMessages: ChatMessage[]): void {
  let sessionData = getSessionData();
  if (!sessionData) {
    sessionData = createDefaultSessionData();
  }
  saveSessionData({ ...sessionData, chatMessages });
}

export function updateSessionNotebookNotes(notebookNotes: NotebookNote[]): void {
  let sessionData = getSessionData();
  
  if (!sessionData) {
    sessionData = createDefaultSessionData();
  }
  
  const updatedData = { ...sessionData, notebookNotes };
  saveSessionData(updatedData);
}

export function getSessionId(): string {
  const sessionData = getSessionData();
  if (sessionData) {
    return sessionData.sessionId;
  }
  
  // Generate new session if none exists
  const newSessionId = generateSessionId();
  saveSessionData({ sessionId: newSessionId });
  return newSessionId;
}

// Update user authentication info
export function updateUserAuth(userId: string, userEmail: string): void {
  const sessionData = getSessionData();
  saveSessionData({ 
    ...sessionData, 
    isAuthenticated: true, 
    userId, 
    userEmail 
  });
}

// Update Cloudinary URLs for documents
export function updateCloudinaryUrl(documentId: string, cloudinaryUrl: string): void {
  const sessionData = getSessionData();
  const cloudinaryUrls = sessionData?.cloudinaryUrls || {};
  cloudinaryUrls[documentId] = cloudinaryUrl;
  
  saveSessionData({ 
    ...sessionData, 
    cloudinaryUrls 
  });
}

// Get Cloudinary URL for a document
export function getCloudinaryUrl(documentId: string): string | null {
  const sessionData = getSessionData();
  return sessionData?.cloudinaryUrls?.[documentId] || null;
}