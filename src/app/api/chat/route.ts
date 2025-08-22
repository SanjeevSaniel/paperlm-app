import { auth } from '@clerk/nextjs/server';
import { ConversationRepository, MessageRepository } from '@/lib/repositories/conversationRepository';
import { UserRepository } from '@/lib/repositories/userRepository';
import { SessionRepository } from '@/lib/repositories/sessionRepository';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { message, sessionId, conversationId, documentIds = [] } = body;

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Message and session ID are required' }, { status: 400 });
    }

    let user = null;
    if (userId) {
      user = await UserRepository.findByClerkId(userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Check message limits
      if (!UserRepository.canSendMessage(user)) {
        return NextResponse.json({ error: 'Message limit reached' }, { status: 403 });
      }
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await ConversationRepository.findById(conversationId);
      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
    } else {
      // Create new conversation
      conversation = await ConversationRepository.create({
        userId: user?.id || 'anonymous',
        sessionId: sessionId,
        title: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        documentIds: documentIds,
      });
      
      if (!conversation) {
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }
    }

    // Create user message
    const userMessage = await MessageRepository.create({
      conversationId: conversation.id,
      userId: user?.id || 'anonymous',
      role: 'user',
      content: message,
      tokenCount: message.length, // Simple token estimation
      metadata: {
        documentIds: documentIds,
        sessionId: sessionId,
      },
    });

    if (!userMessage) {
      return NextResponse.json({ error: 'Failed to save user message' }, { status: 500 });
    }

    // Update session tracking
    if (user) {
      await SessionRepository.incrementMessageCount(sessionId);
      await UserRepository.incrementMessageUsage(userId);
    }

    // Here you would typically call your AI service (OpenAI, etc.)
    // For now, we'll return a simple response structure
    
    return NextResponse.json({
      conversationId: conversation.id,
      messageId: userMessage.id,
      success: true,
      // The actual AI response would be handled separately
      // This endpoint just handles the message storage
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const sessionId = searchParams.get('sessionId');

    if (conversationId) {
      // Get specific conversation history
      const { conversation, messages } = await MessageRepository.getConversationHistory(conversationId);
      
      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // Authorization check
      if (userId) {
        const user = await UserRepository.findByClerkId(userId);
        if (user && conversation.userId !== user.id) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      } else if (sessionId && conversation.sessionId !== sessionId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      return NextResponse.json({
        conversation,
        messages,
      });
    } else if (sessionId) {
      // Get all conversations for session
      let conversations = [];
      
      if (userId) {
        const user = await UserRepository.findByClerkId(userId);
        if (user) {
          conversations = await ConversationRepository.findByUserAndSession(user.id, sessionId);
        }
      } else {
        conversations = await ConversationRepository.findBySessionId(sessionId);
      }

      return NextResponse.json({
        conversations,
        count: conversations.length,
      });
    } else {
      return NextResponse.json({ error: 'Conversation ID or session ID is required' }, { status: 400 });
    }

  } catch (error) {
    console.error('Chat history fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}