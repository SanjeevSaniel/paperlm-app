import { chunkDocument, extractTextFromFile } from '@/lib/documentProcessing';
import { extractTextFromFileEfficient, chunkDocumentEfficient } from '@/lib/efficientDocProcessing';
import { addDocuments } from '@/lib/qdrant';
import { auth } from '@clerk/nextjs/server';
import { getUserTypeFromId } from '@/lib/userIdGenerator';
import { DocumentRepository } from '@/lib/repositories/documentRepository';
import { UserRepository } from '@/lib/repositories/userRepository';
import { SessionRepository } from '@/lib/repositories/sessionRepository';
import { UserTrackingRepository } from '@/lib/repositories/userTrackingRepository';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🚀 Upload API called');
  try {
    const { userId } = await auth();
    console.log('👤 User ID from auth:', userId);
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sessionId = formData.get('sessionId') as string | null;
    const userEmail = formData.get('userEmail') as string | null;
    
    console.log('📋 Upload request data:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      sessionId,
      userEmail
    });

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get user if authenticated, or create anonymous user
    let user = null;
    let isAnonymousUser = false;
    
    if (userId) {
      // Authenticated user
      user = await UserRepository.findByClerkId(userId);
      if (!user) {
        const placeholderEmail = userEmail || `${userId}@placeholder.local`;
        user = await UserRepository.getOrCreate(userId, placeholderEmail);
      }
    } else {
      // Anonymous user - create a temporary user record
      isAnonymousUser = true;
      const anonymousEmail = `anonymous-${sessionId}@temp.local`;
      const anonymousClerkId = `anonymous-${sessionId}`;
      
      try {
        // Try to find existing anonymous user for this session
        user = await UserRepository.findByClerkId(anonymousClerkId);
        if (!user) {
          // Create new anonymous user
          user = await UserRepository.getOrCreate(anonymousClerkId, anonymousEmail);
          console.log(`👤 Created anonymous user for session: ${sessionId}`);
        }
      } catch (error) {
        console.error('Failed to create anonymous user:', error);
        return NextResponse.json({ error: 'Failed to create user session' }, { status: 500 });
      }
    }

    // For authenticated users, check upload limits
    if (user && !UserRepository.canUploadDocument(user)) {
      return NextResponse.json({ error: 'Document upload limit reached' }, { status: 403 });
    }

    // Check for duplicate files for authenticated users
    if (user) {
      const existingDocument = await DocumentRepository.findDuplicateByUserAndName(user.id, file.name);
      if (existingDocument) {
        return NextResponse.json({ 
          error: `A document with the name "${file.name}" already exists in your account.`,
          duplicate: true,
          existingDocumentId: existingDocument.id
        }, { status: 409 }); // Conflict status code
      }
    }

    // console.log(
    //   `📝 Processing file: ${file.name}, Type: ${file.type}, Size: ${file.size}`,
    // );

    // Extract text content using efficient processing
    console.log('📄 Starting text extraction from file...');
    const text = await extractTextFromFileEfficient(file);
    console.log('✅ Text extraction completed:', {
      textLength: text?.length || 0,
      preview: text?.substring(0, 100) + (text?.length > 100 ? '...' : '')
    });

    if (!text || text.trim().length < 3) {
      console.log('❌ Text extraction failed: No readable content found');
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
    console.log('💾 Creating document record in database...');
    
    // Use the user ID from the user we created or found
    if (!user?.id) {
      console.error('❌ No user ID available for document creation');
      return NextResponse.json({ error: 'User session not available' }, { status: 500 });
    }
    
    const newDocument = await DocumentRepository.create({
      userId: user.id,
      sessionId: sessionId,
      name: file.name,
      content: text,
      fileType: file.type || 'text/plain',
      fileSize: file.size,
      status: 'processing',
      metadata: {
        isTextInput: file.name === 'text-input.txt',
        userType: isAnonymousUser ? 'anonymous' : 'registered_free',
        isAnonymous: isAnonymousUser,
      },
    });

    if (!newDocument) {
      console.log('❌ Failed to create document record in database');
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 });
    }
    
    console.log('✅ Document record created:', {
      documentId: newDocument.id,
      status: newDocument.status,
      name: newDocument.name
    });

    // Track document upload if user is authenticated
    if (user && sessionId) {
      await UserTrackingRepository.trackDocumentUpload(
        user.id,
        sessionId,
        file.name,
        file.type,
        file.size
      );
      console.log('📄 Document upload tracked:', file.name);
    }

    try {
      // Use the document ID from NeonDB for Qdrant
      const documentId = newDocument.id;

      // Chunk the document using efficient processing
      console.log('✂️ Starting document chunking...');
      const chunks = await chunkDocumentEfficient(documentId, text, {
        chunkSize: 1200,
        chunkOverlap: 250,
        preserveStructure: true
      });
      console.log('✅ Chunking completed:', {
        chunksCount: chunks.length,
        firstChunkPreview: chunks[0]?.content?.substring(0, 100) + '...'
      });

      // Prepare documents for vector storage with enhanced metadata
      const docs = chunks.map((chunk) => ({
        pageContent: chunk.content,
        metadata: {
          documentId: chunk.documentId,
          chunkId: chunk.id,
          chunkIndex: chunk.metadata.chunkIndex || 0,
          startChar: chunk.metadata.startChar || 0,
          endChar: chunk.metadata.endChar || 0,
          fileName: file.name,
          fileType: file.type || 'text/plain',
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          sessionId: sessionId,
          userId: user.id,
          userType: (isAnonymousUser ? 'temporary' : 'registered_free') as 'registered_free' | 'registered_pro' | 'temporary' | 'session' | 'unknown',
          // Enhanced metadata from efficient processing
          isTextInput: file.name === 'text-input.txt',
          wordCount: 0,
          chunkQuality: 0.5,
          contentType: 'paragraph',
          hasStructure: false,
          // Required fields
          sourceUrl: '',
          loader: undefined,
          extractedSections: [],
          contextBefore: '',
          contextAfter: '',
        },
      }));

      // Add to vector database
      console.log('🔗 Adding documents to vector database (Qdrant)...');
      await addDocuments(docs);
      console.log('✅ Documents added to vector database successfully');

      // Update document status and processing info
      console.log(`📝 Updating document ${documentId} to ready status with ${chunks.length} chunks`);
      const updatedDocument = await DocumentRepository.updateProcessingResults(documentId, {
        chunksCount: chunks.length,
        qdrantCollectionId: 'paperlm_documents', // You might want to make this configurable
      });
      
      if (updatedDocument) {
        console.log(`✅ Document ${documentId} updated successfully, status: ${updatedDocument.status}`);
      } else {
        console.error(`❌ Failed to update document ${documentId} status`);
      }

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
      console.error('❌ Processing failed:', processingError);
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
