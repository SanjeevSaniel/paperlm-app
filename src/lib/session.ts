import { NextRequest, NextResponse } from 'next/server';
import { createSession, getSession, updateSessionAccess } from './database';

const SESSION_COOKIE_NAME = 'paperlm_session';
const SESSION_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export const getSessionId = (request: NextRequest): string => {
  let sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  
  if (!sessionId || !getSession(sessionId)) {
    sessionId = createSession();
  } else {
    updateSessionAccess(sessionId);
  }
  
  return sessionId;
};

export const setSessionCookie = (response: NextResponse, sessionId: string): void => {
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: '/',
  });
};

export const withSession = <T>(
  handler: (request: NextRequest, sessionId: string) => Promise<T>
) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const sessionId = getSessionId(request);
      const result = await handler(request, sessionId);
      
      const response = NextResponse.json(result);
      setSessionCookie(response, sessionId);
      
      return response;
    } catch (error) {
      console.error('Session handler error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
};