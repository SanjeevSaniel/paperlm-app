export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { extractTextFromFile, chunkDocument } from '@/lib/documentProcessing';
import { addDocuments } from '@/lib/qdrant';
import { saveDocument } from '@/lib/database';
import { withFreemium } from '@/lib/freemium';
import { uploadFile } from '@/lib/fileStorage';
import { addCleanupRecord } from '@/lib/cleanupDatabase';

export const POST = withFreemium(async (request: NextRequest, user, usage) => {
  const startTime = Date.now();
  console.log('Upload request received for user:', user?.userId || 'anonymous', 'sessionId:', usage.sessionId);
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    console.log('Processing file:', file.name, 'size:', file.size, 'type:', file.type);

    // Add file size check
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
    }

    // Upload file to storage first
    console.log('Uploading file to storage...');
    const storageResult = await uploadFile(file);
    console.log('File uploaded to storage:', storageResult.storageProvider, storageResult.fileId);

    const content = await extractTextFromFile(file);
    console.log('Extracted content length:', content.length);

    const documentId = `doc-${Date.now()}-${usage.sessionId}`;
    const chunks = await chunkDocument(documentId, content);
    console.log('Generated chunks:', chunks.length);

    if (user) {
      saveDocument({
        id: documentId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        userId: user.userId,
        // Add storage information
        storageFileId: storageResult.fileId,
        storageUrl: storageResult.url,
        storageProvider: storageResult.storageProvider,
      });
    }

    const documents = chunks.map((chunk) => ({
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

    console.log('Calling addDocuments with options:', {
      sessionId: usage.sessionId,
      isAnonymous: !usage.isAuthenticated,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    await addDocuments(documents, {
      sessionId: usage.sessionId,
      isAnonymous: !usage.isAuthenticated,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    // Add cleanup record for 48-hour deletion
    const uploadedAt = new Date();
    const expiresAt = new Date(uploadedAt.getTime() + (48 * 60 * 60 * 1000)); // 48 hours
    
    addCleanupRecord({
      documentId,
      sessionId: usage.sessionId,
      cloudinaryPublicId: storageResult.publicId,
      uploadedAt: uploadedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isAnonymous: !usage.isAuthenticated,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    console.log('Document upload completed successfully');

    return {
      documentId,
      fileName: file.name,
      chunksCount: chunks.length,
    };
  } catch (error) {
    console.error('Upload API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}, 'upload');
