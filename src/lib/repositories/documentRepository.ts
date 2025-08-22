import { db } from '../neon';
import { documents, type Document, type NewDocument } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export class DocumentRepository {
  
  // Create new document
  static async create(documentData: NewDocument): Promise<Document | null> {
    try {
      const result = await db.insert(documents).values({
        ...documentData,
        uploadedAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return result[0] || null;
    } catch (error) {
      console.error('Error creating document:', error);
      return null;
    }
  }

  // Find document by ID
  static async findById(id: string): Promise<Document | null> {
    try {
      const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error finding document by ID:', error);
      return null;
    }
  }

  // Find documents by user ID
  static async findByUserId(userId: string): Promise<Document[]> {
    try {
      const result = await db
        .select()
        .from(documents)
        .where(eq(documents.userId, userId))
        .orderBy(desc(documents.uploadedAt));
      return result;
    } catch (error) {
      console.error('Error finding documents by user ID:', error);
      return [];
    }
  }

  // Find documents by session ID
  static async findBySessionId(sessionId: string): Promise<Document[]> {
    try {
      const result = await db
        .select()
        .from(documents)
        .where(eq(documents.sessionId, sessionId))
        .orderBy(desc(documents.uploadedAt));
      return result;
    } catch (error) {
      console.error('Error finding documents by session ID:', error);
      return [];
    }
  }

  // Find documents by user and session
  static async findByUserAndSession(userId: string, sessionId: string): Promise<Document[]> {
    try {
      const result = await db
        .select()
        .from(documents)
        .where(and(
          eq(documents.userId, userId),
          eq(documents.sessionId, sessionId)
        ))
        .orderBy(desc(documents.uploadedAt));
      return result;
    } catch (error) {
      console.error('Error finding documents by user and session:', error);
      return [];
    }
  }

  // Update document
  static async update(id: string, documentData: Partial<NewDocument>): Promise<Document | null> {
    try {
      const result = await db
        .update(documents)
        .set({
          ...documentData,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, id))
        .returning();
      return result[0] || null;
    } catch (error) {
      console.error('Error updating document:', error);
      return null;
    }
  }

  // Update document status
  static async updateStatus(id: string, status: 'uploading' | 'processing' | 'ready' | 'error'): Promise<Document | null> {
    try {
      const updateData: { status: 'uploading' | 'processing' | 'ready' | 'error'; updatedAt: Date; processedAt?: Date } = { status, updatedAt: new Date() };
      
      if (status === 'ready') {
        updateData.processedAt = new Date();
      }
      
      const result = await db
        .update(documents)
        .set(updateData)
        .where(eq(documents.id, id))
        .returning();
      return result[0] || null;
    } catch (error) {
      console.error('Error updating document status:', error);
      return null;
    }
  }

  // Update document with processing results
  static async updateProcessingResults(
    id: string, 
    data: {
      content?: string;
      chunksCount?: number;
      qdrantCollectionId?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Document | null> {
    try {
      const result = await db
        .update(documents)
        .set({
          ...data,
          status: 'ready',
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(documents.id, id))
        .returning();
      return result[0] || null;
    } catch (error) {
      console.error('Error updating document processing results:', error);
      return null;
    }
  }

  // Delete document
  static async delete(id: string): Promise<boolean> {
    try {
      await db.delete(documents).where(eq(documents.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  // Delete documents by session
  static async deleteBySession(sessionId: string): Promise<boolean> {
    try {
      await db.delete(documents).where(eq(documents.sessionId, sessionId));
      return true;
    } catch (error) {
      console.error('Error deleting documents by session:', error);
      return false;
    }
  }

  // Get documents count by user
  static async getCountByUser(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: documents.id })
        .from(documents)
        .where(eq(documents.userId, userId));
      return result.length;
    } catch (error) {
      console.error('Error getting documents count by user:', error);
      return 0;
    }
  }

  // Get ready documents by session
  static async getReadyBySession(sessionId: string): Promise<Document[]> {
    try {
      const result = await db
        .select()
        .from(documents)
        .where(and(
          eq(documents.sessionId, sessionId),
          eq(documents.status, 'ready')
        ))
        .orderBy(desc(documents.uploadedAt));
      return result;
    } catch (error) {
      console.error('Error getting ready documents by session:', error);
      return [];
    }
  }
}