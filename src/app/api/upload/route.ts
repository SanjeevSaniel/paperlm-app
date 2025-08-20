import { chunkDocument, extractTextFromFile } from '@/lib/documentProcessing';
import { addDocuments } from '@/lib/qdrant';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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
        // Add special flag for text input
        isTextInput: file.name === 'text-input.txt',
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
