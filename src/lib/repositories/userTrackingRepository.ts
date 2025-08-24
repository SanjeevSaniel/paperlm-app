import { neon } from '@neondatabase/serverless';
import { generateUUID as randomUUID } from '@/lib/utils/uuid';

const sql = neon(process.env.NEON_DATABASE_URL!);

export class UserTrackingRepository {
  
  // Track user signin
  static async trackUserSignin(userId: string): Promise<boolean> {
    try {
      await sql`
        INSERT INTO user_sessions (id, user_id, session_id, session_type, is_active, created_at, updated_at)
        VALUES (${randomUUID()}, ${userId}, ${'signin_' + Date.now()}, 'signin', ${true}, NOW(), NOW())
      `;
      console.log('✅ User signin tracked:', userId);
      return true;
    } catch (error) {
      console.error('❌ Error tracking user signin:', error);
      return false;
    }
  }

  // Track user session activity
  static async trackSessionActivity(userId: string, sessionId: string, sessionType = 'chat'): Promise<boolean> {
    try {
      await sql`
        INSERT INTO user_sessions (id, user_id, session_id, session_type, is_active, created_at, updated_at)
        VALUES (${randomUUID()}, ${userId}, ${sessionId}, ${sessionType}, ${true}, NOW(), NOW())
        ON CONFLICT (user_id, session_id) 
        DO UPDATE SET 
          last_activity_at = NOW(),
          updated_at = NOW(),
          is_active = true
      `;
      return true;
    } catch (error) {
      console.error('❌ Error tracking session activity:', error);
      return false;
    }
  }

  // Save user message
  static async saveUserMessage(
    userId: string,
    sessionId: string,
    messageContent: string,
    messageType = 'chat'
  ): Promise<boolean> {
    try {
      await sql`
        INSERT INTO user_messages (id, user_id, session_id, message_type, message_content, created_at, updated_at)
        VALUES (${randomUUID()}, ${userId}, ${sessionId}, ${messageType}, ${messageContent}, NOW(), NOW())
      `;
      return true;
    } catch (error) {
      console.error('❌ Error saving user message:', error);
      return false;
    }
  }

  // Get user messages for a session
  static async getUserMessages(userId: string, sessionId: string, limit = 50) {
    try {
      const result = await sql`
        SELECT * FROM user_messages 
        WHERE user_id = ${userId} AND session_id = ${sessionId}
        ORDER BY created_at ASC
        LIMIT ${limit}
      `;
      return result;
    } catch (error) {
      console.error('❌ Error fetching user messages:', error);
      return [];
    }
  }

  // Track user document upload
  static async trackDocumentUpload(
    userId: string,
    sessionId: string,
    documentName: string,
    fileType?: string,
    fileSize?: number
  ): Promise<boolean> {
    try {
      await sql`
        INSERT INTO user_documents_tracking (id, user_id, session_id, document_name, file_type, file_size, created_at, updated_at)
        VALUES (${randomUUID()}, ${userId}, ${sessionId}, ${documentName}, ${fileType || null}, ${fileSize || null}, NOW(), NOW())
      `;
      console.log('✅ Document upload tracked:', documentName);
      return true;
    } catch (error) {
      console.error('❌ Error tracking document upload:', error);
      return false;
    }
  }

  // Get user documents
  static async getUserDocuments(userId: string, sessionId?: string, limit = 50) {
    try {
      let result;
      if (sessionId) {
        result = await sql`
          SELECT * FROM user_documents_tracking 
          WHERE user_id = ${userId} AND session_id = ${sessionId}
          ORDER BY upload_date DESC
          LIMIT ${limit}
        `;
      } else {
        result = await sql`
          SELECT * FROM user_documents_tracking 
          WHERE user_id = ${userId}
          ORDER BY upload_date DESC
          LIMIT ${limit}
        `;
      }
      return result;
    } catch (error) {
      console.error('❌ Error fetching user documents:', error);
      return [];
    }
  }

  // Save user note
  static async saveUserNote(
    userId: string,
    sessionId: string,
    noteContent: string,
    noteTitle?: string
  ): Promise<boolean> {
    try {
      await sql`
        INSERT INTO user_notes (id, user_id, session_id, note_title, note_content, created_at, updated_at)
        VALUES (${randomUUID()}, ${userId}, ${sessionId}, ${noteTitle || null}, ${noteContent}, NOW(), NOW())
      `;
      console.log('✅ User note saved');
      return true;
    } catch (error) {
      console.error('❌ Error saving user note:', error);
      return false;
    }
  }

  // Get user notes
  static async getUserNotes(userId: string, sessionId?: string, limit = 50) {
    try {
      let result;
      if (sessionId) {
        result = await sql`
          SELECT * FROM user_notes 
          WHERE user_id = ${userId} AND session_id = ${sessionId}
          ORDER BY created_at DESC
          LIMIT ${limit}
        `;
      } else {
        result = await sql`
          SELECT * FROM user_notes 
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
          LIMIT ${limit}
        `;
      }
      return result;
    } catch (error) {
      console.error('❌ Error fetching user notes:', error);
      return [];
    }
  }

  // Get user activity summary
  static async getUserActivitySummary(userId: string) {
    try {
      const sessionCount = await sql`SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ${userId}`;
      const messageCount = await sql`SELECT COUNT(*) as count FROM user_messages WHERE user_id = ${userId}`;
      const documentCount = await sql`SELECT COUNT(*) as count FROM user_documents_tracking WHERE user_id = ${userId}`;
      const noteCount = await sql`SELECT COUNT(*) as count FROM user_notes WHERE user_id = ${userId}`;

      return {
        sessions: sessionCount[0]?.count || 0,
        messages: messageCount[0]?.count || 0,
        documents: documentCount[0]?.count || 0,
        notes: noteCount[0]?.count || 0,
      };
    } catch (error) {
      console.error('❌ Error fetching user activity summary:', error);
      return {
        sessions: 0,
        messages: 0,
        documents: 0,
        notes: 0,
      };
    }
  }
}