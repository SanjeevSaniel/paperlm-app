import { chunkDocument, extractTextFromFile } from '@/lib/documentProcessing';
import { addDocuments } from '@/lib/qdrant';
import { auth } from '@clerk/nextjs/server';
import { getUserTypeFromId } from '@/lib/userIdGenerator';
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

    // Determine the storage identifier: email for authenticated users, sessionId for free users
    const storageId = userId && userEmail ? userEmail : sessionId;
    
    if (!storageId) {
      return NextResponse.json({ error: 'No user email or session ID provided' }, { status: 400 });
    }

    // For non-authenticated users, enforce document limit
    if (!userId) {
      // Here you could add a check against existing documents for this session
      // For now, the frontend will handle the limit checking
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

    // Generate unique document ID
    const documentId = `doc-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Chunk the document
    const chunks = await chunkDocument(documentId, text);
    // console.log(
    //   `📚 Created ${chunks.length} chunks for document ${documentId}`,
    // );

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
        sessionId: storageId, // Use email for authenticated users, sessionId for free users
        userId: userId || storageId || 'unknown',
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
    // console.log(
    //   `🔍 Adding ${docs.length} document chunks to vector database...`,
    // );
    await addDocuments(docs);
    // console.log(`✅ Successfully indexed ${docs.length} chunks`);

    return NextResponse.json({
      documentId,
      fileName: file.name,
      chunksCount: chunks.length,
      textLength: text.length,
      content: text, // Include the full text content
      isTextInput: file.name === 'text-input.txt',
      success: true,
    });
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
