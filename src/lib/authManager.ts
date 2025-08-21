/**
 * Simple and Robust Authentication Manager
 * Uses Clerk User ID directly as the primary identifier
 */

import { auth } from '@clerk/nextjs/server';

export interface UserAuthData {
  paperlmUserId: string;
  clerkUserId: string;
  email: string;
  userType: 'registered_free' | 'registered_pro';
  isAuthenticated: boolean;
  createdAt: Date;
}

/**
 * Get authenticated user data from Clerk
 * This is the single source of truth for user authentication
 */
export async function getAuthenticatedUser(): Promise<UserAuthData | null> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      console.log('No userId found in auth');
      return null;
    }

    console.log('Found userId in auth:', userId);
    console.log('Creating user auth data...');

    // For simplicity, we'll use the Clerk User ID directly
    // and get the email from the session context if needed
    const paperlmUserId = userId;

    // Since we have a valid userId from auth(), the user is authenticated
    // We'll use a default email for now and get the real email from the client
    return {
      paperlmUserId,
      clerkUserId: userId,
      email: 'user@example.com', // Placeholder - will be updated by client
      userType: 'registered_free', // Default type, can be upgraded later
      isAuthenticated: true,
      createdAt: new Date()
    };

  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Get user workspace URL
 * Simple redirect path based on user ID
 */
export function getUserWorkspaceUrl(userId: string): string {
  return `/paper/${userId}`;
}

/**
 * Validate if a user ID belongs to the authenticated user
 */
export async function validateUserOwnership(requestedUserId: string): Promise<boolean> {
  try {
    const authData = await getAuthenticatedUser();
    
    if (!authData) {
      return false;
    }

    // Check if the requested user ID matches the authenticated user
    return authData.paperlmUserId === requestedUserId;
  } catch (error) {
    console.error('Error validating user ownership:', error);
    return false;
  }
}

/**
 * Generate fallback user ID for error cases
 * Only used when Clerk authentication fails
 */
export function generateFallbackUserId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `fallback_${timestamp}_${random}`;
}