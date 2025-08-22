import { db } from '../neon';
import { userSessions, type UserSession, type NewUserSession } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';

export class SessionRepository {
  
  // Create new session
  static async create(sessionData: NewUserSession): Promise<UserSession | null> {
    try {
      const result = await db.insert(userSessions).values({
        ...sessionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return result[0] || null;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }

  // Find session by ID
  static async findBySessionId(sessionId: string): Promise<UserSession | null> {
    try {
      const result = await db.select().from(userSessions).where(eq(userSessions.sessionId, sessionId)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error finding session by ID:', error);
      return null;
    }
  }

  // Find sessions by user ID
  static async findByUserId(userId: string): Promise<UserSession[]> {
    try {
      const result = await db
        .select()
        .from(userSessions)
        .where(eq(userSessions.userId, userId))
        .orderBy(userSessions.lastActivity);
      return result;
    } catch (error) {
      console.error('Error finding sessions by user ID:', error);
      return [];
    }
  }

  // Get or create session
  static async getOrCreate(
    userId: string, 
    sessionId: string, 
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<UserSession | null> {
    try {
      // Try to find existing session
      let session = await this.findBySessionId(sessionId);
      
      if (!session) {
        // Create new session if doesn't exist
        session = await this.create({
          userId,
          sessionId,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
          lastActivity: new Date(),
          documentCount: 0,
          messageCount: 0,
          noteCount: 0,
        });
      } else {
        // Update last activity
        session = await this.updateActivity(sessionId);
      }
      
      return session;
    } catch (error) {
      console.error('Error in getOrCreate session:', error);
      return null;
    }
  }

  // Update session activity
  static async updateActivity(sessionId: string): Promise<UserSession | null> {
    try {
      const result = await db
        .update(userSessions)
        .set({
          lastActivity: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userSessions.sessionId, sessionId))
        .returning();
      return result[0] || null;
    } catch (error) {
      console.error('Error updating session activity:', error);
      return null;
    }
  }

  // Update session counters
  static async updateCounters(
    sessionId: string, 
    counters: {
      documentCount?: number;
      messageCount?: number;
      noteCount?: number;
    }
  ): Promise<UserSession | null> {
    try {
      const result = await db
        .update(userSessions)
        .set({
          ...counters,
          lastActivity: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userSessions.sessionId, sessionId))
        .returning();
      return result[0] || null;
    } catch (error) {
      console.error('Error updating session counters:', error);
      return null;
    }
  }

  // Increment document count
  static async incrementDocumentCount(sessionId: string): Promise<UserSession | null> {
    try {
      const session = await this.findBySessionId(sessionId);
      if (!session) return null;

      return await this.updateCounters(sessionId, {
        documentCount: (session.documentCount || 0) + 1,
      });
    } catch (error) {
      console.error('Error incrementing document count:', error);
      return null;
    }
  }

  // Increment message count
  static async incrementMessageCount(sessionId: string): Promise<UserSession | null> {
    try {
      const session = await this.findBySessionId(sessionId);
      if (!session) return null;

      return await this.updateCounters(sessionId, {
        messageCount: (session.messageCount || 0) + 1,
      });
    } catch (error) {
      console.error('Error incrementing message count:', error);
      return null;
    }
  }

  // Increment note count
  static async incrementNoteCount(sessionId: string): Promise<UserSession | null> {
    try {
      const session = await this.findBySessionId(sessionId);
      if (!session) return null;

      return await this.updateCounters(sessionId, {
        noteCount: (session.noteCount || 0) + 1,
      });
    } catch (error) {
      console.error('Error incrementing note count:', error);
      return null;
    }
  }

  // Delete session
  static async delete(sessionId: string): Promise<boolean> {
    try {
      await db.delete(userSessions).where(eq(userSessions.sessionId, sessionId));
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  // Clean up old sessions (older than specified days)
  static async cleanupOldSessions(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const deletedSessions = await db
        .delete(userSessions)
        .where(lt(userSessions.lastActivity, cutoffDate))
        .returning();

      console.log(`Cleaned up ${deletedSessions.length} old sessions`);
      return deletedSessions.length;
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
      return 0;
    }
  }

  // Get active sessions for user (within last 24 hours)
  static async getActiveSessions(userId: string): Promise<UserSession[]> {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const result = await db
        .select()
        .from(userSessions)
        .where(and(
          eq(userSessions.userId, userId),
          lt(oneDayAgo, userSessions.lastActivity)
        ))
        .orderBy(userSessions.lastActivity);
      
      return result;
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return [];
    }
  }

  // Get session statistics for user
  static async getSessionStats(userId: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    totalDocuments: number;
    totalMessages: number;
    totalNotes: number;
  }> {
    try {
      const allSessions = await this.findByUserId(userId);
      const activeSessions = await this.getActiveSessions(userId);

      const stats = allSessions.reduce(
        (acc, session) => ({
          totalDocuments: acc.totalDocuments + (session.documentCount || 0),
          totalMessages: acc.totalMessages + (session.messageCount || 0),
          totalNotes: acc.totalNotes + (session.noteCount || 0),
        }),
        { totalDocuments: 0, totalMessages: 0, totalNotes: 0 }
      );

      return {
        totalSessions: allSessions.length,
        activeSessions: activeSessions.length,
        ...stats,
      };
    } catch (error) {
      console.error('Error getting session stats:', error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        totalDocuments: 0,
        totalMessages: 0,
        totalNotes: 0,
      };
    }
  }
}