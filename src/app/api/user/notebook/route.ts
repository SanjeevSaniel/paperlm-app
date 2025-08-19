import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

interface NotebookNote {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  tags?: string[];
  metadata?: {
    wordCount: number;
    lastModified: Date;
  };
}

// GET - Load user notebook notes
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const userDoc = await User.findOne({ clerkId: user.id });
    if (!userDoc) {
      return NextResponse.json({ notes: [] });
    }

    return NextResponse.json({ notes: userDoc.notes });
  } catch (error) {
    console.error('Error loading notebook:', error);
    return NextResponse.json(
      { error: 'Failed to load notebook' },
      { status: 500 }
    );
  }
}

// POST - Sync user notebook notes
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notes }: { notes: NotebookNote[] } = await request.json();

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

    // Update notes
    userDoc.notes = notes;
    await userDoc.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing notebook:', error);
    return NextResponse.json(
      { error: 'Failed to sync notebook' },
      { status: 500 }
    );
  }
}