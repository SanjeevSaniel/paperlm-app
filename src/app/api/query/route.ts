export const runtime = 'nodejs';

import { generateAIResponse, generateQueryVariations, enhanceResponseFormatting } from '@/lib/ai';
import type { RAGResult } from '@/lib/qdrant';
import { similaritySearch } from '@/lib/qdrant';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';


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

// interface ChatMessage {
//   role: 'system' | 'user' | 'assistant';
//   content: string;
//   citations?: string[];
// }

// interface QueryRequest {
//   message: string;
//   chatHistory?: ChatMessage[];
//   conversationContext?: {
//     previousCitations: string[];
//     currentTopic?: string;
//     documentIds?: string[];
//   };
// }


// interface Citation {
//   id: string;
//   documentId: string;
//   documentName: string;
//   documentType: string;
//   sourceUrl: string;
//   chunkId: string;
//   chunkIndex: number;
//   content: string;
//   relevanceScore: number;
//   uploadedAt: string;
//   isNew: boolean;
//   citationType: 'new' | 'reference';
// }

// function buildDynamicContext(
//   results: RAGResult[],
//   previousCitations: string[] = [],
//   maxChars = 4000,
// ) {
//   // Get unique document chunks not previously cited
//   const usedChunkIds = new Set(previousCitations);
//   const newResults = results.filter(
//     (r) => !usedChunkIds.has(r.metadata.chunkId),
//   );

//   // If no new results, use top results but mark as "reference"
//   const contexturalResults =
//     newResults.length > 0 ? newResults : results.slice(0, 3);

//   const chunks: string[] = [];
//   let total = 0;

//   for (const [index, r] of contexturalResults.entries()) {
//     const text = (r.pageContent || '').trim();
//     if (!text) continue;

//     const piece = text.length > 800 ? text.slice(0, 800) + '...' : text;
//     if (total + piece.length + 20 > maxChars) break;

//     // Add contextual markers
//     const isNew = !usedChunkIds.has(r.metadata.chunkId);
//     const prefix = isNew ? `[NEW-${index + 1}]` : `[REF-${index + 1}]`;

//     chunks.push(`${prefix} ${piece}`);
//     total += piece.length + 20;
//   }

//   return chunks.join('\n\n');
// }

// function extractConversationContext(chatHistory: ChatMessage[]) {
//   const recentMessages = chatHistory.slice(-6); // Last 3 exchanges
//   const topics = new Set<string>();
//   const previousCitations = new Set<string>();

//   recentMessages.forEach((msg) => {
//     if (msg.citations) {
//       msg.citations.forEach((c) => previousCitations.add(c));
//     }

//     // Simple topic extraction (you could use more sophisticated NLP)
//     const words = msg.content.toLowerCase().match(/\b\w{4,}\b/g) || [];
//     words.forEach((word) => {
//       if (
//         ![
//           'that',
//           'this',
//           'with',
//           'from',
//           'they',
//           'have',
//           'will',
//           'been',
//           'what',
//           'when',
//           'where',
//         ].includes(word)
//       ) {
//         topics.add(word);
//       }
//     });
//   });

//   return {
//     previousCitations: Array.from(previousCitations),
//     topics: Array.from(topics),
//     recentContext: recentMessages
//       .map((m) => m.content)
//       .join(' ')
//       .slice(0, 500),
//   };
// }

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
      return NextResponse.json(
        { error: 'No message provided' },
        { status: 400 },
      );
    }

    // Determine the storage identifier: email for authenticated users, sessionId for free users
    const storageId = userId && userEmail ? userEmail : sessionId;

    if (!storageId || typeof storageId !== 'string') {
      return NextResponse.json(
        { error: 'No user email or session ID provided' },
        { status: 400 },
      );
    }

    // console.log(`🔍 Searching for: "${message}"`);

    // Enhanced multi-query search for better context retrieval with storage isolation
    const primaryResults = await similaritySearch(message, 20, storageId);

    // Generate query variations to capture different semantic angles
    const queryVariations = await generateQueryVariations(message, chatHistory);
    const enhancedResults = await Promise.all(
      queryVariations.map((variation) =>
        similaritySearch(variation, 10, storageId),
      ),
    );

    // Combine and deduplicate results
    const allResults = [...primaryResults, ...enhancedResults.flat()];

    // Remove duplicates based on chunkId and sort by relevance
    const uniqueResults = Array.from(
      new Map(
        allResults.map((result) => [result.metadata.chunkId, result]),
      ).values(),
    );

    // Filter results by minimum similarity threshold (if using Qdrant scores)
    const results = uniqueResults.slice(0, 25); // Increased from 15 to 25

    if (!results || results.length === 0) {
      return NextResponse.json({
        response:
          "I don't have any relevant documents to answer this question. Please upload documents, add text input, or scrape websites first.",
        citations: [],
        context: false,
      });
    }

    // console.log(`📄 Found ${results.length} relevant chunks`);

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
    // console.log(
    //   `📝 Built context with ${context.length} characters from ${contextChunks.length} chunks`,
    // );

    // Build message array for AI generation
    const messages = [
      ...chatHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user' as const, content: message },
    ];

    // console.log(`🤖 Sending to AI with ${context.length} chars of context`);
    const rawResponse = await generateAIResponse(messages, context, {
      temperature: 0.3,
      maxTokens: 2000,
    });

    // Post-process response for enhanced formatting
    const response = enhanceResponseFormatting(
      rawResponse ||
        "I apologize, but I couldn't generate a proper response. Please try again.",
    );

    // Create single most relevant citation
    const citations = [];

    if (results.length > 0) {
      // Get the most relevant result (first in sorted array)
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
        relevanceScore: 0.95, // Always high for the single most relevant result
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

    // console.log(`✅ Generated response with ${citations.length} citations`);

    return NextResponse.json({
      response,
      citations,
      context: true,
      searchResults: results.length,
      textInputChunks: textInputResults.length,
    });
  } catch (error) {
    console.error('❌ Query processing error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process query',
      },
      { status: 500 },
    );
  }
}
//
