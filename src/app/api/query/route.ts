import { NextRequest } from 'next/server';
import { similaritySearch } from '@/lib/qdrant';
import { generateChatCompletion } from '@/lib/openai';
import { withFreemium } from '@/lib/freemium';

export const POST = withFreemium(async (request: NextRequest, user, usage) => {
  const { message, chatHistory = [] } = await request.json();

  if (!message) {
    throw new Error('No message provided');
  }

  // Search for relevant documents using appropriate storage
  const identifier = user ? user.userId : usage.sessionId;
  const searchResults = await similaritySearch(message, identifier, 5, !usage.isAuthenticated);

  // Prepare context from search results
  const context = searchResults
    .map((doc, index) => `[${index + 1}] ${doc.pageContent}`)
    .join('\n\n');

  // Prepare messages for ChatGPT
  const messages = [
    ...chatHistory,
    { role: 'user' as const, content: message }
  ];

  // Generate response
  const response = await generateChatCompletion(messages, context);

  // Prepare citations
  const citations = searchResults.map((doc, index) => ({
    id: `citation-${index}`,
    documentId: doc.metadata.documentId,
    documentName: doc.metadata.fileName,
    chunkId: doc.metadata.chunkId,
    content: doc.pageContent.substring(0, 200) + '...',
    startChar: doc.metadata.startChar,
    endChar: doc.metadata.endChar,
    relevanceScore: 0.9 - index * 0.1, // Approximate relevance score
  }));

  const remainingUsage = {
    uploads: usage.isAuthenticated ? Infinity : (3 - usage.uploads),
    queries: usage.isAuthenticated ? Infinity : (5 - (usage.queries + 1)),
    total: usage.isAuthenticated ? Infinity : (5 - (usage.uploads + usage.queries + 1)),
  };

  return {
    response,
    citations,
    context: searchResults.length > 0,
    remainingUsage,
    isAuthenticated: usage.isAuthenticated,
  };
}, 'query');