import { auth } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/userRepository';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Clerk user data for more complete user creation
    let clerkUser = null;
    try {
      const { createClerkClient } = await import('@clerk/backend');
      const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      clerkUser = await client.users.getUser(userId);
    } catch (clerkError) {
      console.warn('Could not fetch Clerk user details:', clerkError);
    }

    // Use actual email from Clerk or fallback to placeholder
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress || `${userId}@placeholder.local`;
    
    // Prepare additional user data from Clerk
    const additionalData = {
      firstName: clerkUser?.firstName || null,
      lastName: clerkUser?.lastName || null,
      profileImageUrl: clerkUser?.imageUrl || null,
      emailVerified: clerkUser?.emailAddresses?.[0]?.verification?.status === 'verified' || false,
      lastLoginAt: new Date(), // Update last login time
    };

    // Get or create user using NeonDB with complete data
    const user = await UserRepository.getOrCreate(userId, email, additionalData);
    
    if (!user) {
      console.error('Failed to create/retrieve user for:', userId);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        subscription: {
          plan: user.subscriptionPlan,
          status: user.subscriptionStatus,
          startDate: user.subscriptionStartDate,
          endDate: user.subscriptionEndDate,
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
        },
        usage: {
          documentsUploaded: user.documentsUploaded,
          messagesUsed: user.messagesUsed,
          lastResetDate: user.lastResetDate,
        },
        canUploadDocument: UserRepository.canUploadDocument(user),
        canSendMessage: UserRepository.canSendMessage(user),
        isSubscriptionExpired: UserRepository.isSubscriptionExpired(user),
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        needsOnboarding: UserRepository.needsOnboarding(user),
        onboardingCompletedAt: user.onboardingCompletedAt,
      }
    });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();
    
    let user = await UserRepository.findByClerkId(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'increment_document') {
      if (!UserRepository.canUploadDocument(user)) {
        return NextResponse.json(
          { error: 'Document upload limit reached' },
          { status: 403 }
        );
      }
      user = await UserRepository.incrementDocumentUsage(userId);
    } else if (action === 'increment_message') {
      if (!UserRepository.canSendMessage(user)) {
        return NextResponse.json(
          { error: 'Message limit reached' },
          { status: 403 }
        );
      }
      user = await UserRepository.incrementMessageUsage(userId);
    } else if (action === 'complete_onboarding') {
      user = await UserRepository.completeOnboarding(userId);
    }

    if (!user) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      usage: {
        documentsUploaded: user.documentsUploaded,
        messagesUsed: user.messagesUsed,
        lastResetDate: user.lastResetDate,
      },
      canUploadDocument: UserRepository.canUploadDocument(user),
      canSendMessage: UserRepository.canSendMessage(user),
    });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Failed to update user data' },
      { status: 500 }
    );
  }
}