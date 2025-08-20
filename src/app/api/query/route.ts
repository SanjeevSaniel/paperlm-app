export const runtime = 'nodejs';

import { generateChatCompletion } from '@/lib/openai';
import openai from '@/lib/openai';
import type { RAGResult } from '@/lib/qdrant';
import { similaritySearch } from '@/lib/qdrant';
import { NextRequest, NextResponse } from 'next/server';

// Generate query variations to improve context retrieval
async function generateQueryVariations(originalQuery: string, chatHistory: Array<{content: string}> = []): Promise<string[]> {
  try {
    // Extract context from recent chat history
    const recentContext = chatHistory
      .slice(-3)
      .map(msg => msg.content)
      .join(' ')
      .substring(0, 300);

    const prompt = `Given the user query "${originalQuery}" and recent conversation context: "${recentContext}"

Generate 2-3 alternative search queries that capture different semantic angles of the same question. Focus on:
1. Synonyms and alternative phrasings
2. More specific technical terms
3. Broader conceptual searches

Return only the alternative queries, one per line, without numbering or explanation.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    const variations = response.choices[0]?.message?.content
      ?.split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.trim())
      .slice(0, 3) || [];

    console.log(`🔍 Generated ${variations.length} query variations for: "${originalQuery}"`);
    return variations;
  } catch (error) {
    console.warn('⚠️ Query variation generation failed:', error);
    return []; // Return empty array on failure
  }
}

// Function to select adjacent chunks for better context continuity
function selectAdjacentChunks(chunks: RAGResult[]): RAGResult[] {
  if (chunks.length <= 3) return chunks;
  
  // Find the best starting chunk (usually the first or most relevant)
  const startChunk = chunks[0];
  const selected = [startChunk];
  
  // Try to add adjacent chunks
  const currentIndex = startChunk.metadata.chunkIndex;
  
  // Add next chunk if available
  const nextChunk = chunks.find(c => c.metadata.chunkIndex === currentIndex + 1);
  if (nextChunk) selected.push(nextChunk);
  
  // Add previous chunk if available
  const prevChunk = chunks.find(c => c.metadata.chunkIndex === currentIndex - 1);
  if (prevChunk) selected.unshift(prevChunk);
  
  // Add any remaining high-relevance chunks (first few from the sorted list)
  const remaining = chunks.filter(c => !selected.includes(c)).slice(0, 2);
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
    const { message, chatHistory = [] } = await request.json();

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'No message provided' },
        { status: 400 },
      );
    }

    // console.log(`🔍 Searching for: "${message}"`);

    // Enhanced multi-query search for better context retrieval
    const primaryResults = await similaritySearch(message, 20);
    
    // Generate query variations to capture different semantic angles
    const queryVariations = await generateQueryVariations(message, chatHistory);
    const enhancedResults = await Promise.all(
      queryVariations.map(variation => similaritySearch(variation, 10))
    );
    
    // Combine and deduplicate results
    const allResults = [
      ...primaryResults,
      ...enhancedResults.flat()
    ];
    
    // Remove duplicates based on chunkId and sort by relevance
    const uniqueResults = Array.from(
      new Map(allResults.map(result => [result.metadata.chunkId, result])).values()
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
    results.forEach(result => {
      const docId = result.metadata.documentId;
      if (!documentGroups.has(docId)) {
        documentGroups.set(docId, []);
      }
      documentGroups.get(docId)!.push(result);
    });
    
    // Sort document groups by relevance (based on first result's position)
    const sortedDocGroups = Array.from(documentGroups.entries())
      .sort(([, a], [, b]) => {
        const aIndex = results.findIndex(r => r.metadata.documentId === a[0].metadata.documentId);
        const bIndex = results.findIndex(r => r.metadata.documentId === b[0].metadata.documentId);
        return aIndex - bIndex;
      });

    // Priority 1: Text input chunks (highest priority)
    const textInputResults = results.filter(r => r.metadata.fileName === 'text-input.txt');
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
      const sortedChunks = docResults.sort((a, b) => a.metadata.chunkIndex - b.metadata.chunkIndex);
      
      // Try to include adjacent chunks for better context continuity
      const selectedChunks = selectAdjacentChunks(sortedChunks);
      
      for (const result of selectedChunks) {
        if (totalChars >= maxChars) break;
        
        const content = (result.pageContent || '').trim();
        if (!content) continue;
        
        // Use longer chunks (1200 instead of 800) for better context
        const chunk = content.length > 1200 ? content.slice(0, 1200) + '...' : content;
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

    // Enhanced system prompt for better context utilization
    const systemPrompt = `You are an expert AI research assistant that analyzes and synthesizes information from provided documents.

CRITICAL INSTRUCTIONS:
- ONLY use information from the Context sections below - no external knowledge
- Provide comprehensive, detailed answers when relevant information is found
- Synthesize information across multiple document chunks when they relate to the same topic
- Pay attention to chunk numbers [Chunk N] to understand document flow and continuity
- Prioritize [TEXT INPUT] sources as they contain direct user-provided information
- When citing sources, reference the document name and chunk number for precision

RESPONSE GUIDELINES:
- If Context contains relevant information: Provide a thorough, well-structured answer
- Cross-reference information between different document chunks when applicable
- Quote specific passages when they directly answer the question
- If Context lacks sufficient information: State "The provided documents do not contain enough information to fully answer this question. Based on the available context, I can only provide: [partial information if any]"

CONTEXT SECTIONS:
${context}

Remember: Your expertise comes from analyzing and connecting the information in the Context above. Build comprehensive answers by synthesizing related information across all provided chunks.`;

    // Build message array for chat completion
    const messages = [
      ...chatHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user' as const, content: message },
    ];

    // console.log(`🤖 Sending to AI with ${context.length} chars of context`);
    const response = await generateChatCompletion(messages, systemPrompt);

    // Create citations with deduplication based on chunkId
    const uniqueCitations = new Map();
    
    results.slice(0, 8).forEach((doc, index) => {
      const chunkId = doc.metadata.chunkId;
      
      // Skip if we already have a citation for this chunk
      if (uniqueCitations.has(chunkId)) {
        return;
      }
      
      const citation = {
        id: `citation-${chunkId}`, // Use chunkId for consistent ID
        documentId: doc.metadata.documentId,
        documentName: doc.metadata.fileName || 'Unknown Document',
        documentType: doc.metadata.fileType || 'text/plain',
        sourceUrl: doc.metadata.sourceUrl,
        chunkId: doc.metadata.chunkId,
        chunkIndex: doc.metadata.chunkIndex || 0,
        content:
          doc.pageContent.length > 200
            ? doc.pageContent.slice(0, 200) + '...'
            : doc.pageContent,
        fullContent: doc.pageContent, // Store full content for citation details
        relevanceScore: Math.max(0.1, 0.95 - index * 0.1),
        uploadedAt: doc.metadata.uploadedAt || new Date().toISOString(),
        isTextInput: doc.metadata.fileName === 'text-input.txt',
        author: ('author' in doc.metadata) ? doc.metadata.author as string : undefined,
        publishedAt: ('publishedAt' in doc.metadata) ? doc.metadata.publishedAt as string : undefined,
      };
      
      uniqueCitations.set(chunkId, citation);
    });
    
    const citations = Array.from(uniqueCitations.values());

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
