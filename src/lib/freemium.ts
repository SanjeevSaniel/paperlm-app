import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ensureUser } from './database';

export interface UsageTracker {
  uploads: number;
  queries: number;
  sessionId: string;
  isAuthenticated: boolean;
  userId?: string;
}

const ANONYMOUS_LIMITS = { uploads: 3, queries: 5, total: 5 };
const COOKIE_NAME = 'paperlm_usage';
const COOKIE_MAX_AGE = 24 * 60 * 60;

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
    const sessionId = `anon_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;
    return { uploads: 0, queries: 0, sessionId, isAuthenticated: false };
  }
  try {
    const data = JSON.parse(
      decodeURIComponent(cookieValue),
    ) as AnonymousSession;
    return {
      uploads: data.uploads || 0,
      queries: data.queries || 0,
      sessionId: data.sessionId,
      isAuthenticated: false,
    };
  } catch {
    const sessionId = `anon_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;
    return { uploads: 0, queries: 0, sessionId, isAuthenticated: false };
  }
};

export const setUsageCookie = (
  response: NextResponse,
  usage: UsageTracker,
): void => {
  if (!usage.isAuthenticated) {
    const cookieData: AnonymousSession = {
      sessionId: usage.sessionId,
      uploads: usage.uploads,
      queries: usage.queries,
      createdAt: new Date().toISOString(),
    };
    response.cookies.set(
      COOKIE_NAME,
      encodeURIComponent(JSON.stringify(cookieData)),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
      },
    );
  }
};

export const checkUsageLimit = (
  usage: UsageTracker,
  action: 'upload' | 'query',
): boolean => {
  if (usage.isAuthenticated) return true;
  const total = usage.uploads + usage.queries;
  if (action === 'upload')
    return (
      usage.uploads < ANONYMOUS_LIMITS.uploads && total < ANONYMOUS_LIMITS.total
    );
  return (
    usage.queries < ANONYMOUS_LIMITS.queries && total < ANONYMOUS_LIMITS.total
  );
};

export const incrementUsage = (
  usage: UsageTracker,
  action: 'upload' | 'query',
): UsageTracker => {
  if (usage.isAuthenticated) return usage;
  return {
    ...usage,
    [action === 'upload' ? 'uploads' : 'queries']:
      usage[action === 'upload' ? 'uploads' : 'queries'] + 1,
  };
};

// Wrapper with better error detail in dev
export const withFreemium = <T>(
  handler: (
    request: NextRequest,
    user: AuthenticatedUser | null,
    usage: UsageTracker,
  ) => Promise<T>,
  action: 'upload' | 'query',
) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const { userId: clerkUserId } = await auth();
      let user: AuthenticatedUser | null = null;
      let usage: UsageTracker;

      if (clerkUserId) {
        const clerkUser = await currentUser();
        if (clerkUser) {
          const email =
            clerkUser.emailAddresses[0]?.emailAddress || 'user@example.com';
          const firstName = clerkUser.firstName ?? undefined;
          const lastName = clerkUser.lastName ?? undefined;
          const userId = ensureUser(clerkUserId, email, firstName, lastName);
          user = { userId, clerkUserId, email, firstName, lastName };
          usage = {
            uploads: 0,
            queries: 0,
            sessionId: clerkUserId,
            isAuthenticated: true,
            userId,
          };
        } else {
          usage = getUsageFromCookie(request);
        }
      } else {
        usage = getUsageFromCookie(request);
      }

      if (!usage.isAuthenticated && !checkUsageLimit(usage, action)) {
        const response = NextResponse.json(
          {
            error: 'Usage limit exceeded',
            limitExceeded: true,
            limits: ANONYMOUS_LIMITS,
            currentUsage: {
              uploads: usage.uploads,
              queries: usage.queries,
              total: usage.uploads + usage.queries,
            },
          },
          { status: 429 },
        );
        setUsageCookie(response, usage);
        return response;
      }

      const result = await handler(request, user, usage);
      const updatedUsage = incrementUsage(usage, action);
      const response = NextResponse.json(result);
      setUsageCookie(response, updatedUsage);
      return response;
    } catch (error) {
      console.error('Freemium handler error:', error);
      const isProd = process.env.NODE_ENV === 'production';
      const payload: Record<string, unknown> = {
        error: 'Internal server error',
      };
      if (!isProd) {
        payload.details = (error as Error)?.message || String(error);
      }
      return NextResponse.json(payload, { status: 500 });
    }
  };
};
