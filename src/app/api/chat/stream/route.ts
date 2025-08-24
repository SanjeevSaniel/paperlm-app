import { auth } from '@clerk/nextjs/server';
import { ConversationRepository, MessageRepository } from '@/lib/repositories/conversationRepository';
import { UserRepository } from '@/lib/repositories/userRepository';
import { SessionRepository } from '@/lib/repositories/sessionRepository';
import { UserTrackingRepository } from '@/lib/repositories/userTrackingRepository';
import { streamAIResponse } from '@/lib/ai';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Streaming chat endpoint using Vercel AI SDK
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { message, sessionId, conversationId, documentIds = [], chatHistory = [] } = body;

    if (!message || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Message and session ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let user = null;
    if (userId) {
      user = await UserRepository.findByClerkId(userId);
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check message limits
      if (!UserRepository.canSendMessage(user)) {
        return new Response(
          JSON.stringify({ error: 'Message limit reached' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await ConversationRepository.findById(conversationId);
      if (!conversation) {
        return new Response(
          JSON.stringify({ error: 'Conversation not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
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
        return new Response(
          JSON.stringify({ error: 'Failed to create conversation' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Save user message first
    const userMessage = await MessageRepository.create({
      conversationId: conversation.id,
      userId: user?.id || 'anonymous',
      role: 'user',
      content: message,
      tokenCount: message.length,
      metadata: {
        documentIds: documentIds,
        sessionId: sessionId,
      },
    });

    // Track user message if user is authenticated  
    if (user && userMessage) {
      await UserTrackingRepository.saveUserMessage(
        user.id,
        sessionId,
        message,
        'user'
      );
      console.log('💬 User streaming message tracked');
    }

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: 'Failed to save user message' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update session tracking
    if (user && userId) {
      await SessionRepository.incrementMessageCount(sessionId);
      await UserRepository.incrementMessageUsage(userId);
    }

    // Build message array for AI
    const messages = [
      ...chatHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user' as const, content: message },
    ];

    // Stream AI response
    const streamResponse = await streamAIResponse(messages, undefined, {
      temperature: 0.3,
      maxTokens: 2000,
    });

    // Set up response headers for streaming
    const headers = new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Conversation-Id': conversation.id,
      'X-Message-Id': userMessage.id,
    });

    return new Response(streamResponse.body, {
      headers,
      status: 200,
    });

  } catch (error) {
    console.error('Streaming chat error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process streaming chat' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}