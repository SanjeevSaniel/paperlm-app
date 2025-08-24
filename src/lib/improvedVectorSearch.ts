/**
 * Improved Vector Search System
 * Fixing Qdrant integration and adding advanced search capabilities
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import { generateEmbeddings, generateHyDE, rewriteContext, expandQuery } from './advancedRag';
import type { RAGResult, RAGMetadata } from './qdrant';
import { UserRepository } from './repositories/userRepository';

const COLLECTION_NAME = 'paperlm_documents';

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

/**
 * Advanced similarity search with multiple strategies
 */
export async function advancedSimilaritySearch(
  query: string,
  options: {
    k?: number;
    sessionId?: string;
    userId?: string;
    useHyDE?: boolean;
    useExpansion?: boolean;
    chatHistory?: { role: string; content: string }[];
  } = {}
): Promise<RAGResult[]> {
  const {
    k = 10,
    sessionId,
    userId,
    useHyDE = true,
    useExpansion = true,
    chatHistory = [],
  } = options;

  try {
    // Step 1: Generate search strategies
    const searchStrategies: string[] = [query];

    if (useHyDE) {
      const hydeResult = await generateHyDE(query);
      searchStrategies.push(hydeResult.hypotheticalDocument);
      searchStrategies.push(...hydeResult.refinedQueries);
    }

    if (useExpansion) {
      const expandedQueries = await expandQuery(query, chatHistory);
      searchStrategies.push(...expandedQueries);
    }

    // Step 2: Perform searches with different strategies
    const allResults: RAGResult[] = [];
    
    for (const searchQuery of searchStrategies.slice(0, 5)) { // Limit to 5 strategies
      const results = await performVectorSearch(searchQuery, k, sessionId, userId);
      allResults.push(...results);
    }

    // Step 3: Deduplicate and rank results
    const uniqueResults = deduplicateResults(allResults);
    const rankedResults = rankResults(uniqueResults, query);

    // Step 4: Select best results with context rewriting
    const bestResults = rankedResults.slice(0, k);
    
    if (bestResults.length > 0) {
      const chunks = bestResults.map(r => r.pageContent);
      const rewriteResult = await rewriteContext(chunks, query, 2000);
      
      // Add rewritten context to metadata
      bestResults.forEach(result => {
        result.metadata.contextBefore = rewriteResult.condensedSummary;
        result.metadata.confidence = rewriteResult.relevanceScore;
      });
    }

    console.log(`🎯 Advanced search found ${bestResults.length} results for: "${query}"`);
    return bestResults;

  } catch (error) {
    console.error('Advanced similarity search failed:', error);
    // Fallback to simple search
    return await performVectorSearch(query, k, sessionId, userId);
  }
}

/**
 * Core vector search function with fixed Qdrant integration
 */
async function performVectorSearch(
  query: string,
  k: number,
  sessionId?: string,
  userId?: string
): Promise<RAGResult[]> {
  const c = getClient();
  
  if (!c) {
    console.warn('Qdrant client not available, using memory fallback');
    return [];
  }

  try {
    // Generate embeddings
    const embeddings = await generateEmbeddings([query]);
    const queryEmbedding = embeddings[0];

    if (!queryEmbedding) {
      console.warn('Failed to generate query embedding');
      return [];
    }

    // Resolve user ID if we have sessionId but not userId
    const resolvedUserId = userId;
    if (!resolvedUserId && sessionId) {
      // Try to get user from session - this is a simplified approach
      // In a real scenario, you might need to query a sessions table
      console.log(`🔍 Searching with sessionId: ${sessionId}`);
    }

    // Build search request with correct Qdrant API format
    const searchRequest: any = {
      vector: queryEmbedding,
      limit: k,
      with_payload: true,
      with_vectors: false, // We don't need vectors in response
    };

    // Add filter if we have user/session info
    if (resolvedUserId) {
      searchRequest.filter = {
        must: [
          {
            key: 'userId',
            match: { value: resolvedUserId }
          }
        ]
      };
      console.log(`🔍 Filtering by userId: ${resolvedUserId}`);
    } else if (sessionId) {
      searchRequest.filter = {
        must: [
          {
            key: 'sessionId',
            match: { value: sessionId }
          }
        ]
      };
      console.log(`🔍 Filtering by sessionId: ${sessionId}`);
    }

    console.log('🚀 Performing Qdrant search with:', {
      hasFilter: !!searchRequest.filter,
      limit: k,
      embeddingDim: queryEmbedding.length
    });

    const response = await c.search(COLLECTION_NAME, searchRequest);
    
    if (!response || !Array.isArray(response)) {
      console.warn('Invalid Qdrant response:', response);
      return [];
    }

    const results = response.map((hit: any) => {
      const payload = hit.payload || {};
      
      const metadata: RAGMetadata = {
        documentId: String(payload.documentId || 'unknown'),
        chunkId: String(payload.chunkId || 'unknown'),
        chunkIndex: Number(payload.chunkIndex || 0),
        startChar: Number(payload.startChar || 0),
        endChar: Number(payload.endChar || 0),
        fileName: String(payload.fileName || 'Unknown Document'),
        fileType: String(payload.fileType || 'text/plain'),
        fileSize: Number(payload.fileSize || 0),
        sessionId: String(payload.sessionId || sessionId || 'unknown'),
        userId: String(payload.userId || resolvedUserId || 'unknown'),
        userType: payload.userType || 'unknown',
        uploadedAt: payload.uploadedAt,
        confidence: hit.score || 0,
        contextBefore: payload.contextBefore || '',
        contextAfter: payload.contextAfter || '',
      };

      return {
        pageContent: String(payload.pageContent || ''),
        metadata,
      };
    });

    console.log(`✅ Qdrant search returned ${results.length} results`);
    return results;

  } catch (error) {
    console.error('Qdrant search error:', error);
    
    // Log the specific error for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }

    return [];
  }
}

/**
 * Deduplicate search results based on chunk ID
 */
function deduplicateResults(results: RAGResult[]): RAGResult[] {
  const seen = new Set<string>();
  const unique: RAGResult[] = [];

  for (const result of results) {
    const key = result.metadata.chunkId;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(result);
    }
  }

  return unique;
}

/**
 * Rank results based on relevance and quality
 */
function rankResults(results: RAGResult[], originalQuery: string): RAGResult[] {
  const queryWords = originalQuery.toLowerCase().split(/\s+/);
  
  return results
    .map(result => {
      const content = result.pageContent.toLowerCase();
      
      // Calculate keyword overlap score
      const keywordMatches = queryWords.filter(word => 
        word.length > 2 && content.includes(word)
      ).length;
      const keywordScore = keywordMatches / Math.max(queryWords.length, 1);
      
      // Use existing confidence score or default to 0.5
      const confidenceScore = result.metadata.confidence || 0.5;
      
      // Content quality score based on length and structure
      const contentLength = result.pageContent.length;
      const qualityScore = Math.min(contentLength / 1000, 1); // Normalize to 0-1
      
      // Combined score
      const combinedScore = (keywordScore * 0.4) + (confidenceScore * 0.4) + (qualityScore * 0.2);
      
      return {
        ...result,
        metadata: {
          ...result.metadata,
          confidence: combinedScore,
        }
      };
    })
    .sort((a, b) => (b.metadata.confidence || 0) - (a.metadata.confidence || 0));
}

/**
 * Enhanced search with user context resolution
 */
export async function searchWithUserContext(
  query: string,
  storageId: string, // email or sessionId
  options: {
    k?: number;
    chatHistory?: { role: string; content: string }[];
  } = {}
): Promise<RAGResult[]> {
  const { k = 10, chatHistory = [] } = options;

  let userId: string | undefined;
  let sessionId: string | undefined;

  // Determine if storageId is email (userId) or sessionId
  if (storageId.includes('@')) {
    // It's an email, try to find the user
    try {
      const user = await UserRepository.findByClerkId(storageId);
      if (user) {
        userId = user.id;
      }
    } catch (error) {
      console.warn('Failed to resolve user by email:', error);
    }
  } else {
    // It's a sessionId
    sessionId = storageId;
  }

  console.log(`🔍 Searching with resolved context:`, {
    userId: userId ? `${userId.substring(0, 8)}...` : 'none',
    sessionId: sessionId ? `${sessionId.substring(0, 8)}...` : 'none',
    originalStorageId: storageId.substring(0, 20) + '...',
  });

  return await advancedSimilaritySearch(query, {
    k,
    userId,
    sessionId,
    useHyDE: true,
    useExpansion: true,
    chatHistory,
  });
}

/**
 * Check Qdrant collection health
 */
export async function checkQdrantHealth(): Promise<{
  connected: boolean;
  collectionExists: boolean;
  documentCount: number;
  error?: string;
}> {
  const c = getClient();
  
  if (!c) {
    return {
      connected: false,
      collectionExists: false,
      documentCount: 0,
      error: 'Qdrant client not available'
    };
  }

  try {
    // Check collections
    const collections = await c.getCollections();
    const collectionExists = collections.collections?.some(
      col => col.name === COLLECTION_NAME
    ) || false;

    let documentCount = 0;
    if (collectionExists) {
      try {
        const info = await c.getCollection(COLLECTION_NAME);
        documentCount = info.points_count || 0;
      } catch (error) {
        console.warn('Failed to get collection info:', error);
      }
    }

    return {
      connected: true,
      collectionExists,
      documentCount,
    };
  } catch (error) {
    return {
      connected: false,
      collectionExists: false,
      documentCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}