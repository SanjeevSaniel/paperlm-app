import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ensureUser, saveDocument, getDocumentsByUser } from './database';

export interface UsageTracker {
  uploads: number;
  queries: number;
  sessionId: string;
  isAuthenticated: boolean;
  userId?: string;
}

const ANONYMOUS_LIMITS = {
  uploads: 3,
  queries: 5,
  total: 5, // Combined limit
};

const COOKIE_NAME = 'paperlm_usage';
const COOKIE_MAX_AGE = 24 * 60 * 60; // 24 hours

export interface AuthenticatedUser {
  userId: string;
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface AnonymousSession {
  sessionId: string;
  uploads: number;
  queries: number;
  createdAt: string;
}

export const getUsageFromCookie = (request: NextRequest): UsageTracker => {
  const cookieValue = request.cookies.get(COOKIE_NAME)?.value;
  
  if (!cookieValue) {
    const sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    return {
      uploads: 0,
      queries: 0,
      sessionId,
      isAuthenticated: false,
    };
  }

  try {
    const data = JSON.parse(decodeURIComponent(cookieValue)) as AnonymousSession;
    return {
      uploads: data.uploads || 0,
      queries: data.queries || 0,
      sessionId: data.sessionId,
      isAuthenticated: false,
    };
  } catch {
    const sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    return {
      uploads: 0,
      queries: 0,
      sessionId,
      isAuthenticated: false,
    };
  }
};

export const setUsageCookie = (response: NextResponse, usage: UsageTracker): void => {
  if (!usage.isAuthenticated) {
    const cookieData: AnonymousSession = {
      sessionId: usage.sessionId,
      uploads: usage.uploads,
      queries: usage.queries,
      createdAt: new Date().toISOString(),
    };

    response.cookies.set(COOKIE_NAME, encodeURIComponent(JSON.stringify(cookieData)), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
  }
};

export const checkUsageLimit = (usage: UsageTracker, action: 'upload' | 'query'): boolean => {
  if (usage.isAuthenticated) {
    return true; // No limits for authenticated users
  }

  const total = usage.uploads + usage.queries;
  
  if (action === 'upload') {
    return usage.uploads < ANONYMOUS_LIMITS.uploads && total < ANONYMOUS_LIMITS.total;
  } else {
    return usage.queries < ANONYMOUS_LIMITS.queries && total < ANONYMOUS_LIMITS.total;
  }
};

export const incrementUsage = (usage: UsageTracker, action: 'upload' | 'query'): UsageTracker => {
  if (usage.isAuthenticated) {
    return usage; // No tracking for authenticated users
  }

  return {
    ...usage,
    [action === 'upload' ? 'uploads' : 'queries']: usage[action === 'upload' ? 'uploads' : 'queries'] + 1,
  };
};

export const withFreemium = <T>(
  handler: (request: NextRequest, user: AuthenticatedUser | null, usage: UsageTracker) => Promise<T>,
  action: 'upload' | 'query'
) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Check if user is authenticated
      const { userId: clerkUserId } = await auth();
      let user: AuthenticatedUser | null = null;
      let usage: UsageTracker;

      if (clerkUserId) {
        // Authenticated user
        const clerkUser = await currentUser();
        if (clerkUser) {
          const email = clerkUser.emailAddresses[0]?.emailAddress || 'user@example.com';
          const firstName = clerkUser.firstName;
          const lastName = clerkUser.lastName;
          const userId = ensureUser(clerkUserId, email, firstName, lastName);

          user = {
            userId,
            clerkUserId,
            email,
            firstName,
            lastName,
          };

          usage = {
            uploads: 0,
            queries: 0,
            sessionId: clerkUserId,
            isAuthenticated: true,
            userId,
          };
        } else {
          // Fallback to anonymous
          usage = getUsageFromCookie(request);
        }
      } else {
        // Anonymous user
        usage = getUsageFromCookie(request);
      }

      // Check usage limits for anonymous users
      if (!usage.isAuthenticated && !checkUsageLimit(usage, action)) {
        const response = NextResponse.json({
          error: 'Usage limit exceeded',
          limitExceeded: true,
          limits: ANONYMOUS_LIMITS,
          currentUsage: {
            uploads: usage.uploads,
            queries: usage.queries,
            total: usage.uploads + usage.queries,
          },
        }, { status: 429 });

        setUsageCookie(response, usage);
        return response;
      }

      // Execute the handler
      const result = await handler(request, user, usage);

      // Increment usage for anonymous users
      const updatedUsage = incrementUsage(usage, action);

      const response = NextResponse.json(result);
      setUsageCookie(response, updatedUsage);

      return response;
    } catch (error) {
      console.error('Freemium handler error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
};