import { db } from '../neon';
import { conversations, messages, type Conversation, type NewConversation, type Message, type NewMessage } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export class ConversationRepository {
  
  // Create new conversation
  static async create(conversationData: NewConversation): Promise<Conversation | null> {
    try {
      const result = await db.insert(conversations).values({
        ...conversationData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return result[0] || null;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }

  // Find conversation by ID
  static async findById(id: string): Promise<Conversation | null> {
    try {
      const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error finding conversation by ID:', error);
      return null;
    }
  }

  // Find conversations by user ID
  static async findByUserId(userId: string): Promise<Conversation[]> {
    try {
      const result = await db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.updatedAt));
      return result;
    } catch (error) {
      console.error('Error finding conversations by user ID:', error);
      return [];
    }
  }

  // Find conversations by session ID
  static async findBySessionId(sessionId: string): Promise<Conversation[]> {
    try {
      const result = await db
        .select()
        .from(conversations)
        .where(eq(conversations.sessionId, sessionId))
        .orderBy(desc(conversations.updatedAt));
      return result;
    } catch (error) {
      console.error('Error finding conversations by session ID:', error);
      return [];
    }
  }

  // Find conversations by user and session
  static async findByUserAndSession(userId: string, sessionId: string): Promise<Conversation[]> {
    try {
      const result = await db
        .select()
        .from(conversations)
        .where(and(
          eq(conversations.userId, userId),
          eq(conversations.sessionId, sessionId)
        ))
        .orderBy(desc(conversations.updatedAt));
      return result;
    } catch (error) {
      console.error('Error finding conversations by user and session:', error);
      return [];
    }
  }

  // Update conversation
  static async update(id: string, conversationData: Partial<NewConversation>): Promise<Conversation | null> {
    try {
      const result = await db
        .update(conversations)
        .set({
          ...conversationData,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, id))
        .returning();
      return result[0] || null;
    } catch (error) {
      console.error('Error updating conversation:', error);
      return null;
    }
  }

  // Increment message count
  static async incrementMessageCount(id: string): Promise<Conversation | null> {
    try {
      const conversation = await this.findById(id);
      if (!conversation) return null;

      return await this.update(id, {
        totalMessages: (conversation.totalMessages || 0) + 1,
      });
    } catch (error) {
      console.error('Error incrementing message count:', error);
      return null;
    }
  }

  // Update document IDs
  static async updateDocumentIds(id: string, documentIds: string[]): Promise<Conversation | null> {
    try {
      return await this.update(id, { documentIds });
    } catch (error) {
      console.error('Error updating document IDs:', error);
      return null;
    }
  }

  // Delete conversation
  static async delete(id: string): Promise<boolean> {
    try {
      // First delete all messages in the conversation
      await db.delete(messages).where(eq(messages.conversationId, id));
      // Then delete the conversation
      await db.delete(conversations).where(eq(conversations.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }
}

export class MessageRepository {
  
  // Create new message
  static async create(messageData: NewMessage): Promise<Message | null> {
    try {
      const result = await db.insert(messages).values({
        ...messageData,
        createdAt: new Date(),
      }).returning();
      
      // Update conversation message count
      if (result[0]) {
        await ConversationRepository.incrementMessageCount(messageData.conversationId);
      }
      
      return result[0] || null;
    } catch (error) {
      console.error('Error creating message:', error);
      return null;
    }
  }

  // Find message by ID
  static async findById(id: string): Promise<Message | null> {
    try {
      const result = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error finding message by ID:', error);
      return null;
    }
  }

  // Find messages by conversation ID
  static async findByConversationId(conversationId: string): Promise<Message[]> {
    try {
      const result = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt);
      return result;
    } catch (error) {
      console.error('Error finding messages by conversation ID:', error);
      return [];
    }
  }

  // Find messages by user ID
  static async findByUserId(userId: string): Promise<Message[]> {
    try {
      const result = await db
        .select()
        .from(messages)
        .where(eq(messages.userId, userId))
        .orderBy(desc(messages.createdAt));
      return result;
    } catch (error) {
      console.error('Error finding messages by user ID:', error);
      return [];
    }
  }

  // Get conversation history (messages with conversation info)
  static async getConversationHistory(conversationId: string): Promise<{
    conversation: Conversation | null;
    messages: Message[];
  }> {
    try {
      const conversation = await ConversationRepository.findById(conversationId);
      const messageList = await this.findByConversationId(conversationId);
      
      return {
        conversation,
        messages: messageList,
      };
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return {
        conversation: null,
        messages: [],
      };
    }
  }

  // Delete message
  static async delete(id: string): Promise<boolean> {
    try {
      await db.delete(messages).where(eq(messages.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  // Delete messages by conversation
  static async deleteByConversation(conversationId: string): Promise<boolean> {
    try {
      await db.delete(messages).where(eq(messages.conversationId, conversationId));
      return true;
    } catch (error) {
      console.error('Error deleting messages by conversation:', error);
      return false;
    }
  }

  // Get message count by user
  static async getCountByUser(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: messages.id })
        .from(messages)
        .where(eq(messages.userId, userId));
      return result.length;
    } catch (error) {
      console.error('Error getting message count by user:', error);
      return 0;
    }
  }
}