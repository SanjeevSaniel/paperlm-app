import { auth } from '@clerk/nextjs/server';
import { DocumentRepository } from '@/lib/repositories/documentRepository';
import { UserRepository } from '@/lib/repositories/userRepository';
import { NextRequest, NextResponse } from 'next/server';

// Use the Document type from schema instead of defining our own
import { Document } from '@/db/schema';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    let documents: Document[] = [];

    if (userId) {
      // For authenticated users, get user and their documents for this session
      const user = await UserRepository.findByClerkId(userId);
      if (user) {
        documents = await DocumentRepository.findByUserAndSession(user.id, sessionId);
      }
    } else {
      // For anonymous users, get documents by session only
      documents = await DocumentRepository.findBySessionId(sessionId);
    }

    // Transform documents to match frontend expectations
    const transformedDocuments = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      content: doc.content || '',
      metadata: {
        size: doc.fileSize || 0,
        type: doc.fileType || 'text/plain',
        uploadedAt: doc.uploadedAt,
        chunksCount: doc.chunksCount,
        ...(doc.metadata as Record<string, unknown> || {}),
      },
      status: doc.status,
      sourceUrl: doc.sourceUrl,
      fileType: doc.fileType,
    }));

    return NextResponse.json({
      documents: transformedDocuments,
      count: transformedDocuments.length,
    });
  } catch (error) {
    console.error('Documents fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const sessionId = searchParams.get('sessionId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Find the document
    const document = await DocumentRepository.findById(documentId);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Authorization check
    if (userId) {
      const user = await UserRepository.findByClerkId(userId);
      if (user && document.userId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else {
      // For anonymous users, check session ID
      if (sessionId && document.sessionId !== sessionId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Delete the document
    const deleted = await DocumentRepository.delete(documentId);
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Document delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}