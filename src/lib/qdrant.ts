import openai from './openai';
import { saveChunks, getChunksByUser, ChunkRecord } from './database';
import { anonymousStore, AnonymousDocument } from './anonymousStorage';
import { QdrantClient } from '@qdrant/js-client-rest';

// Initialize Qdrant client
const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
});

const COLLECTION_NAME = 'paperlm_documents';

// Initialize collection if needed
const initializeQdrant = async () => {
  try {
    // Check if collection exists
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections?.some(
      collection => collection.name === COLLECTION_NAME
    );

    if (!collectionExists) {
      // Create collection
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 1536, // OpenAI text-embedding-3-small dimension
          distance: 'Cosine'
        }
      });
      console.log('Qdrant collection created successfully');
    }
  } catch (error) {
    console.error('Error initializing Qdrant:', error);
    // Fall back to in-memory storage if Qdrant is not available
  }
};

// Initialize on startup
initializeQdrant();

export interface DocumentVector {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    documentId: string;
    chunkId: string;
    chunkIndex: number;
    startChar: number;
    endChar: number;
    fileName: string;
    fileType: string;
    fileSize: number;
  };
}

export const addDocuments = async (
  documents: Array<{
    pageContent: string;
    metadata: DocumentVector['metadata'];
  }>,
  options?: {
    sessionId?: string;
    isAnonymous?: boolean;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
  }
) => {
  const chunks: ChunkRecord[] = [];
  const anonymousChunks: any[] = [];
  const qdrantPoints: any[] = [];

  for (const doc of documents) {
    // Generate embedding using OpenAI
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: doc.pageContent,
    });

    const embedding = response.data[0].embedding;

    // Prepare point for Qdrant
    const qdrantPoint = {
      id: doc.metadata.chunkId,
      vector: embedding,
      payload: {
        content: doc.pageContent,
        documentId: doc.metadata.documentId,
        chunkIndex: doc.metadata.chunkIndex,
        startChar: doc.metadata.startChar,
        endChar: doc.metadata.endChar,
        fileName: doc.metadata.fileName,
        fileType: doc.metadata.fileType,
        fileSize: doc.metadata.fileSize,
        sessionId: options?.sessionId,
        isAnonymous: options?.isAnonymous || false,
        uploadedAt: new Date().toISOString(),
      }
    };

    qdrantPoints.push(qdrantPoint);

    if (options?.isAnonymous && options.sessionId) {
      // Store for anonymous user (fallback)
      anonymousChunks.push({
        id: doc.metadata.chunkId,
        content: doc.pageContent,
        embedding,
        chunkIndex: doc.metadata.chunkIndex,
        startChar: doc.metadata.startChar,
        endChar: doc.metadata.endChar,
      });
    } else {
      // Store for authenticated user (fallback)
      const chunk: ChunkRecord = {
        id: doc.metadata.chunkId,
        documentId: doc.metadata.documentId,
        content: doc.pageContent,
        embedding: JSON.stringify(embedding),
        chunkIndex: doc.metadata.chunkIndex,
        startChar: doc.metadata.startChar,
        endChar: doc.metadata.endChar,
      };

      chunks.push(chunk);
    }
  }

  try {
    // Try to store in Qdrant
    await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points: qdrantPoints
    });
    console.log(`Successfully stored ${qdrantPoints.length} documents in Qdrant`);
  } catch (error) {
    console.error('Error storing in Qdrant, falling back to local storage:', error);
    
    // Fallback to original storage methods
    if (options?.isAnonymous && options.sessionId && anonymousChunks.length > 0) {
      // Save to anonymous storage
      const anonymousDoc: AnonymousDocument = {
        id: documents[0].metadata.documentId,
        sessionId: options.sessionId,
        fileName: options.fileName || 'Unknown',
        fileType: options.fileType || 'unknown',
        fileSize: options.fileSize || 0,
        uploadedAt: new Date().toISOString(),
        chunks: anonymousChunks,
      };

      anonymousStore.addDocument(anonymousDoc);
    } else if (chunks.length > 0) {
      // Save to database for authenticated users
      saveChunks(chunks);
    }
  }
};

export const similaritySearch = async (
  query: string, 
  identifier: string, 
  k: number = 5,
  isAnonymous: boolean = false
) => {
  try {
    // Generate query embedding
    const queryResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const queryEmbedding = queryResponse.data[0].embedding;

    // Search in Qdrant
    const searchResult = await qdrantClient.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      limit: k,
      filter: {
        must: isAnonymous 
          ? [{ key: 'sessionId', match: { value: identifier } }, { key: 'isAnonymous', match: { value: true } }]
          : [{ key: 'sessionId', match: { value: identifier } }, { key: 'isAnonymous', match: { value: false } }]
      }
    });

    return searchResult.map(result => ({
      pageContent: result.payload?.content || '',
      metadata: {
        documentId: result.payload?.documentId,
        chunkId: result.id,
        chunkIndex: result.payload?.chunkIndex,
        startChar: result.payload?.startChar,
        endChar: result.payload?.endChar,
        fileName: result.payload?.fileName,
        fileType: result.payload?.fileType,
        fileSize: result.payload?.fileSize,
      },
      score: result.score || 0
    }));
  } catch (error) {
    console.error('Error searching in Qdrant, falling back to local storage:', error);
    
    // Fallback to original search method
    let chunks: any[] = [];

    if (isAnonymous) {
      // Get chunks from anonymous storage
      chunks = anonymousStore.getAllChunksBySession(identifier);
    } else {
      // Get chunks from database for authenticated user
      const dbChunks = getChunksByUser(identifier);
      chunks = dbChunks.map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        embedding: JSON.parse(chunk.embedding) as number[],
        metadata: {
          documentId: chunk.documentId,
          chunkId: chunk.id,
          chunkIndex: chunk.chunkIndex,
          startChar: chunk.startChar,
          endChar: chunk.endChar,
          fileName: chunk.fileName,
          fileType: chunk.fileType,
          fileSize: chunk.fileSize,
        },
      }));
    }
    
    if (chunks.length === 0) {
      return [];
    }

    // Generate query embedding
    const queryResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const queryEmbedding = queryResponse.data[0].embedding;

    // Calculate cosine similarity for each chunk
    const similarities = chunks.map(chunk => {
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
      return {
        chunk,
        similarity,
      };
    });

    // Sort by similarity and return top k
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k)
      .map(result => ({
        pageContent: result.chunk.content,
        metadata: result.chunk.metadata,
      }));
  }
};

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dotProduct / (normA * normB);
}