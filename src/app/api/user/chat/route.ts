import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { ChatMessage } from '@/types';

// GET - Load user chat history
export async function GET(request: NextRequest) {
  console.log('GET /api/user/chat called');
  try {
    const user = await currentUser();
    console.log('Current user:', user?.id || 'No user');
    
    if (!user) {
      console.log('Returning 401 - No user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Connecting to MongoDB...');
    await dbConnect();

    console.log('Finding user document...');
    const userDoc = await User.findOne({ clerkId: user.id });
    if (!userDoc) {
      console.log('No user document found, returning empty messages');
      return NextResponse.json({ messages: [] });
    }

    console.log('Returning chat history:', userDoc.chatHistory?.length || 0, 'messages');
    return NextResponse.json({ messages: userDoc.chatHistory || [] });
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