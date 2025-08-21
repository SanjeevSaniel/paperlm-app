import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    let user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      // Create user if doesn't exist with placeholder email
      // This will be updated when we get the real email from Clerk
      const placeholderEmail = `${userId}@placeholder.local`;
      user = new User({
        clerkId: userId,
        email: placeholderEmail,
      });
      await user.save();
    }

    // Reset monthly usage if needed
    user.resetMonthlyUsage();
    await user.save();

    return NextResponse.json({
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        subscription: user.subscription,
        usage: user.usage,
        canUploadDocument: user.canUploadDocument(),
        canSendMessage: user.canSendMessage(),
        isSubscriptionExpired: user.isSubscriptionExpired(),
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

    await connectDB();
    
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'increment_document') {
      if (!user.canUploadDocument()) {
        return NextResponse.json(
          { error: 'Document upload limit reached' },
          { status: 403 }
        );
      }
      user.usage.documentsUploaded += 1;
      await user.save();
    } else if (action === 'increment_message') {
      if (!user.canSendMessage()) {
        return NextResponse.json(
          { error: 'Message limit reached' },
          { status: 403 }
        );
      }
      user.usage.messagesUsed += 1;
      await user.save();
    }

    return NextResponse.json({
      success: true,
      usage: user.usage,
      canUploadDocument: user.canUploadDocument(),
      canSendMessage: user.canSendMessage(),
    });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Failed to update user data' },
      { status: 500 }
    );
  }
}