import { NextRequest } from 'next/server';
import { extractTextFromFile, chunkDocument } from '@/lib/documentProcessing';
import { addDocuments } from '@/lib/qdrant';
import { saveDocument } from '@/lib/database';
import { withFreemium } from '@/lib/freemium';

export const POST = withFreemium(async (request: NextRequest, user, usage) => {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    throw new Error('No file provided');
  }

  // Extract text from file
  const content = await extractTextFromFile(file);
  
  // Create document chunks
  const documentId = `doc-${Date.now()}-${usage.sessionId}`;
  const chunks = await chunkDocument(documentId, content);

  // Save document metadata only for authenticated users
  if (user) {
    saveDocument({
      id: documentId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      userId: user.userId,
    });
  }

  // Store in vector database
  const documents = chunks.map(chunk => ({
    pageContent: chunk.content,
    metadata: {
      documentId: chunk.documentId,
      chunkId: chunk.id,
      chunkIndex: chunk.metadata.chunkIndex,
      startChar: chunk.metadata.startChar,
      endChar: chunk.metadata.endChar,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    },
  }));

  await addDocuments(documents, {
    sessionId: usage.sessionId,
    isAnonymous: !usage.isAuthenticated,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  });

  const remainingUsage = {
    uploads: usage.isAuthenticated ? Infinity : (3 - (usage.uploads + 1)),
    queries: usage.isAuthenticated ? Infinity : (5 - usage.queries),
    total: usage.isAuthenticated ? Infinity : (5 - (usage.uploads + usage.queries + 1)),
  };

  return {
    documentId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    chunksCount: chunks.length,
    message: 'Document uploaded and processed successfully',
    remainingUsage,
    isAuthenticated: usage.isAuthenticated,
  };
}, 'upload');