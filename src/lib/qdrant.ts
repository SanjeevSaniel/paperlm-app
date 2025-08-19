import { QdrantClient } from '@qdrant/js-client-rest';
import openai from './openai';
import { saveChunks, getChunksByUser, ChunkRecord } from './database';
import { anonymousStore, AnonymousDocument } from './anonymousStorage';
import { v4 as uuidv4 } from 'uuid';

const COLLECTION_NAME = 'paperlm_documents';

// Initialize Qdrant client safely
let qdrantClient: QdrantClient | null = null;
function getQdrantClient(): QdrantClient | null {
  if (qdrantClient) return qdrantClient;
  try {
    qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    });
    return qdrantClient;
  } catch (e) {
    console.warn('Qdrant client init failed:', e);
    return null;
  }
}

async function ensureCollection() {
  const client = getQdrantClient();
  if (!client) {
    console.warn('❌ No Qdrant client available for collection setup');
    return;
  }
  
  try {
    console.log('🔍 Checking Qdrant collections...');
    const collections = await client.getCollections();
    console.log('📋 Available collections:', collections.collections?.map(c => c.name));
    
    const exists = collections.collections?.some(
      (c) => c.name === COLLECTION_NAME,
    );
    
    if (!exists) {
      console.log('🆕 Creating Qdrant collection:', COLLECTION_NAME);
      await client.createCollection(COLLECTION_NAME, {
        vectors: { size: 1536, distance: 'Cosine' },
      });
      console.log('✅ Created Qdrant collection:', COLLECTION_NAME);
    } else {
      console.log('✅ Qdrant collection already exists:', COLLECTION_NAME);
      
      // Check collection info
      const collectionInfo = await client.getCollection(COLLECTION_NAME);
      console.log('📊 Collection info:', {
        points_count: collectionInfo.points_count,
        status: collectionInfo.status
      });
    }
  } catch (e) {
    console.error('❌ Qdrant ensureCollection failed:', e);
  }
}

// Initialize collection on module load
console.log('🚀 Initializing Qdrant module...');
ensureCollection().catch(err => {
  console.error('💥 Qdrant initialization error:', err);
});

// Deterministic fallback embedding to prevent crashes when OpenAI fails/missing key
function fallbackEmbedding(text: string, dim = 1536): number[] {
  const vec = new Array(dim).fill(0);
  let seed = 0;
  for (let i = 0; i < text.length; i++)
    seed = (seed + text.charCodeAt(i)) % dim;
  vec[seed] = 1;
  return vec;
}

async function embedText(text: string): Promise<number[]> {
  try {
    const res = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return res.data[0].embedding;
  } catch (e) {
    console.warn(
      'OpenAI embedding failed, using fallback:',
      (e as Error).message || e,
    );
    return fallbackEmbedding(text, 1536);
  }
}

export const addDocuments = async (
  documents: Array<{
    pageContent: string;
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
  }>,
  options?: {
    sessionId?: string;
    isAnonymous?: boolean;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
  },
) => {
  console.log('=== addDocuments called ===');
  console.log('Documents count:', documents.length);
  console.log('Options:', options);
  console.log('First document sample:', documents[0]?.pageContent.substring(0, 100) + '...');
  
  if (documents.length === 0) {
    console.warn('No documents provided to addDocuments');
    return;
  }
  const client = getQdrantClient();
  const qdrantPoints: Array<{
    id: string;
    vector: number[];
    payload: {
      content: string;
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
      documentId: string;
      chunkIndex: number;
      fileName: string;
      fileType: string;
      fileSize: number;
    };
  }> = [];
  const chunksToPersist: ChunkRecord[] = [];
  const anonChunks: Array<{
    id: string;
    content: string;
    embedding: number[];
    chunkIndex: number;
    startChar: number;
    endChar: number;
  }> = [];

  for (const doc of documents) {
    const embedding = await embedText(doc.pageContent);

    qdrantPoints.push({
      id: uuidv4(), // Generate UUID for Qdrant point ID
      vector: embedding,
      payload: {
        content: doc.pageContent,
        metadata: doc.metadata,
        documentId: doc.metadata.documentId,
        chunkId: doc.metadata.chunkId, // Keep original chunk ID in payload
        chunkIndex: doc.metadata.chunkIndex,
        fileName: doc.metadata.fileName,
        fileType: doc.metadata.fileType,
        fileSize: doc.metadata.fileSize,
        uploadedAt: new Date().toISOString(), // Add timestamp for cleanup
        sessionId: options?.sessionId, // Add session ID
        isAnonymous: options?.isAnonymous || false, // Add anonymous flag
      },
    });

    if (options?.isAnonymous && options.sessionId) {
      anonChunks.push({
        id: doc.metadata.chunkId,
        content: doc.pageContent,
        embedding,
        chunkIndex: doc.metadata.chunkIndex,
        startChar: doc.metadata.startChar,
        endChar: doc.metadata.endChar,
      });
    } else {
      chunksToPersist.push({
        id: doc.metadata.chunkId,
        documentId: doc.metadata.documentId,
        content: doc.pageContent,
        embedding: JSON.stringify(embedding),
        chunkIndex: doc.metadata.chunkIndex,
        startChar: doc.metadata.startChar,
        endChar: doc.metadata.endChar,
        fileName: doc.metadata.fileName,
        fileType: doc.metadata.fileType,
        fileSize: doc.metadata.fileSize,
      } as ChunkRecord);
    }
  }

  console.log('Qdrant points prepared:', qdrantPoints.length);
  console.log('Sample point:', JSON.stringify(qdrantPoints[0], null, 2));

  // Try Qdrant upsert; on failure, fall back to local persistence
  if (client) {
    try {
      console.log('Attempting Qdrant upsert to collection:', COLLECTION_NAME);
      await client.upsert(COLLECTION_NAME, {
        wait: true,
        points: qdrantPoints,
      });
      console.log(`✅ Qdrant upsert SUCCESS: ${qdrantPoints.length} points`);
      return;
    } catch (e) {
      console.error('❌ Qdrant upsert FAILED:', e);
      // Log more detailed error information if available
      if (e && typeof e === 'object' && 'data' in e) {
        console.error('❌ Qdrant error details:', e.data);
      }
      console.warn('Falling back to local save');
    }
  } else {
    console.warn('❌ Qdrant client unavailable, falling back to local save');
  }

  // Fallbacks
  if (options?.isAnonymous && options.sessionId && anonChunks.length > 0) {
    const anonymousDoc: AnonymousDocument = {
      id: documents[0].metadata.documentId,
      sessionId: options.sessionId,
      fileName: options.fileName || 'Unknown',
      fileType: options.fileType || 'unknown',
      fileSize: options.fileSize || 0,
      uploadedAt: new Date().toISOString(),
      chunks: anonChunks,
    };
    anonymousStore.addDocument(anonymousDoc);
  } else if (chunksToPersist.length > 0) {
    saveChunks(chunksToPersist);
  }
};

export const similaritySearch = async (
  query: string,
  identifier: string,
  k = 5,
  isAnonymous = false,
) => {
  console.log('=== similaritySearch called ===');
  console.log('Query:', query.substring(0, 100) + '...');
  console.log('Identifier:', identifier);
  console.log('Is anonymous:', isAnonymous);
  
  const client = getQdrantClient();
  console.log('Qdrant client available:', !!client);
  
  // Try Qdrant first
  try {
    console.log('Generating query embedding...');
    const queryEmbedding = await embedText(query);
    console.log('Query embedding generated, length:', queryEmbedding.length);
    
    if (client) {
      console.log('Searching Qdrant collection:', COLLECTION_NAME);
      const hits = await client.search(COLLECTION_NAME, {
        vector: queryEmbedding,
        limit: k,
      });
      console.log('Qdrant search results:', hits.length, 'hits');
      
      type QdrantPayload = {
        content: string;
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
        documentId: string;
        chunkIndex: number;
        fileName: string;
        fileType: string;
        fileSize: number;
      };
      const results = (hits || []).map((h) => ({
        pageContent: (h.payload as QdrantPayload)?.content || '',
        metadata: (h.payload as QdrantPayload)?.metadata || {},
        score: h.score
      }));
      
      console.log('✅ Qdrant search SUCCESS:', results.length, 'results');
      if (results.length > 0) {
        console.log('Sample result:', results[0].pageContent.substring(0, 100) + '...');
        return results.map(r => ({ pageContent: r.pageContent, metadata: r.metadata }));
      }
      return results.map(r => ({ pageContent: r.pageContent }));
    }
  } catch (e) {
    console.error('❌ Qdrant search FAILED:', e);
    console.warn('Using local fallback');
  }

  // Local fallback: simple cosine over stored chunks
  let chunks: {
    id: string;
    content: string;
    embedding: number[];
  }[] = [];

  if (isAnonymous) {
    chunks = anonymousStore.getAllChunksBySession(identifier).map((c) => ({
      id: c.id,
      content: c.content,
      embedding: c.embedding,
    }));
  } else {
    const dbChunks = getChunksByUser(identifier);
    chunks = dbChunks.map((c) => ({
      id: c.id,
      content: c.content,
      embedding: JSON.parse(c.embedding) as number[],
    }));
  }

  if (chunks.length === 0) return [];

  const qEmb = await embedText(query);
  const cosine = (a: number[], b: number[]) => {
    let dot = 0,
      na = 0,
      nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
  };
  return chunks
    .map((c) => ({ c, score: cosine(qEmb, c.embedding) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, k)
    .map(({ c }) => ({ pageContent: c.content }));
};

export const cleanupAnonymousVectorsOlderThan = async (hours: number) => {
  console.log(`🧹 Starting Qdrant cleanup for data older than ${hours} hours`);
  
  const client = getQdrantClient();
  if (!client) {
    console.warn('❌ Qdrant client not available for cleanup');
    return { success: false, message: 'Qdrant client not available' };
  }

  try {
    // Calculate cutoff timestamp
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    console.log(`🕒 Cleanup cutoff time: ${cutoffTime.toISOString()}`);

    // Get collection info first
    const collectionInfo = await client.getCollection(COLLECTION_NAME);
    const totalPointsBefore = collectionInfo.points_count || 0;
    console.log(`📊 Total points before cleanup: ${totalPointsBefore}`);

    if (totalPointsBefore === 0) {
      console.log('✅ No points to cleanup');
      return { 
        success: true, 
        message: 'No points to cleanup',
        pointsDeleted: 0,
        pointsRemaining: 0
      };
    }

    // For now, we'll implement a simple cleanup that removes points based on a filter
    // In a more sophisticated implementation, you'd store timestamps in the payload
    // and filter based on those timestamps
    
    // This is a placeholder implementation that could be enhanced
    // to track actual upload timestamps in the point payloads
    console.log('🔍 Checking for old anonymous data...');
    
    // Get all points (in batches if needed)
    const scrollResult = await client.scroll(COLLECTION_NAME, {
      limit: 1000,
      with_payload: true
    });
    
    let pointsToDelete: string[] = [];
    
    if (scrollResult.points) {
      // Filter points that are older than the cutoff time
      scrollResult.points.forEach(point => {
        const payload = point.payload as any;
        
        if (payload) {
          // Check if point has timestamp and is older than cutoff
          if (payload.uploadedAt) {
            const uploadTime = new Date(payload.uploadedAt);
            if (uploadTime < cutoffTime) {
              pointsToDelete.push(point.id.toString());
              return;
            }
          }
          
          // Also clean up old anonymous sessions (fallback for data without timestamps)
          if (payload.isAnonymous === true || 
              (typeof payload.documentId === 'string' && payload.documentId.includes('anon_'))) {
            pointsToDelete.push(point.id.toString());
          }
        }
      });
    }

    if (pointsToDelete.length === 0) {
      console.log('✅ No old anonymous points found to cleanup');
      return {
        success: true,
        message: 'No old anonymous points found',
        pointsDeleted: 0,
        pointsRemaining: totalPointsBefore
      };
    }

    console.log(`🗑️ Deleting ${pointsToDelete.length} old anonymous points...`);
    
    // Delete the old points
    await client.delete(COLLECTION_NAME, {
      points: pointsToDelete
    });

    // Get final count
    const finalCollectionInfo = await client.getCollection(COLLECTION_NAME);
    const totalPointsAfter = finalCollectionInfo.points_count || 0;
    const pointsDeleted = totalPointsBefore - totalPointsAfter;
    
    console.log(`✅ Cleanup completed: ${pointsDeleted} points deleted, ${totalPointsAfter} remaining`);
    
    return {
      success: true,
      message: `Cleanup completed: ${pointsDeleted} points deleted`,
      pointsDeleted,
      pointsRemaining: totalPointsAfter
    };

  } catch (error) {
    console.error('❌ Qdrant cleanup failed:', error);
    return {
      success: false,
      message: `Cleanup failed: ${error}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
