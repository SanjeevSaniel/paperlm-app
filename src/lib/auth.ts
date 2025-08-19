import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { ensureUser } from './database';

export interface AuthenticatedUser {
  userId: string;
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export const withAuth = <T>(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<T>
) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const { userId: clerkUserId } = await auth();
      
      if (!clerkUserId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Get detailed user info from Clerk
      const clerkUser = await currentUser();
      
      if (!clerkUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        );
      }

      const email = clerkUser.emailAddresses[0]?.emailAddress || 'user@example.com';
      const firstName = clerkUser.firstName;
      const lastName = clerkUser.lastName;

      // Ensure user exists in our database
      const userId = ensureUser(clerkUserId, email, firstName, lastName);

      const user: AuthenticatedUser = {
        userId,
        clerkUserId,
        email,
        firstName,
        lastName,
      };

      const result = await handler(request, user);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Auth handler error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
};