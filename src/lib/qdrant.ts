import { QdrantClient } from '@qdrant/js-client-rest';
import { v4 as uuidv4 } from 'uuid';
import openai from './openai';

const COLLECTION_NAME = 'paperlm_documents';

// Types for TS safety
export type RAGMetadata = {
  documentId: string;
  chunkId: string;
  chunkIndex: number;
  startChar: number;
  endChar: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  sessionId: string; // Legacy field, keeping for compatibility
  userId: string; // New user ID field with meaningful prefixes
  userType: 'registered_free' | 'registered_pro' | 'temporary' | 'session' | 'unknown';
  sourceUrl?: string;
  loader?: string;
  uploadedAt?: string;
  // Enhanced citation information
  pageNumber?: number;
  sectionTitle?: string;
  paragraphIndex?: number;
  lineNumber?: number;
  exactLocation?: string; // e.g., "Page 5, Section 2.1, Paragraph 3"
  confidence?: number; // Confidence score for the match
  contextBefore?: string; // Text before the match for better context
  contextAfter?: string; // Text after the match for better context
};

export type RAGResult = {
  pageContent: string;
  metadata: RAGMetadata;
};

// Simple in-memory fallback if Qdrant is unavailable
const memoryStore: Array<{
  id: string;
  content: string;
  embedding: number[];
  metadata: RAGMetadata;
}> = [];

let client: QdrantClient | null = null;

function getClient(): QdrantClient | null {
  if (client) return client;
  try {
    client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    });
    return client;
  } catch {
    return null;
  }
}

async function ensureCollection() {
  const c = getClient();
  if (!c) return;
  try {
    const collections = await c.getCollections();
    const exists = collections.collections?.some(
      (col) => col.name === COLLECTION_NAME,
    );
    if (!exists) {
      await c.createCollection(COLLECTION_NAME, {
        vectors: { size: 1536, distance: 'Cosine' }, // match model size
      });
      console.log('Created Qdrant collection:', COLLECTION_NAME);
    }
  } catch (e) {
    console.warn('Qdrant collection ensure failed:', e);
  }
}
ensureCollection().catch(() => {});

function fallbackEmbedding(text: string, dim = 1536): number[] {
  const vec = new Array(dim).fill(0);
  let seed = 0;
  for (let i = 0; i < text.length; i++)
    seed = (seed + text.charCodeAt(i)) % dim;
  vec[seed] = 1;
  return vec;
}

async function embed(text: string): Promise<number[]> {
  try {
    const res = await openai.embeddings.create({
      model: 'text-embedding-3-small', // 1536 dims
      input: text,
    });
    return res.data[0].embedding;
  } catch (e) {
    console.warn(
      'Embedding failed, using fallback:',
      (e as Error)?.message || e,
    );
    return fallbackEmbedding(text);
  }
}

export async function addDocuments(
  docs: Array<{
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
      sessionId: string; // Legacy field
      userId: string; // New user ID field
      userType: 'registered_free' | 'registered_pro' | 'temporary' | 'session' | 'unknown';
      sourceUrl?: string;
      loader?: string;
      uploadedAt?: string;
      // Enhanced citation information
      pageNumber?: number;
      sectionTitle?: string;
      paragraphIndex?: number;
      lineNumber?: number;
      exactLocation?: string;
      confidence?: number;
      contextBefore?: string;
      contextAfter?: string;
    };
  }>,
) {
  if (!docs.length) return;
  const c = getClient();

  const points: Array<{
    id: string;
    vector: number[];
    payload: Record<string, unknown>;
  }> = [];

  for (const d of docs) {
    const vector = await embed(d.pageContent);

    // CRITICAL: Validate vector dimension
    if (vector.length !== 1536) {
      console.error(`Vector dimension mismatch: ${vector.length} !== 1536`);
      throw new Error(
        `Vector dimension must be exactly 1536, got ${vector.length}`,
      );
    }

    // CRITICAL: Flatten payload - no nested objects for Qdrant Cloud
    const flatPayload = {
      content: d.pageContent,
      documentId: d.metadata.documentId,
      chunkId: d.metadata.chunkId,
      chunkIndex: d.metadata.chunkIndex,
      startChar: d.metadata.startChar,
      endChar: d.metadata.endChar,
      fileName: d.metadata.fileName,
      fileType: d.metadata.fileType,
      fileSize: d.metadata.fileSize,
      sessionId: d.metadata.sessionId, // Add session isolation
      sourceUrl: d.metadata.sourceUrl || null,
      loader: d.metadata.loader || null,
      uploadedAt: d.metadata.uploadedAt || new Date().toISOString(),
    };

    // ✅ Use UUID for Qdrant point ID
    points.push({
      id: uuidv4(), // ensure this is unique
      vector,
      payload: flatPayload,
    });

    // Store in memory fallback too
    const metadata: RAGMetadata = {
      documentId: d.metadata.documentId,
      chunkId: d.metadata.chunkId,
      chunkIndex: d.metadata.chunkIndex,
      startChar: d.metadata.startChar,
      endChar: d.metadata.endChar,
      fileName: d.metadata.fileName,
      fileType: d.metadata.fileType,
      fileSize: d.metadata.fileSize,
      sessionId: d.metadata.sessionId, // Add session isolation
      sourceUrl: d.metadata.sourceUrl,
      loader: d.metadata.loader,
      uploadedAt: d.metadata.uploadedAt || new Date().toISOString(),
      userId: d.metadata.userId || 'anonymous',
      userType: d.metadata.userType || 'free',
    };

    memoryStore.push({
      id: uuidv4(), // unique ID for memory store
      content: d.pageContent,
      embedding: vector,
      metadata,
    });
  }

  if (c) {
    try {
      // Log first point for debugging
      console.log(
        'Sample point structure:',
        JSON.stringify(points[0], null, 2),
      );

      await c.upsert(COLLECTION_NAME, { wait: true, points });
      console.log(`✅ Qdrant upsert success: ${points.length} points`);
    } catch (e) {
      console.error('❌ Qdrant upsert failed:', e);
      // Log the actual error details
      if (e && typeof e === 'object' && 'data' in e) {
        console.error('Qdrant error details:', (e as { data?: unknown }).data);
      }
      console.warn('Using memory fallback only');
    }
  } else {
    console.warn('Qdrant client not available; using memory fallback only');
  }
}

export async function similaritySearch(
  query: string,
  k = 8,
  sessionId?: string, // Legacy parameter, keeping for compatibility
  userId?: string, // New user ID parameter
): Promise<RAGResult[]> {
  const c = getClient();
  const qEmb = await embed(query);

  if (c) {
    try {
      const searchParams: {
        vector: number[];
        limit: number;
        with_payload: boolean;
        filter?: {
          must: Array<{
            key: string;
            match: { value: string };
          }>;
        };
      } = {
        vector: qEmb,
        limit: k,
        with_payload: true,
      };

      // Add user/session filter - prioritize userId over sessionId
      if (userId || sessionId) {
        searchParams.filter = {
          must: [
            {
              key: userId ? 'userId' : 'sessionId',
              match: { value: userId || sessionId! }
            }
          ]
        };
      }

      const hits = await c.search(COLLECTION_NAME, searchParams);

      const results = (hits || []).map((h) => {
        const p = h.payload as Record<string, unknown>;
        // Handle flattened payload structure
        const meta: RAGMetadata = {
          documentId:
            typeof p?.documentId === 'string'
              ? p.documentId
              : String(p?.documentId ?? 'unknown'),
          chunkId:
            typeof p?.chunkId === 'string'
              ? p.chunkId
              : String(p?.chunkId ?? 'chunk'),
          chunkIndex: Number(p?.chunkIndex ?? 0),
          startChar: Number(p?.startChar ?? 0),
          endChar: Number(p?.endChar ?? 0),
          fileName:
            typeof p?.fileName === 'string'
              ? p.fileName
              : String(p?.fileName ?? 'Document'),
          fileType:
            typeof p?.fileType === 'string'
              ? p.fileType
              : String(p?.fileType ?? 'text/plain'),
          fileSize: Number(p?.fileSize ?? 0),
          sessionId:
            typeof p?.sessionId === 'string'
              ? p.sessionId
              : String(p?.sessionId ?? 'unknown'),
          userId:
            typeof p?.userId === 'string'
              ? p.userId
              : String(p?.userId ?? p?.sessionId ?? 'unknown'),
          userType:
            typeof p?.userType === 'string' && 
            ['registered_free', 'registered_pro', 'temporary', 'session', 'unknown'].includes(p.userType)
              ? p.userType as 'registered_free' | 'registered_pro' | 'temporary' | 'session' | 'unknown'
              : 'unknown',
          sourceUrl: typeof p?.sourceUrl === 'string' ? p.sourceUrl : undefined,
          loader: typeof p?.loader === 'string' ? p.loader : undefined,
          uploadedAt:
            typeof p?.uploadedAt === 'string' ? p.uploadedAt : undefined,
          // Enhanced citation information
          pageNumber: typeof p?.pageNumber === 'number' ? p.pageNumber : undefined,
          sectionTitle: typeof p?.sectionTitle === 'string' ? p.sectionTitle : undefined,
          paragraphIndex: typeof p?.paragraphIndex === 'number' ? p.paragraphIndex : undefined,
          lineNumber: typeof p?.lineNumber === 'number' ? p.lineNumber : undefined,
          exactLocation: typeof p?.exactLocation === 'string' ? p.exactLocation : undefined,
          confidence: typeof p?.confidence === 'number' ? p.confidence : h.score,
          contextBefore: typeof p?.contextBefore === 'string' ? p.contextBefore : undefined,
          contextAfter: typeof p?.contextAfter === 'string' ? p.contextAfter : undefined,
        };
        return {
          pageContent: typeof p?.content === 'string' ? p.content : '',
          metadata: meta,
        };
      });

      if (results.length > 0) {
        console.log(`✅ Qdrant search success: ${results.length} results`);
        return results;
      }
    } catch (e) {
      console.warn('❌ Qdrant search failed; using memory fallback:', e);
    }
  }

  // Memory fallback with session filtering
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

  // Filter by userId or sessionId if provided
  const filteredStore = (userId || sessionId)
    ? memoryStore.filter((item) => 
        userId ? item.metadata.userId === userId : item.metadata.sessionId === sessionId
      )
    : memoryStore;

  const results = filteredStore
    .map((c) => ({ c, score: cosine(qEmb, c.embedding) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, k)
    .map(({ c }) => ({
      pageContent: c.content,
      metadata: c.metadata,
    }));

  console.log(`📝 Memory fallback search: ${results.length} results`);
  return results;
}
