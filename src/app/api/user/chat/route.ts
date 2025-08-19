import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { ChatMessage } from '@/types';

// GET - Load user chat history
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const userDoc = await User.findOne({ clerkId: user.id });
    if (!userDoc) {
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({ messages: userDoc.chatHistory });
  } catch (error) {
    console.error('Error loading chat history:', error);
    return NextResponse.json(
      { error: 'Failed to load chat history' },
      { status: 500 }
    );
  }
}

// POST - Sync user chat history
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages }: { messages: ChatMessage[] } = await request.json();

    await dbConnect();

    // Find or create user
    let userDoc = await User.findOne({ clerkId: user.id });
    if (!userDoc) {
      userDoc = new User({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        firstName: user.firstName,
        lastName: user.lastName,
        documents: [],
        chatHistory: [],
        notes: [],
      });
    }

    // Update chat history
    userDoc.chatHistory = messages;
    await userDoc.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing chat history:', error);
    return NextResponse.json(
      { error: 'Failed to sync chat history' },
      { status: 500 }
    );
  }
}