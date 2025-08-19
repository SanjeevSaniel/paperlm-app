export const runtime = 'nodejs';

import { generateChatCompletion } from '@/lib/openai';
import type { RAGResult } from '@/lib/qdrant';
import { similaritySearch } from '@/lib/qdrant';
import { NextRequest, NextResponse } from 'next/server';

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

    console.log(`🔍 Searching for: "${message}"`);

    // Perform similarity search with more results to ensure text input is included
    const results: RAGResult[] = await similaritySearch(message, 15);

    if (!results || results.length === 0) {
      return NextResponse.json({
        response:
          "I don't have any relevant documents to answer this question. Please upload documents, add text input, or scrape websites first.",
        citations: [],
        context: false,
      });
    }

    console.log(`📄 Found ${results.length} relevant chunks`);

    // Build comprehensive context including text input
    const contextChunks: string[] = [];
    let totalChars = 0;
    const maxChars = 6000;

    // Prioritize text input chunks if they exist
    const textInputChunks = results.filter(
      (r) => r.metadata.fileName === 'text-input.txt',
    );
    const otherChunks = results.filter(
      (r) => r.metadata.fileName !== 'text-input.txt',
    );

    // Combine prioritizing text input first
    const sortedResults = [...textInputChunks, ...otherChunks];

    for (const result of sortedResults) {
      if (totalChars >= maxChars) break;

      const content = (result.pageContent || '').trim();
      if (!content) continue;

      const chunk =
        content.length > 800 ? content.slice(0, 800) + '...' : content;
      const source =
        result.metadata.fileName === 'text-input.txt'
          ? '[TEXT INPUT]'
          : `[${result.metadata.fileName}]`;

      const contextPiece = `${source} ${chunk}`;

      if (totalChars + contextPiece.length + 20 <= maxChars) {
        contextChunks.push(contextPiece);
        totalChars += contextPiece.length + 20;
      }
    }

    const context = contextChunks.join('\n\n');
    console.log(
      `📝 Built context with ${context.length} characters from ${contextChunks.length} chunks`,
    );

    // Enhanced system prompt
    const systemPrompt = `You are a knowledgeable AI assistant that answers questions based on the provided Context.

IMPORTANT INSTRUCTIONS:
- Use ONLY the information provided in the Context below to answer questions
- If you find relevant information in the Context, provide a comprehensive answer
- If the Context doesn't contain enough information, clearly state: "Based on the provided documents, I don't have enough information to answer this question."
- Always cite your sources using the format shown in the Context
- Pay special attention to [TEXT INPUT] sources as they may contain direct user-provided information

Context:
${context}

Remember: Answer only based on the Context provided above. Do not use external knowledge.`;

    // Build message array for chat completion
    const messages = [
      ...chatHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user' as const, content: message },
    ];

    console.log(`🤖 Sending to AI with ${context.length} chars of context`);
    const response = await generateChatCompletion(messages, systemPrompt);

    // Create citations
    const citations = results.slice(0, 8).map((doc, index) => ({
      id: `citation-${Date.now()}-${index}`,
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
      relevanceScore: Math.max(0.1, 0.95 - index * 0.1),
      uploadedAt: doc.metadata.uploadedAt || new Date().toISOString(),
      isTextInput: doc.metadata.fileName === 'text-input.txt',
    }));

    console.log(`✅ Generated response with ${citations.length} citations`);

    return NextResponse.json({
      response,
      citations,
      context: true,
      searchResults: results.length,
      textInputChunks: textInputChunks.length,
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
