import { UserResource } from '@clerk/types';

/**
 * Simplified user type for chat components
 * Compatible with Clerk's UserResource but only includes what we need
 */
export interface ChatUser {
  primaryEmailAddress?: {
    emailAddress: string;
  } | null;
}

/**
 * Converts Clerk's UserResource to our simplified ChatUser type
 */
export function mapUserToChatUser(user: UserResource | null | undefined): ChatUser | null {
  if (!user) return null;
  
  return {
    primaryEmailAddress: user.primaryEmailAddress ? {
      emailAddress: user.primaryEmailAddress.emailAddress
    } : null
  };
}

/**
 * Enhanced citation interface for chat components
 */
export interface EnhancedCitation {
  id: string;
  chunkId?: string;
  documentId?: string;
  documentName?: string;
  documentType?: string;
  sourceUrl?: string;
  author?: string;
  publishedAt?: string;
  relevanceScore: number;
  content: string;
  fullContent?: string;
  // Enhanced citation fields
  pageNumber?: number;
  sectionTitle?: string;
  exactLocation?: string;
  confidence?: number;
  contextBefore?: string;
  contextAfter?: string;
  citationFormat?: {
    apa: string;
    mla: string;
    chicago: string;
  };
}

/**
 * Basic message type for chat header
 */
export interface BasicMessage {
  id: string;
  role: string;
  content: string;
}