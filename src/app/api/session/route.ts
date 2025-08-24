import { auth } from '@clerk/nextjs/server';
import { SessionRepository } from '@/lib/repositories/sessionRepository';
import { UserRepository } from '@/lib/repositories/userRepository';
import { UserTrackingRepository } from '@/lib/repositories/userTrackingRepository';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { sessionId, action } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    if (action === 'initialize') {
      // Initialize or update session
      let session;
      
      if (userId) {
        // For authenticated users
        const user = await UserRepository.findByClerkId(userId);
        if (user) {
          session = await SessionRepository.findOrCreate({
            sessionId,
            userId: user.id,
            userAgent: request.headers.get('user-agent') || '',
          });

          // Track user session activity
          await UserTrackingRepository.trackSessionActivity(user.id, sessionId, 'chat');
          console.log('📊 Session activity tracked for user:', user.id);
        }
      } else {
        // For anonymous users
        session = await SessionRepository.findOrCreate({
          sessionId,
          userId: 'anonymous',
          userAgent: request.headers.get('user-agent') || '',
        });
      }

      return NextResponse.json({ 
        success: true, 
        session: session ? {
          id: session.id,
          sessionId: session.sessionId,
          userId: session.userId,
          messageCount: session.messageCount,
          lastActivity: session.lastActivity,
        } : null 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { error: 'Failed to process session request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    let session;
    
    if (userId) {
      // For authenticated users
      const user = await UserRepository.findByClerkId(userId);
      if (user) {
        session = await SessionRepository.findBySessionIdAndUser(sessionId, user.id);
      }
    } else {
      // For anonymous users
      session = await SessionRepository.findBySessionId(sessionId);
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      session: {
        id: session.id,
        sessionId: session.sessionId,
        userId: session.userId,
        messageCount: session.messageCount,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
      }
    });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}