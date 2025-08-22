import { chunkDocument, extractTextFromFile } from '@/lib/documentProcessing';
import { addDocuments } from '@/lib/qdrant';
import { auth } from '@clerk/nextjs/server';
import { getUserTypeFromId } from '@/lib/userIdGenerator';
import { DocumentRepository } from '@/lib/repositories/documentRepository';
import { UserRepository } from '@/lib/repositories/userRepository';
import { SessionRepository } from '@/lib/repositories/sessionRepository';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sessionId = formData.get('sessionId') as string | null;
    const userEmail = formData.get('userEmail') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get user if authenticated
    let user = null;
    if (userId) {
      user = await UserRepository.findByClerkId(userId);
      if (!user) {
        const placeholderEmail = userEmail || `${userId}@placeholder.local`;
        user = await UserRepository.getOrCreate(userId, placeholderEmail);
      }
    }

    // For authenticated users, check upload limits
    if (user && !UserRepository.canUploadDocument(user)) {
      return NextResponse.json({ error: 'Document upload limit reached' }, { status: 403 });
    }

    // console.log(
    //   `📝 Processing file: ${file.name}, Type: ${file.type}, Size: ${file.size}`,
    // );

    // Extract text content
    const text = await extractTextFromFile(file);

    if (!text || text.trim().length < 3) {
      return NextResponse.json(
        {
          error:
            'No readable text found in input. Please provide meaningful content.',
        },
        { status: 400 },
      );
    }

    // console.log(`✅ Extracted ${text.length} characters from ${file.name}`);

    // Create document record in NeonDB first
    const newDocument = await DocumentRepository.create({
      userId: user?.id || 'anonymous',
      sessionId: sessionId,
      name: file.name,
      content: text,
      fileType: file.type || 'text/plain',
      fileSize: file.size,
      status: 'processing',
      metadata: {
        isTextInput: file.name === 'text-input.txt',
        userType: userId ? 'registered_free' : (sessionId ? getUserTypeFromId(sessionId) : 'unknown'),
      },
    });

    if (!newDocument) {
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 });
    }

    try {
      // Use the document ID from NeonDB for Qdrant
      const documentId = newDocument.id;

      // Chunk the document
      const chunks = await chunkDocument(documentId, text);

      // Prepare documents for vector storage
      const docs = chunks.map((chunk) => ({
        pageContent: chunk.content,
        metadata: {
          documentId: chunk.documentId,
          chunkId: chunk.id,
          chunkIndex: chunk.metadata.chunkIndex,
          startChar: chunk.metadata.startChar,
          endChar: chunk.metadata.endChar,
          fileName: file.name,
          fileType: file.type || 'text/plain',
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          sessionId: sessionId,
          userId: userId || sessionId || 'unknown',
          userType: userId ? 'registered_free' : (sessionId ? getUserTypeFromId(sessionId) : 'unknown'),
          // Add special flag for text input
          isTextInput: file.name === 'text-input.txt',
          // Add missing required fields
          sourceUrl: '',
          loader: undefined,
          extractedSections: [],
          contextBefore: '',
          contextAfter: '',
        },
      }));

      // Add to vector database
      await addDocuments(docs);

      // Update document status and processing info
      const updatedDocument = await DocumentRepository.updateProcessingResults(documentId, {
        chunksCount: chunks.length,
        qdrantCollectionId: 'paperlm_documents', // You might want to make this configurable
      });

      // Update session tracking
      if (user) {
        await SessionRepository.getOrCreate(user.id, sessionId);
        await SessionRepository.incrementDocumentCount(sessionId);
      }

      return NextResponse.json({
        documentId,
        fileName: file.name,
        chunksCount: chunks.length,
        textLength: text.length,
        content: text, // Include the full text content
        isTextInput: file.name === 'text-input.txt',
        success: true,
      });

    } catch (processingError) {
      // If processing fails, update document status to error
      await DocumentRepository.updateStatus(newDocument.id, 'error');
      throw processingError;
    }
  } catch (error) {
    console.error('❌ Upload processing error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 },
    );
  }
}
