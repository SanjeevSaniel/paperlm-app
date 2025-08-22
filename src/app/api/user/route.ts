import { auth } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/userRepository';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create user using NeonDB
    const placeholderEmail = `${userId}@placeholder.local`;
    const user = await UserRepository.getOrCreate(userId, placeholderEmail);
    
    if (!user) {
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