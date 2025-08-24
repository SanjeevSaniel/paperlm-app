export const runtime = 'nodejs';

import { streamAIResponse } from '@/lib/ai';
import type { RAGResult } from '@/lib/qdrant';
import { searchWithUserContext, checkQdrantHealth } from '@/lib/improvedVectorSearch';
import { rewriteContext } from '@/lib/advancedRag';
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

// Function to select adjacent chunks for better context continuity
function selectAdjacentChunks(chunks: RAGResult[]): RAGResult[] {
  if (chunks.length <= 3) return chunks;

  // Find the best starting chunk (usually the first or most relevant)
  const startChunk = chunks[0];
  const selected = [startChunk];

  // Try to add adjacent chunks
  const currentIndex = startChunk.metadata.chunkIndex;

  // Add next chunk if available
  const nextChunk = chunks.find(
    (c) => c.metadata.chunkIndex === currentIndex + 1,
  );
  if (nextChunk) selected.push(nextChunk);

  // Add previous chunk if available
  const prevChunk = chunks.find(
    (c) => c.metadata.chunkIndex === currentIndex - 1,
  );
  if (prevChunk) selected.unshift(prevChunk);

  // Add any remaining high-relevance chunks (first few from the sorted list)
  const remaining = chunks.filter((c) => !selected.includes(c)).slice(0, 2);
  selected.push(...remaining);

  return selected.slice(0, 5); // Limit to 5 chunks per document
}

/**
 * Streaming query endpoint using Vercel AI SDK with RAG context
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const {
      message,
      chatHistory = [],
      sessionId,
      userEmail,
    } = await request.json();

    if (!message || typeof message !== 'string' || !message.trim()) {
      return new Response(
        JSON.stringify({ error: 'No message provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Determine the storage identifier: email for authenticated users, sessionId for free users
    const storageId = userId && userEmail ? userEmail : sessionId;

    if (!storageId || typeof storageId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'No user email or session ID provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check Qdrant health first
    const health = await checkQdrantHealth();
    console.log('🏥 Qdrant health:', health);

    // Enhanced search with advanced RAG techniques
    const results = await searchWithUserContext(message, storageId, {
      k: 25,
      chatHistory,
    });

    console.log(`📚 Found ${results.length} context results for query: "${message}"`);

    // Use improved context rewriting if we have results
    let rewrittenContext = '';
    if (results.length > 0) {
      const chunks = results.slice(0, 10).map(r => r.pageContent);
      const contextResult = await rewriteContext(chunks, message, 8000);
      rewrittenContext = contextResult.rewrittenContext;
      console.log(`🔄 Context rewritten with relevance score: ${contextResult.relevanceScore}`);
    }

    if (!results || results.length === 0) {
      return new Response(
        JSON.stringify({
          error: "I don't have any relevant documents to answer this question. Please upload documents, add text input, or scrape websites first.",
          citations: [],
          context: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build enhanced context with intelligent chunk selection
    const contextChunks: string[] = [];
    let totalChars = 0;
    const maxChars = 12000; // Doubled context window for better coverage

    // Group results by document for better context coherence
    const documentGroups = new Map<string, RAGResult[]>();
    results.forEach((result) => {
      const docId = result.metadata.documentId;
      if (!documentGroups.has(docId)) {
        documentGroups.set(docId, []);
      }
      documentGroups.get(docId)!.push(result);
    });

    // Sort document groups by relevance (based on first result's position)
    const sortedDocGroups = Array.from(documentGroups.entries()).sort(
      ([, a], [, b]) => {
        const aIndex = results.findIndex(
          (r) => r.metadata.documentId === a[0].metadata.documentId,
        );
        const bIndex = results.findIndex(
          (r) => r.metadata.documentId === b[0].metadata.documentId,
        );
        return aIndex - bIndex;
      },
    );

    // Priority 1: Text input chunks (highest priority)
    const textInputResults = results.filter(
      (r) => r.metadata.fileName === 'text-input.txt',
    );
    for (const result of textInputResults) {
      if (totalChars >= maxChars) break;
      const content = (result.pageContent || '').trim();
      if (!content) continue;

      const source = '[TEXT INPUT]';
      const contextPiece = `${source} ${content}`;

      if (totalChars + contextPiece.length + 50 <= maxChars) {
        contextChunks.push(contextPiece);
        totalChars += contextPiece.length + 50;
      }
    }

    // Priority 2: Process document groups with adjacent chunks for better context
    for (const [, docResults] of sortedDocGroups) {
      if (totalChars >= maxChars) break;

      // Skip text input as already processed
      if (docResults[0]?.metadata.fileName === 'text-input.txt') continue;

      // Sort chunks by position within document
      const sortedChunks = docResults.sort(
        (a, b) => a.metadata.chunkIndex - b.metadata.chunkIndex,
      );

      // Try to include adjacent chunks for better context continuity
      const selectedChunks = selectAdjacentChunks(sortedChunks);

      for (const result of selectedChunks) {
        if (totalChars >= maxChars) break;

        const content = (result.pageContent || '').trim();
        if (!content) continue;

        // Use longer chunks (1200 instead of 800) for better context
        const chunk =
          content.length > 1200 ? content.slice(0, 1200) + '...' : content;
        const source = `[${result.metadata.fileName}]`;
        const chunkInfo = `[Chunk ${result.metadata.chunkIndex + 1}]`;
        const contextPiece = `${source} ${chunkInfo} ${chunk}`;

        if (totalChars + contextPiece.length + 50 <= maxChars) {
          contextChunks.push(contextPiece);
          totalChars += contextPiece.length + 50;
        }
      }
    }

    const context = contextChunks.join('\n\n');

    // Build message array for AI generation
    const messages = [
      ...chatHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user' as const, content: message },
    ];

    // Stream AI response with context
    const streamResponse = await streamAIResponse(messages, context, {
      temperature: 0.3,
      maxTokens: 2000,
    });

    // Create single most relevant citation for client
    const citations = [];
    if (results.length > 0) {
      const topResult = results[0];
      const citation = {
        id: `citation-${topResult.metadata.chunkId}`,
        documentId: topResult.metadata.documentId,
        documentName: topResult.metadata.fileName || 'Unknown Document',
        documentType: topResult.metadata.fileType || 'text/plain',
        sourceUrl: topResult.metadata.sourceUrl,
        chunkId: topResult.metadata.chunkId,
        chunkIndex: topResult.metadata.chunkIndex || 0,
        content:
          topResult.pageContent.length > 200
            ? topResult.pageContent.slice(0, 200) + '...'
            : topResult.pageContent,
        fullContent: topResult.pageContent,
        relevanceScore: 0.95,
        uploadedAt: topResult.metadata.uploadedAt || new Date().toISOString(),
        isTextInput: topResult.metadata.fileName === 'text-input.txt',
        author:
          'author' in topResult.metadata
            ? (topResult.metadata.author as string)
            : undefined,
        publishedAt:
          'publishedAt' in topResult.metadata
            ? (topResult.metadata.publishedAt as string)
            : undefined,
      };
      citations.push(citation);
    }

    // Set up response headers for streaming with metadata
    const headers = new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Citations': JSON.stringify(citations),
      'X-Context': 'true',
      'X-Search-Results': results.length.toString(),
      'X-Text-Input-Chunks': textInputResults.length.toString(),
    });

    return new Response(streamResponse.body, {
      headers,
      status: 200,
    });

  } catch (error) {
    console.error('❌ Streaming query processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process streaming query' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}