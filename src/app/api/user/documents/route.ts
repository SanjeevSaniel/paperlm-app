import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { Document } from '@/types';

// GET - Load user documents
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const userDoc = await User.findOne({ clerkId: user.id });
    if (!userDoc) {
      return NextResponse.json({ documents: [] });
    }

    return NextResponse.json({ documents: userDoc.documents });
  } catch (error) {
    console.error('Error loading documents:', error);
    return NextResponse.json(
      { error: 'Failed to load documents' },
      { status: 500 }
    );
  }
}

// POST - Sync user documents
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documents }: { documents: Document[] } = await request.json();

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

    // Update documents
    userDoc.documents = documents;
    await userDoc.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing documents:', error);
    return NextResponse.json(
      { error: 'Failed to sync documents' },
      { status: 500 }
    );
  }
}